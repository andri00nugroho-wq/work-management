import { createHash, randomBytes } from "node:crypto";

export const API_KEY_PREFIX = "rei_";

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

/** Kunci baru: rei_<8 karakter penanda>_<rahasia>. Hanya hash yang disimpan. */
export function generateApiKey() {
  const prefix = randomBytes(4).toString("hex");
  const secret = randomBytes(24).toString("base64url");
  const key = `${API_KEY_PREFIX}${prefix}_${secret}`;
  return { key, prefix: `${API_KEY_PREFIX}${prefix}`, keyHash: hashApiKey(key) };
}
