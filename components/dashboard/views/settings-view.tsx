"use client";

import { faPen, faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useState, type ReactNode } from "react";
import type { Division, Label, Member } from "../types";
import { EmptyRow, Panel } from "../ui";

const LABEL_COLORS = ["#6d5bd0", "#2f80ed", "#16a34a", "#d97706", "#dc2626", "#db2777", "#0891b2", "#64748b"];

/** Menu Pengaturan: divisi (admin) dan label (manajemen). Bagian lanjutan ditambahkan lewat `extra`. */
export default function SettingsView({
  canAdmin,
  divisions,
  labels,
  members,
  saving,
  onSaveDivision,
  onDeleteDivision,
  onSaveLabel,
  onDeleteLabel,
  extra,
}: {
  canAdmin: boolean;
  divisions: Division[];
  labels: Label[];
  members: Member[];
  saving: boolean;
  onSaveDivision: (
    input: { name?: string; description?: string; supervisorId?: string | null },
    divisionId?: string
  ) => Promise<boolean>;
  onDeleteDivision: (division: Division) => void;
  onSaveLabel: (input: { name: string; color: string }, labelId?: string) => Promise<boolean>;
  onDeleteLabel: (label: Label) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="settings-grid">
      {canAdmin && (
        <DivisionsPanel
          divisions={divisions}
          members={members}
          saving={saving}
          onSave={onSaveDivision}
          onDelete={onDeleteDivision}
        />
      )}
      <LabelsPanel labels={labels} saving={saving} onSave={onSaveLabel} onDelete={onDeleteLabel} />
      {extra}
    </div>
  );
}

function DivisionsPanel({
  divisions,
  members,
  saving,
  onSave,
  onDelete,
}: {
  divisions: Division[];
  members: Member[];
  saving: boolean;
  onSave: (
    input: { name?: string; description?: string; supervisorId?: string | null },
    divisionId?: string
  ) => Promise<boolean>;
  onDelete: (division: Division) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    if (await onSave({ name: name.trim(), description: description.trim() })) {
      setName("");
      setDescription("");
    }
  }

  return (
    <Panel
      className="tasks-panel settings-panel"
      headingClassName="tasks-heading"
      title="Divisi"
      subtitle="Kelompokkan anggota; Supervisor melihat semua tugas divisinya."
      aside={<span className="live-pill">{divisions.length} DIVISI</span>}
    >
      <form className="settings-inline-form" onSubmit={create}>
        <input
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama divisi baru"
          aria-label="Nama divisi baru"
        />
        <input
          value={description}
          maxLength={500}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Deskripsi (opsional)"
          aria-label="Deskripsi divisi"
        />
        <button className="primary-button" disabled={saving || !name.trim()}>
          <Icon icon={faPlus} /> Tambah
        </button>
      </form>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>DIVISI</th>
              <th>SUPERVISOR</th>
              <th>ANGGOTA</th>
              <th>TUGAS</th>
              <th aria-label="Aksi" />
            </tr>
          </thead>
          <tbody>
            {divisions.length === 0 ? (
              <EmptyRow colSpan={5}>Belum ada divisi.</EmptyRow>
            ) : (
              divisions.map((division) => (
                <tr key={division.id}>
                  <td>
                    {editing === division.id ? (
                      <form
                        className="settings-rename"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          if (await onSave({ name: editName.trim() }, division.id)) setEditing(null);
                        }}
                      >
                        <input
                          autoFocus
                          value={editName}
                          maxLength={80}
                          onChange={(event) => setEditName(event.target.value)}
                          aria-label="Nama divisi"
                        />
                        <button className="text-button" disabled={saving || !editName.trim()}>
                          Simpan
                        </button>
                        <button type="button" className="text-button" onClick={() => setEditing(null)}>
                          Batal
                        </button>
                      </form>
                    ) : (
                      <div className="settings-name">
                        <strong>{division.name}</strong>
                        {division.description && <small>{division.description}</small>}
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      className="filter-select"
                      value={division.supervisor?.id ?? ""}
                      disabled={saving}
                      onChange={(event) =>
                        void onSave({ supervisorId: event.target.value || null }, division.id)
                      }
                      aria-label={`Supervisor ${division.name}`}
                    >
                      <option value="">Belum ada</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{division._count.users}</td>
                  <td>{division._count.tasks}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="icon-action"
                      title="Ganti nama"
                      aria-label={`Ganti nama ${division.name}`}
                      onClick={() => {
                        setEditing(division.id);
                        setEditName(division.name);
                      }}
                    >
                      <Icon icon={faPen} />
                    </button>
                    <button
                      type="button"
                      className="icon-action danger"
                      title="Nonaktifkan"
                      aria-label={`Nonaktifkan ${division.name}`}
                      onClick={() => onDelete(division)}
                    >
                      <Icon icon={faTrashCan} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function LabelsPanel({
  labels,
  saving,
  onSave,
  onDelete,
}: {
  labels: Label[];
  saving: boolean;
  onSave: (input: { name: string; color: string }, labelId?: string) => Promise<boolean>;
  onDelete: (label: Label) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(LABEL_COLORS[0]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    if (await onSave({ name: name.trim(), color })) setName("");
  }

  return (
    <Panel
      className="tasks-panel settings-panel"
      headingClassName="tasks-heading"
      title="Label"
      subtitle="Tag kategori untuk mengelompokkan tugas lintas divisi."
      aside={<span className="live-pill">{labels.length} LABEL</span>}
    >
      <form className="settings-inline-form" onSubmit={create}>
        <input
          value={name}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama label, mis. Pemasaran"
          aria-label="Nama label baru"
        />
        <div className="color-swatches" role="radiogroup" aria-label="Warna label">
          {LABEL_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              role="radio"
              aria-checked={color === swatch}
              aria-label={`Warna ${swatch}`}
              className={`color-swatch ${color === swatch ? "active" : ""}`}
              style={{ background: swatch }}
              onClick={() => setColor(swatch)}
            />
          ))}
        </div>
        <button className="primary-button" disabled={saving || !name.trim()}>
          <Icon icon={faPlus} /> Tambah
        </button>
      </form>

      {labels.length === 0 ? (
        <p className="settings-empty">Belum ada label.</p>
      ) : (
        <ul className="settings-label-list">
          {labels.map((label) => (
            <li key={label.id}>
              <span className="label-chip" style={{ "--label-color": label.color } as React.CSSProperties}>
                {label.name}
              </span>
              <small>{label._count?.tasks ?? 0} tugas</small>
              <input
                type="color"
                defaultValue={label.color}
                aria-label={`Ubah warna ${label.name}`}
                // Simpan sekali saat pemilih ditutup, bukan di setiap geseran warna.
                onBlur={(event) => {
                  if (event.target.value !== label.color) {
                    void onSave({ name: label.name, color: event.target.value }, label.id);
                  }
                }}
              />
              <button
                type="button"
                className="icon-action danger"
                aria-label={`Hapus label ${label.name}`}
                onClick={() => onDelete(label)}
              >
                <Icon icon={faTrashCan} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
