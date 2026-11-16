"use client";

import { ROLES, ROLE_LABEL } from "../constants";
import { initials } from "../lib/format";
import { countDone, tasksOfMember } from "../lib/tasks";
import type { DashboardUser, Member, Task, UserRole } from "../types";
import { EmptyRow, Panel, TableFooter } from "../ui";

export default function TeamView({
  user,
  members,
  allTasks,
  loading,
  canAdmin,
  onRoleChange,
  onRefresh,
}: {
  user: DashboardUser;
  members: Member[];
  allTasks: Task[];
  loading: boolean;
  canAdmin: boolean;
  onRoleChange: (member: Member, role: UserRole) => void;
  onRefresh: () => void;
}) {
  return (
    <Panel
      className="tasks-panel"
      headingClassName="tasks-heading"
      title="Anggota tim"
      subtitle="Pengguna terdaftar beserta beban kerjanya"
      aside={<span className="live-pill">{members.length} ANGGOTA</span>}
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={6}>Memuat data tim...</EmptyRow>
            ) : members.length === 0 ? (
              <EmptyRow colSpan={6}>Belum ada anggota tim.</EmptyRow>
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
                    <td>{member.division?.name ?? "—"}</td>
                    <td>{list.length}</td>
                    <td>{countDone(list)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TableFooter label={`Menampilkan ${members.length} anggota`} onRefresh={onRefresh} />
    </Panel>
  );
}
