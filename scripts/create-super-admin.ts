import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient, UserRole } from "../app/generated/prisma/client";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prisma = new PrismaClient();

const rl = createInterface({ input, output });

async function main() {
  const name = await rl.question("Nama Super Admin: ");
  const email = (await rl.question("Email Super Admin: "))
    .trim()
    .toLowerCase();
  const password = await rl.question("Password Super Admin: ");

  if (!name.trim() || !email || !password) {
    throw new Error("Nama, email, dan password wajib diisi.");
  }

  if (password.length < 12) {
    throw new Error("Password minimal 12 karakter.");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error(
      "Email tersebut sudah terdaftar. Gunakan email lain atau periksa akun yang ada."
    );
  }

  const passwordHash = await hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log("\nSuper Admin berhasil dibuat:");
  console.log(admin);
}

main()
  .catch((error) => {
    console.error("\nGagal membuat Super Admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });