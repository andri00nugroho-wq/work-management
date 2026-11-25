"use client";

import { useState } from "react";
import { STATUSES, STATUS_LABEL } from "../constants";
import type { WipLimits } from "../types";
import { Panel } from "../ui";

/** Atur batas jumlah kartu per kolom Kanban (kosong = tanpa batas). */
export default function WipSettingsPanel({
  wipLimits,
  onSave,
}: {
  wipLimits: WipLimits;
  onSave: (limits: WipLimits) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(STATUSES.map((status) => [status, wipLimits[status] ? String(wipLimits[status]) : ""]))
  );
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const limits: WipLimits = {};
    for (const status of STATUSES) {
      const value = Number(draft[status]);
      if (draft[status] && Number.isInteger(value) && value > 0) limits[status] = value;
    }
    await onSave(limits);
    setSaving(false);
  }

  return (
    <Panel
      className="tasks-panel settings-panel"
      headingClassName="tasks-heading"
      title="Batas WIP Kanban"
      subtitle="Batasi jumlah kartu per kolom agar tim fokus menyelesaikan pekerjaan. Kosongkan untuk tanpa batas."
    >
      <form className="wip-form" onSubmit={save}>
        {STATUSES.filter((status) => status !== "DONE").map((status) => (
          <label key={status}>
            {STATUS_LABEL[status]}
            <input
              type="number"
              min={1}
              max={999}
              inputMode="numeric"
              placeholder="Tanpa batas"
              value={draft[status]}
              onChange={(event) => setDraft({ ...draft, [status]: event.target.value })}
            />
          </label>
        ))}
        <button className="primary-button" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan batas"}
        </button>
      </form>
    </Panel>
  );
}
