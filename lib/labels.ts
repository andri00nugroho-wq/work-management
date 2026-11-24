const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Validasi input label: nama 1-40 karakter, warna hex #rrggbb. */
export function parseLabelInput(
  body: Record<string, unknown>
): { name: string; color: string } | { error: string } {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = typeof body.color === "string" ? body.color.trim() : "#6d5bd0";
  if (!name || name.length > 40) return { error: "Nama label wajib diisi (maksimal 40 karakter)." };
  if (!COLOR_PATTERN.test(color)) return { error: "Warna label harus format hex, mis. #6d5bd0." };
  return { name, color };
}
