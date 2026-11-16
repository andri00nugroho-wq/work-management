import type { ReactNode } from "react";

/** Kerangka panel form "buat baru" yang dipakai bersama. */
export default function FormShell({
  title,
  subtitle,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
  children,
}: {
  title: string;
  subtitle: string;
  submitLabel: string;
  saving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <form
      className="new-task-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="form-heading">
        <strong>{title}</strong>
        <p>{subtitle}</p>
      </div>

      <div className="form-grid">{children}</div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>
          Batal
        </button>
        <button className="primary-button" disabled={saving}>
          {saving ? "Menyimpan..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
