-- Isi waktu selesai untuk tugas yang sudah berstatus DONE sebelum kolom ini ada.
UPDATE "Task" SET "completedAt" = "updatedAt" WHERE "status" = 'DONE' AND "completedAt" IS NULL;
