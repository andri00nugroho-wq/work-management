function messageFrom(data: unknown, fallback: string) {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }
  return fallback;
}

/** Wrapper fetch: selalu parse JSON dan lempar Error dengan pesan dari server. */
export async function request<T>(
  url: string,
  init: RequestInit = {},
  fallback = "Permintaan ke server gagal."
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers ?? {}),
    },
  });

  let result: unknown = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) throw new Error(messageFrom(result, fallback));
  return result as T;
}

/** API boleh mengirim array langsung ataupun { key: [...] }. */
export function pickList<T>(result: unknown, key: string): T[] {
  if (Array.isArray(result)) return result as T[];
  if (typeof result === "object" && result !== null && key in result) {
    const value = (result as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}
