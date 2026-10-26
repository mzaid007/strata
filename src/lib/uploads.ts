import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export function uploadAbsolutePath(storageKey: string) {
  const safe = storageKey.replace(/\\/g, "/").replace(/\.\./g, "");
  return path.join(UPLOAD_ROOT, safe);
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
  const abs = uploadAbsolutePath(storageKey);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, bytes);
  return {
    storageKey,
    fileName: file.name.slice(0, 200) || "file",
    mimeType: file.type || "application/octet-stream",
    sizeBytes: bytes.length,
  };
}
