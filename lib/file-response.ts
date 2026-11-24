/** Tipe yang aman ditampilkan langsung di browser; selain ini selalu diunduh (cegah XSS). */
const INLINE_SAFE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
]);

/** Respons unduhan berkas dengan header aman. */
export function fileResponse(bytes: Buffer<ArrayBuffer>, name: string, mimeType: string, forceDownload = false) {
  const inline = !forceDownload && INLINE_SAFE.has(mimeType);
  const asciiName = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encodedName = encodeURIComponent(name).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return new Response(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength), {
    headers: {
      "Content-Type": inline ? mimeType : "application/octet-stream",
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    },
  });
}
