#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

const PREFIX = "rei-work-management-";
try {
  process.loadEnvFile(".env");
} catch {
  // Deployment biasanya sudah menyediakan environment variable.
}
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL wajib diisi. Jalankan dari root proyek: npm run db:backup");
  process.exit(1);
}

const target = new URL(databaseUrl);
const database = decodeURIComponent(target.pathname.replace(/^\//, ""));
const backupDir = path.resolve(process.env.BACKUP_DIR || ".local-data/backups");
const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 14);
const pgDump = process.env.PG_DUMP || "pg_dump";
const s3Uri = process.env.BACKUP_S3_URI?.trim() || null;
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dumpFile = path.join(backupDir, `${PREFIX}${stamp}.dump`);

function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} keluar dengan kode ${code}.`));
    });
  });
}

async function cleanupOldBackups() {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return 0;
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const entries = await readdir(backupDir).catch(() => []);
  let removed = 0;
  for (const entry of entries) {
    if (!entry.startsWith(PREFIX) || !entry.endsWith(".dump")) continue;
    const file = path.join(backupDir, entry);
    const info = await stat(file).catch(() => null);
    if (info && info.mtimeMs < cutoff) {
      await unlink(file);
      removed += 1;
    }
  }
  return removed;
}

try {
  await mkdir(backupDir, { recursive: true });

  await run(pgDump, [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--host",
    target.hostname,
    "--port",
    target.port || "5432",
    "--username",
    decodeURIComponent(target.username),
    "--file",
    dumpFile,
    database,
  ], {
    ...process.env,
    PGPASSWORD: decodeURIComponent(target.password),
  });

  const info = await stat(dumpFile);
  if (info.size === 0) throw new Error("Dump database kosong.");

  if (s3Uri) {
    const key = `${s3Uri.replace(/\/$/, "")}/${path.basename(dumpFile)}`;
    await run("aws", ["s3", "cp", dumpFile, key]);
    console.log(`Backup diunggah ke ${key}`);
  }

  const removed = await cleanupOldBackups();
  console.log(
    `Backup selesai: ${dumpFile} (${(info.size / 1024 / 1024).toFixed(2)} MB)` +
      (removed ? `, ${removed} backup lama dihapus.` : ".")
  );
} catch (error) {
  console.error(`Backup gagal: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
