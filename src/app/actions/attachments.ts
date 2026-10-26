"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { actionFail, actionOk, type ActionState } from "@/lib/action-result";
import { saveUploadFile } from "@/lib/uploads";

const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadAttachment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { session, org } = await requireOrgContext();
  const taskId = String(formData.get("taskId") ?? "");
  const file = formData.get("file");

  if (!taskId) return actionFail("Missing task.");
  if (!(file instanceof File) || file.size === 0) {
    return actionFail("Choose a file to upload.", { file: "Required" });
  }
  if (file.size > MAX_BYTES) {
    return actionFail("File is too large (max 8 MB).", { file: "Too large" });
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId: org.id },
  });
  if (!task) return actionFail("Task not found in this workspace.");

  const saved = await saveUploadFile(file);
  await prisma.attachment.create({
    data: {
      taskId,
      uploaderId: session.user.id,
      fileName: saved.fileName,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      storageKey: saved.storageKey,
    },
  });

  revalidatePath(`/tasks/${taskId}`);
  return actionOk("Attachment uploaded.");
}
