"use client";

import { faCopy, faPlus, faTrashCan, faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useState } from "react";
import { PRIORITY_LABEL } from "../constants";
import { useAsyncAction } from "../hooks/use-async-action";
import { request } from "../lib/http";
import type { IntakeForm, Member, Project, TaskPriority } from "../types";
import { EmptyRow, Panel, SectionMessages } from "../ui";

/** Kelola formulir permintaan kerja (hasilnya otomatis menjadi tugas). */
export default function IntakePanel({ members, projects }: { members: Member[]; projects: Project[] }) {
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [draft, setDraft] = useState({ name: "", projectId: "", assigneeId: "", defaultPriority: "MEDIUM", isPublic: false });
  const action = useAsyncAction();

  useEffect(() => {
    request<{ forms: IntakeForm[] }>("/api/intake-forms", {}, "Formulir gagal dimuat.")
      .then((result) => setForms(result.forms))
      .catch(() => {});
  }, []);

  const link = (form: IntakeForm) => `${window.location.origin}/request/${form.slug}`;

  function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    void action.run(async () => {
      const result = await request<{ form: IntakeForm }>(
        "/api/intake-forms",
        {
          method: "POST",
          body: JSON.stringify({
            ...draft,
            name: draft.name.trim(),
            projectId: draft.projectId || null,
            assigneeId: draft.assigneeId || null,
          }),
        },
        "Formulir gagal dibuat."
      );
      setForms((list) => [result.form, ...list]);
      setDraft({ ...draft, name: "" });
      return `Formulir "${result.form.name}" dibuat. Salin tautannya untuk dibagikan.`;
    }, "Formulir gagal dibuat.");
  }

  function patch(form: IntakeForm, data: Partial<Pick<IntakeForm, "isActive" | "isPublic">>) {
    void action.run(async () => {
      const result = await request<{ form: IntakeForm }>(
        `/api/intake-forms/${form.id}`,
        { method: "PATCH", body: JSON.stringify(data) },
        "Formulir gagal diperbarui."
      );
      setForms((list) => list.map((item) => (item.id === form.id ? result.form : item)));
    }, "Formulir gagal diperbarui.");
  }

  function remove(form: IntakeForm) {
    if (!window.confirm(`Hapus formulir "${form.name}"? Tugas yang sudah masuk tetap ada.`)) return;
    void action.run(async () => {
      await request(`/api/intake-forms/${form.id}`, { method: "DELETE" }, "Formulir gagal dihapus.");
      setForms((list) => list.filter((item) => item.id !== form.id));
    }, "Formulir gagal dihapus.");
  }

  async function copy(form: IntakeForm) {
    try {
      await navigator.clipboard.writeText(link(form));
      action.clear();
      void action.run(async () => "Tautan formulir disalin.", "");
    } catch {
      window.prompt("Salin tautan ini:", link(form));
    }
  }

  return (
    <Panel
      className="tasks-panel settings-panel settings-wide"
      headingClassName="tasks-heading"
      title="Formulir permintaan"
      subtitle="Terima permintaan kerja dari tim lain atau klien; setiap kiriman otomatis menjadi tugas."
      aside={<span className="live-pill">{forms.length} FORMULIR</span>}
    >
      <form className="settings-inline-form" onSubmit={create}>
        <input
          value={draft.name}
          maxLength={120}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          placeholder="Nama formulir, mis. Permintaan desain"
          aria-label="Nama formulir"
        />
        <select value={draft.projectId} onChange={(event) => setDraft({ ...draft, projectId: event.target.value })} aria-label="Proyek tujuan">
          <option value="">Tanpa proyek</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select value={draft.assigneeId} onChange={(event) => setDraft({ ...draft, assigneeId: event.target.value })} aria-label="Penanggung jawab">
          <option value="">Penanggung jawab: saya</option>
          {members
            .filter((member) => member.role !== "GUEST")
            .map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
        </select>
        <select
          value={draft.defaultPriority}
          onChange={(event) => setDraft({ ...draft, defaultPriority: event.target.value as TaskPriority })}
          aria-label="Prioritas default"
        >
          {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              Prioritas: {label}
            </option>
          ))}
        </select>
        <label className="inline-check">
          <input type="checkbox" checked={draft.isPublic} onChange={(event) => setDraft({ ...draft, isPublic: event.target.checked })} />
          Publik (tanpa login)
        </label>
        <button className="primary-button" disabled={action.busy || !draft.name.trim()}>
          <Icon icon={faPlus} /> Buat
        </button>
      </form>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>FORMULIR</th>
              <th>AKSES</th>
              <th>MASUK</th>
              <th>STATUS</th>
              <th aria-label="Aksi" />
            </tr>
          </thead>
          <tbody>
            {forms.length === 0 ? (
              <EmptyRow colSpan={5}>Belum ada formulir.</EmptyRow>
            ) : (
              forms.map((form) => (
                <tr key={form.id}>
                  <td>
                    <div className="settings-name">
                      <strong>{form.name}</strong>
                      <small>/request/{form.slug}</small>
                    </div>
                  </td>
                  <td>
                    <select
                      className="filter-select"
                      value={form.isPublic ? "public" : "internal"}
                      onChange={(event) => patch(form, { isPublic: event.target.value === "public" })}
                      aria-label={`Akses ${form.name}`}
                    >
                      <option value="internal">Internal (login)</option>
                      <option value="public">Publik</option>
                    </select>
                  </td>
                  <td>{form._count.tasks} permintaan</td>
                  <td>
                    <input
                      type="checkbox"
                      role="switch"
                      className="switch"
                      checked={form.isActive}
                      onChange={(event) => patch(form, { isActive: event.target.checked })}
                      aria-label={`Aktifkan ${form.name}`}
                    />
                  </td>
                  <td className="row-actions">
                    <button type="button" className="icon-action" title="Salin tautan" aria-label={`Salin tautan ${form.name}`} onClick={() => void copy(form)}>
                      <Icon icon={faCopy} />
                    </button>
                    <a className="icon-action" href={`/request/${form.slug}`} target="_blank" rel="noreferrer" title="Buka formulir" aria-label={`Buka ${form.name}`}>
                      <Icon icon={faUpRightFromSquare} />
                    </a>
                    <button type="button" className="icon-action danger" aria-label={`Hapus ${form.name}`} onClick={() => remove(form)}>
                      <Icon icon={faTrashCan} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="automation-messages">
        <SectionMessages error={action.error} notice={action.notice} />
      </div>
    </Panel>
  );
}
