import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_CHAT_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_CHAT_FILES_PER_MESSAGE = 10;

export type StoredChatFile = {
  key: string;
  name: string;
  mimeType: string;
  size: number;
};

export class ChatFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatFileError";
  }
}

function chatFileDirectory() {
  return path.join(process.cwd(), ".local-data", "chat-files");
}

function chatFilePath(key: string) {
  if (!/^[0-9a-f-]{36}(\.[a-z0-9]{1,8})?$/i.test(key)) {
    throw new Error("Kunci file chat tidak valid.");
  }
  return path.join(chatFileDirectory(), key);
}

function normalizeMimeType(value: string) {
  return /^[\w.+-]+\/[\w.+-]+$/.test(value) ? value : "application/octet-stream";
}

function safeFileName(value: string) {
  return (
    value
      .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "berkas"
  );
}

export async function saveChatFile(file: File): Promise<StoredChatFile> {
  if (file.size === 0) throw new ChatFileError("Berkas tidak boleh kosong.");
  if (file.size > MAX_CHAT_FILE_BYTES) {
    throw new ChatFileError("Ukuran tiap berkas maksimal 50 MB.");
  }

  const name = safeFileName(file.name);
  const extension = name.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() ?? "";
  const key = `${randomUUID()}${extension ? `.${extension}` : ""}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(chatFileDirectory(), { recursive: true });
  await writeFile(chatFilePath(key), bytes, { flag: "wx" });

  return {
    key,
    name,
    mimeType: normalizeMimeType(file.type),
    size: bytes.length,
  };
}

export async function readChatFile(key: string) {
  return readFile(chatFilePath(key));
}

export async function removeChatFile(key: string) {
  try {
    await unlink(chatFilePath(key));
  } catch {
    // Berkas mungkin sudah tidak ada; tidak perlu menggagalkan permintaan.
  }
}
