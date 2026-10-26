import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { uploadAbsolutePath } from "@/lib/uploads";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key } = await ctx.params;
  const storageKey = key.map(decodeURIComponent).join("/");
  if (!storageKey || storageKey.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { org } = await requireOrgContext();
  const attachment = await prisma.attachment.findFirst({
    where: {
      storageKey,
      task: { organizationId: org.id },
    },
  });
  if (!attachment) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buf = await readFile(uploadAbsolutePath(storageKey));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${attachment.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Missing file", { status: 404 });
  }
}
