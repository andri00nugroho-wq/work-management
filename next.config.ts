import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Output kecil untuk image/container AWS; jalankan dengan server.js standalone.
  output: "standalone",
  // Prisma memakai dynamic filesystem lookup; cegah tracing menyalin file repo
  // dan secret yang tidak dibutuhkan saat runtime.
  outputFileTracingExcludes: {
    "/*": [
      "./.env*",
      "./AGENTS.md",
      "./README.md",
      "./ARCHITECTURE.md",
      "./scripts/**",
      "./prisma/**",
      "./prisma.config.ts",
    ],
  },
  // Hardening standar enterprise; HSTS berlaku saat aplikasi diakses via HTTPS.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
