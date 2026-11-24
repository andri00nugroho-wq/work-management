import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_TASK_FILE_BYTES = 25 * 1024 * 1024;

export class TaskFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskFileError";
  }
}

function directory() {
  return path.join(process.cwd(), ".local-data", "task-files");
}

function filePath(key: string) {
  if (!/^[0-9a-f-]{36}(\.[a-z0-9]{1,8})?$/i.test(key)) throw new Error("Kunci berkas tidak valid.");
  return path.join(directory(), key);
}

export function safeFileName(value: string) {
  return (
    value
      .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "berkas"
  );
}

export async function saveTaskFile(file: File) {
  if (file.size === 0) throw new TaskFileError("Berkas tidak boleh kosong.");
  if (file.size > MAX_TASK_FILE_BYTES) throw new TaskFileError("Ukuran berkas maksimal 25 MB.");

  const name = safeFileName(file.name);
  const extension = name.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() ?? "";
  const key = `${randomUUID()}${extension ? `.${extension}` : ""}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(directory(), { recursive: true });
  await writeFile(filePath(key), bytes, { flag: "wx" });

  const mimeType = /^[\w.+-]+\/[\w.+-]+$/.test(file.type) ? file.type : "application/octet-stream";
  return { key, name, mimeType, size: bytes.length };
}

export function readTaskFile(key: string) {
  return readFile(filePath(key));
}

export async function removeTaskFile(key: string) {
  try {
    await unlink(filePath(key));
  } catch {
    // Berkas mungkin sudah tidak ada.
  }
}

export const ATTACHMENT_SELECT = {
  id: true,
  name: true,
  mimeType: true,
  size: true,
  version: true,
  note: true,
  createdAt: true,
  uploadedBy: { select: { id: true, name: true } },
} as const;
