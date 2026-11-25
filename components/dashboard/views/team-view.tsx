"use client";

import { useState } from "react";
import { faKey, faPen, faUserSlash } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { MANAGE_ROLES, ROLES, ROLE_LABEL } from "../constants";
import type { MemberPatch } from "../hooks/use-workspace";
import { initials } from "../lib/format";
import { countDone, formatMinutes, tasksOfMember, workloadOf } from "../lib/tasks";
import type { DashboardUser, Division, Member, Task, UserRole } from "../types";
import { EmptyRow, Modal, ModalHeading, Panel, TableFooter } from "../ui";

export default function TeamView({
  user,
  members,
  allTasks,
  divisions,
  loading,
  canAdmin,
  onRoleChange,
  onUpdateMember,
  onRefresh,
}: {
  user: DashboardUser;
  members: Member[];
  allTasks: Task[];
  divisions: Division[];
  loading: boolean;
  canAdmin: boolean;
  onRoleChange: (member: Member, role: UserRole) => void;
  onUpdateMember: (member: Member, patch: MemberPatch, success: string) => void;
  onRefresh: () => void;
}) {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const canManageUsers = MANAGE_ROLES.includes(user.role);

  function openEdit(member: Member) {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
  }

  function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMember) return;
    const name = editName.trim();
    const email = editEmail.trim();
    if (!name || !email) return;
    const patch: MemberPatch = {};
    if (name !== editingMember.name) patch.name = name;
    if (email.toLowerCase() !== editingMember.email.toLowerCase()) patch.email = email;
    if (Object.keys(patch).length) {
      onUpdateMember(editingMember, patch, `Data ${editingMember.name} berhasil diperbarui.`);
    }
    setEditingMember(null);
  }

  function resetPassword(member: Member) {
    const password = window.prompt(
      `Kata sandi baru untuk ${member.name} (minimal 8 karakter). Semua sesi ${member.name} akan diakhiri.`
    );
    if (password === null) return;
    if (password.length < 8) {
      window.alert("Kata sandi minimal 8 karakter.");
      return;
    }
    onUpdateMember(member, { password }, `Kata sandi ${member.name} telah direset.`);
  }

  function deactivate(member: Member) {
    if (!window.confirm(`Nonaktifkan akun ${member.name}? Ia tidak akan bisa login lagi.`)) return;
    onUpdateMember(member, { isActive: false }, `Akun ${member.name} dinonaktifkan.`);
  }

  const colSpan = canManageUsers ? 8 : 7;
  const overloaded = members.filter((member) => workloadOf(member, allTasks).overloaded).length;
  return (
    <Panel
      className="tasks-panel"
      headingClassName="tasks-heading"
      title="Anggota tim"
      subtitle="Pengguna terdaftar beserta beban kerjanya"
      aside={
        <span className="team-pills">
          {overloaded > 0 && <span className="live-pill overload-pill">{overloaded} OVERLOAD</span>}
          <span className="live-pill">{members.length} ANGGOTA</span>
        </span>
      }
    >
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>NAMA</th>
              <th>EMAIL</th>
              <th>PERAN</th>
              <th>DIVISI</th>
              <th>TUGAS</th>
              <th>SELESAI</th>
              <th>BEBAN KERJA</th>
              {canManageUsers && <th aria-label="Aksi" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={colSpan}>Memuat data tim...</EmptyRow>
            ) : members.length === 0 ? (
              <EmptyRow colSpan={colSpan}>Belum ada anggota tim.</EmptyRow>
            ) : (
              members.map((member) => {
                const list = tasksOfMember(member, allTasks);
                // Peran Super Admin hanya bisa diberikan/dipertahankan oleh Super Admin.
                const roles = ROLES.filter(
                  (role) =>
                    role !== "SUPER_ADMIN" ||
                    user.role === "SUPER_ADMIN" ||
                    member.role === "SUPER_ADMIN"
                );

                return (
                  <tr key={member.id}>
                    <td>
                      <div className="task-name">
                        <span className="member-avatar">{initials(member.name)}</span>
                        <span className="task-title">{member.name}</span>
                      </div>
                    </td>
                    <td>{member.email}</td>
                    <td>
                      {canAdmin && member.id !== user.id ? (
                        <select
                          className="status-select status-todo"
                          value={member.role}
                          onChange={(event) =>
                            onRoleChange(member, event.target.value as UserRole)
                          }
                          aria-label={`Ubah peran ${member.name}`}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABEL[role]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="project-tag">{ROLE_LABEL[member.role]}</span>
                      )}
                    </td>
                    <td>
                      {canAdmin ? (
                        <select
                          className="filter-select"
                          value={member.division?.id ?? ""}
                          onChange={(event) =>
                            onUpdateMember(
                              member,
                              { divisionId: event.target.value || null },
                              `Divisi ${member.name} diperbarui.`
                            )
                          }
                          aria-label={`Divisi ${member.name}`}
                        >
                          <option value="">Tanpa divisi</option>
                          {divisions.map((division) => (
                            <option key={division.id} value={division.id}>
                              {division.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        member.division?.name ?? "—"
                      )}
                    </td>
                    <td>{list.length}</td>
                    <td>{countDone(list)}</td>
                    <td>
                      <WorkloadCell
                        member={member}
                        allTasks={allTasks}
                        canEdit={canAdmin}
                        onCapacity={(hours) =>
                          onUpdateMember(member, { weeklyCapacityHours: hours }, `Kapasitas ${member.name} diperbarui.`)
                        }
                      />
                    </td>
                    {canManageUsers && (
                      <td className="row-actions">
                        {(member.role !== "SUPER_ADMIN" || user.role === "SUPER_ADMIN") && (
                          <button
                            type="button"
                            className="icon-action"
                            title="Edit pengguna"
                            aria-label={`Edit pengguna ${member.name}`}
                            onClick={() => openEdit(member)}
                          >
                            <Icon icon={faPen} />
                          </button>
                        )}
                        {canAdmin && (member.role !== "SUPER_ADMIN" || user.role === "SUPER_ADMIN") && (
                          <button
                            type="button"
                            className="icon-action"
                            title="Reset kata sandi"
                            aria-label={`Reset kata sandi ${member.name}`}
                            onClick={() => resetPassword(member)}
                          >
                            <Icon icon={faKey} />
                          </button>
                        )}
                        {canAdmin && member.id !== user.id &&
                          (member.role !== "SUPER_ADMIN" || user.role === "SUPER_ADMIN") && (
                            <button
                              type="button"
                              className="icon-action danger"
                              title="Nonaktifkan akun"
                              aria-label={`Nonaktifkan ${member.name}`}
                              onClick={() => deactivate(member)}
                            >
                              <Icon icon={faUserSlash} />
                            </button>
                          )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TableFooter label={`Menampilkan ${members.length} anggota`} onRefresh={onRefresh} />
      {editingMember && (
        <Modal onClose={() => setEditingMember(null)}>
          <section className="task-modal small-modal" role="dialog" aria-modal="true" aria-labelledby="member-edit-title">
            <ModalHeading eyebrow="PENGGUNA" title="Edit pengguna" titleId="member-edit-title" onClose={() => setEditingMember(null)} />
            <form className="form-grid single-column" onSubmit={saveEdit}>
              <label>
                Nama lengkap
                <input required maxLength={120} value={editName} onChange={(event) => setEditName(event.target.value)} />
              </label>
              <label>
                Email
                <input required type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
              </label>
              <div className="task-modal-actions">
                <button type="button" className="secondary-button" onClick={() => setEditingMember(null)}>Batal</button>
                <button className="primary-button">Simpan perubahan</button>
              </div>
            </form>
          </section>
        </Modal>
      )}
    </Panel>
  );
}

function WorkloadCell({
  member,
  allTasks,
  canEdit,
  onCapacity,
}: {
  member: Member;
  allTasks: Task[];
  canEdit: boolean;
  onCapacity: (hours: number) => void;
}) {
  const load = workloadOf(member, allTasks);
  const level = load.overloaded ? "over" : load.load >= 80 ? "high" : "ok";
  return (
    <div className={`workload workload-${level}`}>
      <div className="workload-bar" role="img" aria-label={`Beban ${load.load}% dari kapasitas`}>
        <span style={{ width: `${Math.min(100, load.load)}%` }} />
      </div>
      <small>
        {load.open} terbuka{load.overdue ? ` · ${load.overdue} terlambat` : ""} · sisa {formatMinutes(load.remainingMinutes)} /{" "}
        {canEdit ? (
          <input
            className="capacity-input"
            type="number"
            min={1}
            max={80}
            defaultValue={member.weeklyCapacityHours ?? 40}
            aria-label={`Kapasitas mingguan ${member.name} (jam)`}
            onBlur={(event) => {
              const hours = Number(event.target.value);
              if (Number.isInteger(hours) && hours >= 1 && hours <= 80 && hours !== (member.weeklyCapacityHours ?? 40)) {
                onCapacity(hours);
              }
            }}
          />
        ) : (
          member.weeklyCapacityHours ?? 40
        )}{" "}
        j/minggu
      </small>
      {load.overloaded && <span className="overload-badge">Overload</span>}
    </div>
  );
}
