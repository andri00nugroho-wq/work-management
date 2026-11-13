-- CreateTable
CREATE TABLE "TaskIssueReport" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceKey" TEXT,
    "evidenceName" TEXT,
    "evidenceMimeType" TEXT,
    "evidenceSize" INTEGER,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TaskIssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskIssueReport_evidenceKey_key" ON "TaskIssueReport"("evidenceKey");

-- CreateIndex
CREATE INDEX "TaskIssueReport_taskId_createdAt_idx" ON "TaskIssueReport"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskIssueReport_userId_idx" ON "TaskIssueReport"("userId");

-- AddForeignKey
ALTER TABLE "TaskIssueReport" ADD CONSTRAINT "TaskIssueReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskIssueReport" ADD CONSTRAINT "TaskIssueReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
