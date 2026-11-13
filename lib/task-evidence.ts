import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_TASK_EVIDENCE_BYTES = 10 * 1024 * 1024;

const EVIDENCE_TYPES = {
  "image/jpeg": { extension: ".jpg", fallbackName: "evidence.jpg" },
  "image/png": { extension: ".png", fallbackName: "evidence.png" },
  "image/webp": { extension: ".webp", fallbackName: "evidence.webp" },
  "application/pdf": { extension: ".pdf", fallbackName: "evidence.pdf" },
} as const;

export type TaskEvidenceMimeType = keyof typeof EVIDENCE_TYPES;

export type StoredTaskEvidence = {
  key: string;
  name: string;
  mimeType: TaskEvidenceMimeType;
  size: number;
};

export class TaskEvidenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskEvidenceError";
  }
}

function evidenceDirectory() {
  return path.join(process.cwd(), ".local-data", "task-evidence");
}

function hasExpectedSignature(bytes: Buffer, mimeType: TaskEvidenceMimeType) {
  switch (mimeType) {
    case "image/jpeg":
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case "image/webp":
      return (
        bytes.length >= 12 &&
        bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP"
      );
    case "application/pdf":
      return bytes.toString("ascii", 0, 5) === "%PDF-";
  }
}

function evidencePath(key: string) {
  if (!/^[\da-f-]{36}\.(jpg|png|webp|pdf)$/i.test(key)) {
    throw new Error("Kunci bukti tidak valid.");
  }
  return path.join(evidenceDirectory(), key);
}

export async function saveTaskEvidence(file: File): Promise<StoredTaskEvidence> {
  if (file.size === 0) throw new TaskEvidenceError("File bukti tidak boleh kosong.");
  if (file.size > MAX_TASK_EVIDENCE_BYTES) {
    throw new TaskEvidenceError("Ukuran file bukti maksimal 10 MB.");
  }

  if (!Object.hasOwn(EVIDENCE_TYPES, file.type)) {
    throw new TaskEvidenceError("Bukti harus berupa gambar JPG, PNG, WebP, atau PDF.");
  }

  const mimeType = file.type as TaskEvidenceMimeType;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasExpectedSignature(bytes, mimeType)) {
    throw new TaskEvidenceError("Isi file tidak sesuai dengan format bukti yang dipilih.");
  }

  const typeInfo = EVIDENCE_TYPES[mimeType];
  const key = `${randomUUID()}${typeInfo.extension}`;
  const safeName =
    file.name
      .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
      .trim()
      .slice(0, 180) || typeInfo.fallbackName;

  await mkdir(evidenceDirectory(), { recursive: true });
  await writeFile(evidencePath(key), bytes, { flag: "wx" });

  return { key, name: safeName, mimeType, size: bytes.length };
}

export async function readTaskEvidence(key: string) {
  return readFile(evidencePath(key));
}

export async function removeTaskEvidence(key: string) {
  await unlink(evidencePath(key));
}
