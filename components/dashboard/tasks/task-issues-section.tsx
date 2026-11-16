"use client";

import { useState } from "react";
import { ISSUE_EVIDENCE_TYPES, ISSUE_MAX_FILE_SIZE } from "../constants";
import { errorText, formatDateTime, formatFileSize } from "../lib/format";
import { request } from "../lib/http";
import type { Task, TaskIssueReport, TaskPatcher } from "../types";

export default function TaskIssuesSection({
  task,
  onPatch,
}: {
  task: Task;
  onPatch: TaskPatcher;
}) {
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // Ganti key untuk mengosongkan <input type="file">.
  const [fileInputKey, setFileInputKey] = useState(0);
  const reports = task.issueReports ?? [];

  function rejectFile(message: string) {
    setEvidence(null);
    setError(message);
    setFileInputKey((key) => key + 1);
  }

  function pickEvidence(file: File | null) {
    if (file && file.size > ISSUE_MAX_FILE_SIZE) {
      rejectFile("Ukuran file bukti maksimal 10 MB.");
      return;
    }
    if (file && !ISSUE_EVIDENCE_TYPES.includes(file.type)) {
      rejectFile("Pilih gambar JPG, PNG, WebP, atau file PDF.");
      return;
    }
    setEvidence(file);
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = description.trim();
    if (!text) {
      setError("Jelaskan kendala yang terjadi.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.set("description", text);
      if (evidence) body.set("evidence", evidence);

      const result = await request<{ issueReport: TaskIssueReport }>(
        `/api/tasks/${task.id}/issues`,
        { method: "POST", body },
        "Laporan kendala gagal disimpan."
      );
      onPatch(task.id, { issueReports: [result.issueReport, ...reports] });
      setDescription("");
      setEvidence(null);
      setFileInputKey((key) => key + 1);
    } catch (err) {
      setError(errorText(err, "Gagal mengirim laporan kendala."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="task-issues-section">
      <div className="task-issues-heading">
        <h3>Riwayat kendala</h3>
        <span>{reports.length} laporan</span>
      </div>

      {reports.length ? (
        <ul className="task-issue-list">
          {reports.map((report) => (
            <li key={report.id}>
              <div className="task-issue-meta">
                <strong>{report.user.name}</strong>
                <time dateTime={report.createdAt}>{formatDateTime(report.createdAt)}</time>
              </div>
              <p>{report.description}</p>
              {report.evidenceName && report.evidenceMimeType && (
                <a
                  className="task-issue-evidence"
                  href={`/api/tasks/${task.id}/issues/${report.id}/evidence`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ↗ Bukti: {report.evidenceName}
                  {report.evidenceSize !== null && ` · ${formatFileSize(report.evidenceSize)}`}
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="task-issue-empty">Belum ada kendala yang dilaporkan.</p>
      )}

      <form className="task-issue-form" onSubmit={submit}>
        <label>
          Jelaskan kendala *
          <textarea
            value={description}
            maxLength={5000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ceritakan masalah atau hambatan yang terjadi..."
            rows={3}
            required
          />
        </label>
        <label>
          Bukti kendala <span>(opsional)</span>
          <input
            key={fileInputKey}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => pickEvidence(event.target.files?.[0] ?? null)}
          />
          <small>JPG, PNG, WebP, atau PDF · maksimal 10 MB</small>
        </label>
        {evidence && (
          <p className="task-issue-selected-file">
            File dipilih: {evidence.name} · {formatFileSize(evidence.size)}
          </p>
        )}
        {error && (
          <p className="task-link-error" role="alert">
            {error}
          </p>
        )}
        <div className="task-issue-actions">
          <span>Bukti tidak wajib disertakan.</span>
          <button className="primary-button" disabled={saving}>
            {saving ? "Mengirim..." : "Kirim laporan kendala"}
          </button>
        </div>
      </form>
    </div>
  );
}
