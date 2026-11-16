import { PRIORITY_LABEL, ROLE_LABEL, STATUS_LABEL } from "../constants";
import type { Member, MenuName, Project, Task } from "../types";
import { downloadCsv } from "./csv";
import { formatDate, percent } from "./format";
import { countDone, tasksOfMember, tasksOfProject } from "./tasks";

/** Ekspor CSV sesuai menu aktif: proyek, tim, atau daftar tugas yang sedang tampil. */
export function exportMenuCsv(
  menu: MenuName,
  source: { projects: Project[]; members: Member[]; allTasks: Task[]; visibleTasks: Task[] }
) {
  const { projects, members, allTasks, visibleTasks } = source;

  if (menu === "Proyek") {
    downloadCsv("laporan-proyek-rei.csv", [
      ["Nama Proyek", "Deskripsi", "Total Tugas", "Selesai", "Progres"],
      ...projects.map((project) => {
        const list = tasksOfProject(project, allTasks);
        const completed = countDone(list);
        return [
          project.name,
          project.description ?? "",
          String(list.length),
          String(completed),
          `${percent(completed, list.length)}%`,
        ];
      }),
    ]);
    return;
  }

  if (menu === "Tim") {
    downloadCsv("laporan-tim-rei.csv", [
      ["Nama", "Email", "Peran", "Divisi", "Total Tugas", "Tugas Selesai"],
      ...members.map((member) => {
        const list = tasksOfMember(member, allTasks);
        return [
          member.name,
          member.email,
          ROLE_LABEL[member.role],
          member.division?.name ?? "",
          String(list.length),
          String(countDone(list)),
        ];
      }),
    ]);
    return;
  }

  downloadCsv("laporan-tugas-rei.csv", [
    ["Nama Tugas", "Proyek", "Divisi", "Penanggung Jawab", "Prioritas", "Status", "Tenggat"],
    ...visibleTasks.map((task) => [
      task.title,
      task.project?.name ?? "",
      task.division?.name ?? "",
      task.assignee?.name ?? "",
      PRIORITY_LABEL[task.priority],
      STATUS_LABEL[task.status],
      formatDate(task.dueDate),
    ]),
  ]);
}
