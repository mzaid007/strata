import { getAppOrigin } from "@/lib/app-origin";

export type AiKind = "summarize" | "draft" | "suggest";

type Provider = "groq" | "google" | "openrouter";

type ProviderConfig = { provider: Provider; apiKey: string; model: string };

/** Current free/developer-tier defaults (verified Oct 2026). Override via env. */
export const AI_DEFAULT_MODELS = {
  groq: "openai/gpt-oss-20b",
  google: "gemini-3.5-flash-lite",
  openrouter: "openrouter/free",
} as const;

/** Configured providers in fallback order: Groq → Google → OpenRouter. */
function configuredProviders(): ProviderConfig[] {
  const list: ProviderConfig[] = [];
  if (process.env.GROQ_API_KEY) {
    list.push({
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || AI_DEFAULT_MODELS.groq,
    });
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    list.push({
      provider: "google",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      model: process.env.GOOGLE_AI_MODEL || AI_DEFAULT_MODELS.google,
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    list.push({
      provider: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || AI_DEFAULT_MODELS.openrouter,
    });
  }
  return list;
}

export function aiConfigured(): boolean {
  return configuredProviders().length > 0;
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

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const text = (await res.text()).trim().replace(/\s+/g, " ");
    if (!text) return "";
    return text.length > 180 ? `${text.slice(0, 180)}…` : text;
  } catch {
    return "";
  }
}

function httpError(label: string, res: Response, detail: string, model: string) {
  const extra = detail ? ` — ${detail}` : "";
  return new Error(`${label} error ${res.status} (model=${model})${extra}`);
}

async function callGroq(apiKey: string, model: string, system: string, user: string) {
  // OpenAI-compatible Chat Completions — https://console.groq.com/docs/api-reference
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
    throw httpError("Groq", res, await readErrorDetail(res), model);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callOpenRouter(apiKey: string, model: string, system: string, user: string) {
  // OpenAI-compatible — https://openrouter.ai/docs/api/reference/overview
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getAppOrigin(process.env.NEXT_PUBLIC_APP_URL),
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
    throw httpError("OpenRouter", res, await readErrorDetail(res), model);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callGoogle(apiKey: string, model: string, system: string, user: string) {
  // Gemini generateContent — https://ai.google.dev/api/generate-content
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
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
    throw httpError("Google AI", res, await readErrorDetail(res), model);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "";
}

async function callProvider(
  cfg: ProviderConfig,
  system: string,
  prompt: string,
): Promise<string> {
  if (cfg.provider === "groq") return callGroq(cfg.apiKey, cfg.model, system, prompt);
  if (cfg.provider === "google") return callGoogle(cfg.apiKey, cfg.model, system, prompt);
  return callOpenRouter(cfg.apiKey, cfg.model, system, prompt);
}

/**
 * Runs an AI assist request, trying configured providers in order until one succeeds.
 * Order: Groq → Google → OpenRouter (only keys present in env are tried).
 */
export async function runAiAssist(kind: AiKind, prompt: string): Promise<string> {
  const providers = configuredProviders();
  if (providers.length === 0) {
    throw new Error(
      "No AI key configured. Set GROQ_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or OPENROUTER_API_KEY.",
    );
  }
  const system = systemFor(kind);
  const errors: string[] = [];

  for (const cfg of providers) {
    try {
      const text = await callProvider(cfg, system, prompt);
      if (text) return text;
      errors.push(`${cfg.provider}: empty response`);
    } catch (e) {
      errors.push(`${cfg.provider}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(`All AI providers failed. ${errors.join("; ")}`);
}
