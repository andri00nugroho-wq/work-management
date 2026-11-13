-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskAssignment_userId_status_idx" ON "TaskAssignment"("userId", "status");

-- CreateIndex
CREATE INDEX "TaskAssignment_taskId_status_idx" ON "TaskAssignment"("taskId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_userId_key" ON "TaskAssignment"("taskId", "userId");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_taskId_createdAt_idx" ON "Activity"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_divisionId_idx" ON "Task"("divisionId");

-- CreateIndex
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
