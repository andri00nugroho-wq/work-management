"use client";

import { faPlay } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useState } from "react";
import { useAsyncAction } from "../hooks/use-async-action";
import { request } from "../lib/http";
import type { AutomationSettings } from "../types";
import { Panel, SectionMessages } from "../ui";

const TOGGLES: Array<{ key: Exclude<keyof AutomationSettings, "dueReminderHours">; title: string; detail: string }> = [
  {
    key: "autoReviewWhenSubtasksDone",
    title: "Sub-tugas selesai → Menunggu Review",
    detail: "Saat semua sub-tugas dicentang, status tugas dipindah otomatis dan pembuat tugas diberi tahu.",
  },
  {
    key: "overdueAlerts",
    title: "Peringatan tugas terlambat",
    detail: "Penanggung jawab & pelaksana diberi tahu sekali saat tenggat terlewat.",
  },
  {
    key: "notifySupervisorOnOverdue",
    title: "Sertakan supervisor divisi",
    detail: "Supervisor divisi ikut menerima peringatan tugas terlambat.",
  },
  {
    key: "notifyDependents",
    title: "Kabari tugas yang menunggu",
    detail: "Saat prasyarat selesai, pemilik tugas yang terblokir diberi tahu bahwa tugasnya siap dikerjakan.",
  },
];

/** Aturan otomatisasi tanpa kode (pemicu → aksi). */
export default function AutomationPanel({ canEdit }: { canEdit: boolean }) {
  const [rules, setRules] = useState<AutomationSettings | null>(null);
  const action = useAsyncAction();

  useEffect(() => {
    request<{ rules: AutomationSettings }>("/api/settings/automation", {}, "Aturan gagal dimuat.")
      .then((result) => setRules(result.rules))
      .catch(() => setRules(null));
  }, []);

  function save(next: AutomationSettings) {
    setRules(next);
    void action.run(async () => {
      const result = await request<{ rules: AutomationSettings }>(
        "/api/settings/automation",
        { method: "PUT", body: JSON.stringify(next) },
        "Aturan gagal disimpan."
      );
      setRules(result.rules);
      return "Aturan otomatisasi disimpan.";
    }, "Aturan gagal disimpan.");
  }

  function runNow() {
    void action.run(async () => {
      const result = await request<{ reminders: number; overdue: number }>(
        "/api/automation/run",
        { method: "POST" },
        "Pemeriksaan gagal dijalankan."
      );
      return `Pemeriksaan selesai: ${result.reminders} pengingat tenggat, ${result.overdue} peringatan terlambat dikirim.`;
    }, "Pemeriksaan gagal dijalankan.");
  }

  return (
    <Panel
      className="tasks-panel settings-panel settings-wide"
      headingClassName="tasks-heading"
      title="Otomatisasi alur kerja"
      subtitle="Aturan pemicu → aksi yang berjalan otomatis. Pemeriksaan tenggat berjalan tiap 5 menit."
      aside={
        canEdit ? (
          <button type="button" className="secondary-button" disabled={action.busy} onClick={runNow}>
            <Icon icon={faPlay} /> Jalankan pemeriksaan sekarang
          </button>
        ) : undefined
      }
    >
      {!rules ? (
        <p className="settings-empty">Memuat aturan...</p>
      ) : (
        <div className="automation-list">
          <label className="automation-rule">
            <span>
              <strong>Pengingat menjelang tenggat</strong>
              <small>Kirim pengingat ke penanggung jawab & pelaksana sebelum tenggat. 0 = matikan.</small>
            </span>
            <span className="automation-hours">
              <input
                type="number"
                min={0}
                max={168}
                disabled={!canEdit}
                value={rules.dueReminderHours}
                onChange={(event) => setRules({ ...rules, dueReminderHours: Number(event.target.value) })}
                onBlur={() => canEdit && save(rules)}
                aria-label="Jam sebelum tenggat"
              />
              jam sebelumnya
            </span>
          </label>
          {TOGGLES.map((toggle) => (
            <label key={toggle.key} className="automation-rule">
              <span>
                <strong>{toggle.title}</strong>
                <small>{toggle.detail}</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="switch"
                disabled={!canEdit || action.busy}
                checked={rules[toggle.key]}
                onChange={(event) => save({ ...rules, [toggle.key]: event.target.checked })}
              />
            </label>
          ))}
          <p className="automation-note">
            Selalu aktif: tugas berulang otomatis membuat kejadian berikutnya saat diselesaikan; penanggung jawab,
            pihak yang di-mention, dan peserta tugas menerima pemberitahuan di kotak masuk.
          </p>
        </div>
      )}
      <div className="automation-messages">
        <SectionMessages error={action.error} notice={action.notice} />
      </div>
    </Panel>
  );
}
