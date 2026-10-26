export type AiKind = "summarize" | "draft" | "suggest";

type Provider = "groq" | "google" | "openrouter";

function pickProvider(): { provider: Provider; apiKey: string; model: string } | null {
  if (process.env.GROQ_API_KEY) {
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    };
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      provider: "google",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      model: process.env.GOOGLE_AI_MODEL || "gemini-2.0-flash",
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      provider: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free",
    };
  }
  return null;
}

export function aiConfigured(): boolean {
  return pickProvider() !== null;
}

function systemFor(kind: AiKind) {
  switch (kind) {
    case "summarize":
      return "You summarize work tasks for an internal team. Be concise (3-6 bullets). No markdown headings.";
    case "draft":
      return "You draft a clear task description or status update for an internal work tool. Keep it under 120 words.";
    case "suggest":
      return "You suggest 4-6 practical subtasks as a plain numbered list. No preamble.";
  }
}

async function callGroq(apiKey: string, model: string, system: string, user: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Groq error ${res.status}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callOpenRouter(apiKey: string, model: string, system: string, user: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Strata",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenRouter error ${res.status}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callGoogle(apiKey: string, model: string, system: string, user: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Google AI error ${res.status}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "";
}

export async function runAiAssist(kind: AiKind, prompt: string): Promise<string> {
  const cfg = pickProvider();
  if (!cfg) {
    throw new Error(
      "No AI key configured. Set GROQ_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or OPENROUTER_API_KEY.",
    );
  }
  const system = systemFor(kind);
  if (cfg.provider === "groq") return callGroq(cfg.apiKey, cfg.model, system, prompt);
  if (cfg.provider === "google") return callGoogle(cfg.apiKey, cfg.model, system, prompt);
  return callOpenRouter(cfg.apiKey, cfg.model, system, prompt);
}
