import { NextResponse, type NextRequest } from "next/server";

/** Optimistic redirect untuk halaman dashboard sebelum render server dimulai. */
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has("token");
  const hasApiKey = (request.headers.get("authorization") ?? "").startsWith("Bearer rei_");

  if (!hasSessionCookie && !hasApiKey) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: "/" };
