import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { uploadAbsolutePath } from "@/lib/uploads";

function contentDisposition(fileName: string): string {
  const cleaned = fileName.replace(/[\r\n"'\\]/g, "_").slice(0, 150) || "download";
  const ascii = cleaned.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(cleaned).replace(
    /['()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key } = await ctx.params;

  let storageKey: string;
  try {
    storageKey = key.map(decodeURIComponent).join("/");
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
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
        // Always download: never render user-supplied HTML/SVG on the app origin.
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": contentDisposition(attachment.fileName),
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Missing file", { status: 404 });
  }
}
