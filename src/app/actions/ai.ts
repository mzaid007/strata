"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { actionFail, actionOk, type ActionState } from "@/lib/action-result";
import { aiConfigured, runAiAssist, type AiKind } from "@/lib/ai";

export async function runTaskAi(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const taskId = String(formData.get("taskId") ?? "");
  const kind = String(formData.get("kind") ?? "") as AiKind;

  if (!taskId) return actionFail("Missing task.");
  if (!["summarize", "draft", "suggest"].includes(kind)) {
    return actionFail("Unknown AI action.");
  }
  if (!aiConfigured()) {
    return actionFail(
      "No AI key set. Add GROQ_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or OPENROUTER_API_KEY to .env.",
    );
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId: org.id },
    include: {
      comments: { include: { author: true }, orderBy: { createdAt: "asc" }, take: 20 },
    },
  });
  if (!task) return actionFail("Task not found.");

  const commentBlock = task.comments
    .map((c) => `${c.author.name}: ${c.body}`)
    .join("\n");

  const prompt = [
    `Title: ${task.title}`,
    `Description: ${task.description || "(empty)"}`,
    commentBlock ? `Comments:\n${commentBlock}` : "Comments: none",
  ].join("\n");

  try {
    const text = await runAiAssist(kind, prompt);
    if (!text) return actionFail("Model returned an empty response.");
    return { ok: true, message: text };
  } catch (e) {
    console.error("AI assist failed", e);
    return actionFail(
      process.env.NODE_ENV === "production"
        ? "AI request failed. Try again later."
        : e instanceof Error
          ? e.message
          : "AI request failed.",
    );
  }
}
