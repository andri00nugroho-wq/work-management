import { SignJWT } from "jose";

export const COOKIE_NAME = "token";
export const SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export async function createSessionToken(userId: string) {
  const secretValue = process.env.JWT_SECRET;
  if (!secretValue) throw new Error("JWT_SECRET belum diatur di .env");

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(new TextEncoder().encode(secretValue));
}
