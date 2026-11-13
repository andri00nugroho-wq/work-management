-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('AVAILABLE', 'MEETING', 'LEAVE', 'SLOW_RESPONSE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chatStatus" "ChatStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "chatStatusNote" TEXT;
