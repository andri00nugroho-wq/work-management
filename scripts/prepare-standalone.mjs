import { cp, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDir = path.join(projectRoot, ".next", "standalone");

const runtimeEntries = await readdir(runtimeDir, { withFileTypes: true });
for (const entry of runtimeEntries) {
  if (
    entry.name.startsWith(".env") ||
    [
      "AGENTS.md",
      "README.md",
      "ARCHITECTURE.md",
      ".local-data",
      "prisma",
      "prisma.config.ts",
      "scripts",
    ].includes(entry.name)
  ) {
    await rm(path.join(runtimeDir, entry.name), { recursive: true, force: true });
  }
}

await cp(path.join(projectRoot, "public"), path.join(runtimeDir, "public"), {
  recursive: true,
  force: true,
});
await cp(
  path.join(projectRoot, ".next", "static"),
  path.join(runtimeDir, ".next", "static"),
  { recursive: true, force: true }
);
