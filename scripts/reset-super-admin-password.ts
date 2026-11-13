
import "dotenv/config";
import bcrypt from "bcryptjs";
import readline from "node:readline";
import { prisma } from "../lib/prisma";

const ADMIN_EMAIL = "andrinugrohoitdev@rajaemas.id";

function promptHidden(label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = process.stdin as NodeJS.ReadStream & {
      setRawMode?: (mode: boolean) => void;
    };

    if (!input.isTTY || !input.setRawMode) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(
        `${label} (input akan terlihat di terminal ini): `,
        (answer) => {
          rl.close();
          resolve(answer);
        },
      );
      return;
    }

    process.stdout.write(label);
    let value = "";

    const cleanup = () => {
      input.removeListener("data", onData);
      input.setRawMode!(false);
      input.pause();
      process.stdout.write("\n");
    };

    const onData = (chunk: Buffer | string) => {
      const key = chunk.toString();

      if (key === "\u0003") {
        cleanup();
        reject(new Error("Proses dibatalkan."));
        return;
      }

      if (key === "\r" || key === "\n") {
        cleanup();
        resolve(value);
        return;
      }

      if (key === "\u007f" || key === "\b") {
        value = value.slice(0, -1);
        return;
      }

      if (key >= " " && key !== "\u007f") {
        value += key;
      }
    };

    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");
    input.on("data", onData);
  });
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error(`Akun ${ADMIN_EMAIL} tidak ditemukan.`);
  }

  if (user.role !== "SUPER_ADMIN") {
    throw new Error(
      `Dibatalkan: role akun ini adalah ${user.role}, bukan SUPER_ADMIN.`,
    );
  }

  console.log("\nAkun Super Admin ditemukan.");
  console.log(`Nama   : ${user.name}`);
  console.log(`Email  : ${user.email}`);
  console.log(`Role   : ${user.role}`);
  console.log(`Aktif  : ${user.isActive ? "Ya" : "Tidak"}`);

  if (!user.isActive) {
    throw new Error("Akun tidak aktif. Password tidak diubah.");
  }

  const password = await promptHidden("\nMasukkan password baru: ");

  if (password.length < 12) {
    throw new Error("Password minimal 12 karakter. Silakan jalankan ulang.");
  }

  const confirmation = await promptHidden("Ulangi password baru: ");

  if (password !== confirmation) {
    throw new Error("Password tidak cocok. Password tidak diubah.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log("\nPassword Super Admin berhasil direset.");
  console.log("Email dan role akun tidak berubah.");
  console.log("Silakan login kembali menggunakan password baru.");
}

main()
  .catch((error: unknown) => {
    console.error(
      "\nGagal mereset password:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
