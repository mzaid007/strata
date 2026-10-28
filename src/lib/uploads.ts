import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");

export type BlobAccess = "public" | "private";

/** Durable storage when a Vercel Blob token is configured; local disk otherwise. */
export function remoteUploadsEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Must match the access mode of the configured Blob store. */
export function blobAccess(): BlobAccess {
  return process.env.BLOB_ACCESS === "private" ? "private" : "public";
}

export function uploadAbsolutePath(storageKey: string) {
  const abs = path.resolve(UPLOAD_ROOT, storageKey.replace(/\\/g, "/"));
  if (abs !== UPLOAD_ROOT && !abs.startsWith(`${UPLOAD_ROOT}${path.sep}`)) {
    throw new Error("Invalid storage key");
  }
  return abs;
}

export async function saveUploadFile(file: File): Promise<{
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).slice(0, 16) || "";
  const storageKey = `${new Date().toISOString().slice(0, 10)}/${randomBytes(12).toString("hex")}${ext}`;
  const fileName = file.name.replace(/[\r\n]/g, " ").slice(0, 200) || "file";
  const mimeType = file.type || "application/octet-stream";

  if (remoteUploadsEnabled()) {
    const { put } = await import("@vercel/blob");
    await put(storageKey, bytes, {
      access: blobAccess(),
      contentType: mimeType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { storageKey, fileName, mimeType, sizeBytes: bytes.length };
  }

  const abs = uploadAbsolutePath(storageKey);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, bytes);
  return { storageKey, fileName, mimeType, sizeBytes: bytes.length };
}

/** Reads via Blob when configured, falling back to local files from before the switch. */
export async function readUploadFile(storageKey: string): Promise<Buffer> {
  if (remoteUploadsEnabled()) {
    try {
      const { get } = await import("@vercel/blob");
      const result = await get(storageKey, {
        access: blobAccess(),
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      if (result?.statusCode === 200) {
        return Buffer.from(await new Response(result.stream).arrayBuffer());
      }
    } catch {
      // Fall through to local disk for attachments saved before Blob was enabled.
    }
  }
  return readFile(uploadAbsolutePath(storageKey));
}
