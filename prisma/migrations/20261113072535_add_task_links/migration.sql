-- CreateTable
CREATE TABLE "TaskLink" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "TaskLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskLink_taskId_idx" ON "TaskLink"("taskId");

-- AddForeignKey
ALTER TABLE "TaskLink" ADD CONSTRAINT "TaskLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
