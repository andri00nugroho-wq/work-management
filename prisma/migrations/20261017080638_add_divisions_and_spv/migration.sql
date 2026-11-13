-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SPV';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "divisionId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "divisionId" TEXT;

-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supervisorId" TEXT,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Division_name_key" ON "Division"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Division_supervisorId_key" ON "Division"("supervisorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
