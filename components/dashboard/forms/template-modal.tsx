"use client";

import { faDiamond, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useState } from "react";
import { PRIORITY_LABEL } from "../constants";
import { useAsyncAction } from "../hooks/use-async-action";
import { toDateInput } from "../lib/format";
import { request } from "../lib/http";
import type { ProjectTemplate } from "../types";
import { Modal, ModalHeading, SectionMessages } from "../ui";

/** Pilih templat lalu buat proyek beserta tugas, jadwal, sub-tugas & dependensinya. */
export default function TemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (message: string) => void }) {
  const [templates, setTemplates] = useState<ProjectTemplate[] | null>(null);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(() => toDateInput(new Date().toISOString()));
  const action = useAsyncAction();

  useEffect(() => {
    request<{ templates: ProjectTemplate[] }>("/api/templates", {}, "Templat gagal dimuat.")
      .then((result) => {
        setTemplates(result.templates);
        setSelected(result.templates[0]?.id ?? "");
      })
      .catch(() => setTemplates([]));
  }, []);

  const template = templates?.find((item) => item.id === selected);

  function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!template || !name.trim()) return action.setError("Pilih templat dan isi nama proyek.");
    void action.run(async () => {
      const result = await request<{ taskCount: number }>(
        "/api/projects/from-template",
        { method: "POST", body: JSON.stringify({ templateId: template.id, name: name.trim(), startDate }) },
        "Proyek gagal dibuat dari templat."
      );
      onCreated(`Proyek "${name.trim()}" dibuat dari templat dengan ${result.taskCount} tugas.`);
      onClose();
    }, "Proyek gagal dibuat dari templat.");
  }

  function remove(item: ProjectTemplate) {
    if (!window.confirm(`Hapus templat "${item.name}"?`)) return;
    void action.run(async () => {
      await request(`/api/templates/${item.id}`, { method: "DELETE" }, "Templat gagal dihapus.");
      setTemplates((list) => (list ?? []).filter((entry) => entry.id !== item.id));
      setSelected((current) => (current === item.id ? "" : current));
      return "Templat dihapus.";
    }, "Templat gagal dihapus.");
  }

  return (
    <Modal onClose={onClose}>
      <section className="task-modal template-modal" role="dialog" aria-modal="true" aria-labelledby="tpl-title">
        <ModalHeading eyebrow="PROYEK" title="Buat proyek dari templat" titleId="tpl-title" onClose={onClose} />
        {!templates ? (
          <p className="settings-empty">Memuat templat...</p>
        ) : (
          <form onSubmit={create}>
            <div className="template-options" role="radiogroup" aria-label="Pilih templat">
              {templates.map((item) => (
                <label key={item.id} className={`template-option ${selected === item.id ? "active" : ""}`}>
                  <input type="radio" name="template" checked={selected === item.id} onChange={() => setSelected(item.id)} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.items.length} tugas · {item.builtIn ? "bawaan" : "kustom"}
                    </small>
                  </span>
                  {!item.builtIn && (
                    <button
                      type="button"
                      className="icon-action danger"
                      aria-label={`Hapus templat ${item.name}`}
                      onClick={(event) => {
                        event.preventDefault();
                        remove(item);
                      }}
                    >
                      <Icon icon={faTrashCan} />
                    </button>
                  )}
                </label>
              ))}
            </div>
            {template && (
              <ol className="template-preview">
                {template.items.map((item, index) => (
                  <li key={index}>
                    <span>
                      {item.isMilestone && <Icon icon={faDiamond} />} {item.title}
                    </span>
                    <small>
                      Hari {item.startOffset + 1}
                      {item.duration > 1 ? `–${item.startOffset + item.duration}` : ""} · {PRIORITY_LABEL[item.priority]}
                      {item.dependsOn?.length ? ` · setelah #${item.dependsOn.map((dep) => dep + 1).join(", #")}` : ""}
                    </small>
                  </li>
                ))}
              </ol>
            )}
            <div className="form-grid template-fields">
              <label>
                Nama proyek *
                <input required maxLength={180} value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label>
                Tanggal mulai *
                <input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
            </div>
            <div className="task-modal-actions">
              <button type="button" className="secondary-button" onClick={onClose}>
                Batal
              </button>
              <button className="primary-button" disabled={action.busy || !template}>
                {action.busy ? "Membuat..." : "Buat proyek"}
              </button>
            </div>
          </form>
        )}
        <SectionMessages error={action.error} notice={action.notice} />
      </section>
    </Modal>
  );
}
