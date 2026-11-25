"use client";

import { useCallback, useEffect, useState } from "react";
import { errorText } from "../lib/format";
import { pickList, request } from "../lib/http";
import type {
  DashboardData,
  Division,
  Label,
  Member,
  MenuName,
  Project,
  SavedView,
  Task,
  TaskFilters,
  TaskStatus,
  UserRole,
  WipLimits,
} from "../types";
import type { BulkAction } from "../tasks/task-table";

export type TaskInput = {
  title: string;
  description: string;
  priority: string;
  startDate: string;
  dueDate: string;
  projectId: string;
  assigneeId: string;
  labelIds: string[];
  recurrence: string;
};

export type MemberPatch = {
  name?: string;
  email?: string;
  divisionId?: string | null;
  password?: string;
  isActive?: false;
  weeklyCapacityHours?: number;
};

export type ProjectInput = { name: string; description: string };

export type MemberInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  divisionId: string;
};

type WorkspaceSnapshot = {
  dashboard: DashboardData;
  tasks: Task[];
  projects: Project[] | null;
  members: Member[] | null;
  labels: Label[];
  divisions: Division[] | null;
};

const fetchMembers = () =>
  request<unknown>("/api/users", { method: "GET" }, "Gagal mengambil data tim.").then((result) =>
    pickList<Member>(result, "users")
  );

const fetchProjects = () =>
  request<unknown>("/api/projects", { method: "GET" }, "Gagal mengambil data proyek.").then(
    (result) => pickList<Project>(result, "projects")
  );

const fetchLabels = () =>
  request<unknown>("/api/labels", { method: "GET" }, "Gagal mengambil label.").then((result) =>
    pickList<Label>(result, "labels")
  );

const fetchDivisions = () =>
  request<unknown>("/api/divisions", { method: "GET" }, "Gagal mengambil divisi.").then((result) =>
    pickList<Division>(result, "divisions")
  );

const MENUS_WITH_MEMBERS: MenuName[] = ["Tim", "Pengaturan"];
const MENUS_WITH_DIVISIONS: MenuName[] = ["Tim", "Pengaturan"];

/** Data dashboard + data tambahan yang dibutuhkan menu aktif. */
async function fetchWorkspace(menu: MenuName): Promise<WorkspaceSnapshot> {
  const [dashboard, tasks, projects, members, labels, divisions] = await Promise.all([
    request<DashboardData>("/api/dashboard", { method: "GET" }, "Gagal mengambil data dashboard."),
    request<unknown>("/api/tasks", { method: "GET" }, "Gagal mengambil data tugas.").then(
      (result) => pickList<Task>(result, "tasks")
    ),
    menu === "Proyek" || menu === "Laporan" || menu === "Pengaturan" ? fetchProjects() : null,
    MENUS_WITH_MEMBERS.includes(menu) ? fetchMembers() : null,
    fetchLabels(),
    MENUS_WITH_DIVISIONS.includes(menu) ? fetchDivisions() : null,
  ]);
  return { dashboard, tasks, projects, members, labels, divisions };
}

function patchList(list: Task[], taskId: string, patch: Partial<Task>) {
  return list.map((task) => (task.id === taskId ? { ...task, ...patch } : task));
}

function patchDashboard(data: DashboardData, taskId: string, patch: Partial<Task>) {
  return {
    ...data,
    recentTasks: data.recentTasks && patchList(data.recentTasks, taskId, patch),
    tasks: data.tasks && patchList(data.tasks, taskId, patch),
  };
}

export function useWorkspace(activeMenu: MenuName) {
  const [data, setData] = useState<DashboardData>({});
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [wipLimits, setWipLimits] = useState<WipLimits>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const applySnapshot = useCallback((snapshot: WorkspaceSnapshot) => {
    setData(snapshot.dashboard);
    setAllTasks(snapshot.tasks);
    if (snapshot.projects) setProjects(snapshot.projects);
    if (snapshot.members) setMembers(snapshot.members);
    setLabels(snapshot.labels);
    if (snapshot.divisions) setDivisions(snapshot.divisions);
  }, []);

  // Tampilan tersimpan & batas WIP cukup dimuat sekali.
  useEffect(() => {
    request<unknown>("/api/views", { method: "GET" }, "Gagal mengambil tampilan.")
      .then((result) => setViews(pickList<SavedView>(result, "views")))
      .catch(() => {});
    request<{ wipLimits: WipLimits }>("/api/settings/board", { method: "GET" }, "Gagal mengambil batas WIP.")
      .then((result) => setWipLimits(result.wipLimits ?? {}))
      .catch(() => {});
  }, []);

  // Muat ulang setiap kali menu berganti; hasil yang sudah basi diabaikan.
  useEffect(() => {
    let cancelled = false;
    fetchWorkspace(activeMenu)
      .then((snapshot) => {
        if (!cancelled) applySnapshot(snapshot);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Tidak dapat menghubungi server."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeMenu, applySnapshot]);

  /** silent = true -> tanpa state "Memuat..." (dipakai setelah aksi). */
  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        applySnapshot(await fetchWorkspace(activeMenu));
      } catch (err) {
        setError(errorText(err, "Tidak dapat menghubungi server."));
      } finally {
        setLoading(false);
      }
    },
    [activeMenu, applySnapshot]
  );

  /** Dipanggil saat berpindah menu; indikator "Memuat..." hanya jika menu benar-benar berganti. */
  const resetForMenu = useCallback(
    (nextMenu: MenuName) => {
      if (nextMenu !== activeMenu) setLoading(true);
      setError("");
      setNotice("");
    },
    [activeMenu]
  );

  const ensureMembers = useCallback(async () => {
    if (members.length === 0) setMembers(await fetchMembers());
  }, [members.length]);

  const ensureProjects = useCallback(async () => {
    if (projects.length === 0) setProjects(await fetchProjects());
  }, [projects.length]);

  const ensureDivisions = useCallback(async () => {
    if (divisions.length === 0) setDivisions(await fetchDivisions());
  }, [divisions.length]);

  /** Terapkan perubahan satu tugas ke semua daftar yang memuatnya. */
  const patchTask = useCallback((taskId: string, patch: Partial<Task>) => {
    setAllTasks((list) => patchList(list, taskId, patch));
    setData((previous) => patchDashboard(previous, taskId, patch));
  }, []);

  /**
   * Jalankan aksi tulis dengan pola umum: reset pesan, tampilkan notice, lalu refresh
   * di latar belakang (refresh menangani error-nya sendiri). Mengembalikan true bila
   * berhasil, sehingga pemanggil bisa langsung menutup form.
   */
  async function mutate(action: () => Promise<unknown>, success: string, fallback: string) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      void refresh(true);
      return true;
    } catch (err) {
      setError(errorText(err, fallback));
      return false;
    } finally {
      setSaving(false);
    }
  }

  function createTask(input: TaskInput) {
    return mutate(
      () =>
        request(
          "/api/tasks",
          {
            method: "POST",
            body: JSON.stringify({
              title: input.title.trim(),
              description: input.description.trim() || null,
              priority: input.priority,
              startDate: input.startDate || null,
              dueDate: input.dueDate || null,
              projectId: input.projectId || null,
              assigneeId: input.assigneeId || undefined,
              labelIds: input.labelIds,
              recurrence: input.recurrence,
            }),
          },
          "Tugas gagal disimpan."
        ),
      "Tugas berhasil dibuat.",
      "Gagal menyimpan tugas."
    );
  }

  async function updateTaskStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;

    setError("");
    setNotice("");

    // Optimistic update supaya kanban/tabel langsung berubah.
    const previousAll = allTasks;
    const previousData = data;
    patchTask(task.id, { status });

    try {
      await request(
        `/api/tasks/${task.id}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
        "Status tugas gagal diperbarui."
      );
      setNotice("Status tugas berhasil diperbarui.");
      await refresh(true);
    } catch (err) {
      setAllTasks(previousAll);
      setData(previousData);
      setError(errorText(err, "Gagal memperbarui status tugas."));
    }
  }

  /** Ubah sebagian field satu tugas (mis. geser jadwal dari kalender). */
  function patchTaskFields(task: Task, body: Record<string, unknown>, success: string) {
    return mutate(
      () =>
        request(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(body) }, "Tugas gagal diperbarui."),
      success,
      "Gagal memperbarui tugas."
    );
  }

  /**
   * Aksi massal: satu permintaan per tugas agar semua aturan server (dependensi,
   * izin, riwayat) tetap berlaku. Melaporkan jumlah berhasil & gagal.
   */
  async function bulkUpdate(tasks: Task[], action: BulkAction) {
    setSaving(true);
    setError("");
    setNotice("");
    const results = await Promise.allSettled(
      tasks.map((task) =>
        action.kind === "delete"
          ? request(`/api/tasks/${task.id}`, { method: "DELETE" }, `"${task.title}" gagal dihapus.`)
          : request(
              `/api/tasks/${task.id}`,
              {
                method: "PATCH",
                body: JSON.stringify(
                  action.kind === "status"
                    ? { status: action.value }
                    : action.kind === "priority"
                      ? { priority: action.value }
                      : { assigneeId: action.value }
                ),
              },
              `"${task.title}" gagal diperbarui.`
            )
      )
    );
    const failed = results
      .map((result, index) => (result.status === "rejected" ? `${tasks[index].title}: ${errorText(result.reason, "gagal")}` : null))
      .filter((item): item is string => item !== null);
    const ok = tasks.length - failed.length;
    if (ok) setNotice(`${ok} tugas berhasil ${action.kind === "delete" ? "dihapus" : "diperbarui"}.`);
    if (failed.length) setError(`${failed.length} gagal — ${failed.slice(0, 3).join("; ")}${failed.length > 3 ? "; ..." : ""}`);
    setSaving(false);
    await refresh(true);
  }

  async function saveWipLimits(limits: WipLimits) {
    try {
      const result = await request<{ wipLimits: WipLimits }>(
        "/api/settings/board",
        { method: "PUT", body: JSON.stringify(limits) },
        "Batas WIP gagal disimpan."
      );
      setWipLimits(result.wipLimits);
      setNotice("Batas WIP Kanban disimpan.");
      return true;
    } catch (err) {
      setError(errorText(err, "Gagal menyimpan batas WIP."));
      return false;
    }
  }

  function saveProjectAsTemplate(project: Project, name: string) {
    return mutate(
      () =>
        request(
          "/api/templates",
          { method: "POST", body: JSON.stringify({ name, projectId: project.id }) },
          "Templat gagal disimpan."
        ),
      `Templat "${name}" disimpan dari proyek "${project.name}".`,
      "Gagal menyimpan templat."
    );
  }

  function createProject(input: ProjectInput) {
    return mutate(
      () =>
        request(
          "/api/projects",
          {
            method: "POST",
            body: JSON.stringify({
              name: input.name.trim(),
              description: input.description.trim() || null,
            }),
          },
          "Proyek gagal disimpan."
        ),
      "Proyek berhasil dibuat.",
      "Gagal menyimpan proyek."
    );
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Hapus proyek "${project.name}"?`)) return;
    await mutate(
      () => request(`/api/projects/${project.id}`, { method: "DELETE" }, "Proyek gagal dihapus."),
      "Proyek berhasil dihapus.",
      "Gagal menghapus proyek."
    );
  }

  function createMember(input: MemberInput) {
    return mutate(
      () =>
        request(
          "/api/users",
          {
            method: "POST",
            body: JSON.stringify({
              name: input.name.trim(),
              email: input.email.trim(),
              password: input.password,
              role: input.role,
              divisionId: input.divisionId || null,
            }),
          },
          "Anggota gagal disimpan."
        ),
      "Anggota berhasil ditambahkan.",
      "Gagal menyimpan anggota."
    );
  }

  async function updateMemberRole(member: Member, role: UserRole) {
    if (member.role === role) return;
    await mutate(
      () =>
        request(
          `/api/users/${member.id}`,
          { method: "PATCH", body: JSON.stringify({ role }) },
          "Peran gagal diperbarui."
        ),
      "Peran anggota berhasil diperbarui.",
      "Gagal memperbarui peran."
    );
  }

  async function updateMember(member: Member, patch: MemberPatch, success: string) {
    return mutate(
      () =>
        request(
          `/api/users/${member.id}`,
          { method: "PATCH", body: JSON.stringify(patch) },
          "Data anggota gagal diperbarui."
        ),
      success,
      "Gagal memperbarui anggota."
    );
  }

  /* ---------- Label & divisi (menu Pengaturan) ---------- */

  function saveLabel(input: { name: string; color: string }, labelId?: string) {
    return mutate(
      () =>
        request(
          labelId ? `/api/labels/${labelId}` : "/api/labels",
          { method: labelId ? "PATCH" : "POST", body: JSON.stringify(input) },
          "Label gagal disimpan."
        ),
      labelId ? "Label diperbarui." : "Label dibuat.",
      "Gagal menyimpan label."
    );
  }

  async function deleteLabel(label: Label) {
    if (!window.confirm(`Hapus label "${label.name}"? Label akan dilepas dari semua tugas.`)) return;
    await mutate(
      () => request(`/api/labels/${label.id}`, { method: "DELETE" }, "Label gagal dihapus."),
      "Label dihapus.",
      "Gagal menghapus label."
    );
  }

  function saveDivision(
    input: { name?: string; description?: string; supervisorId?: string | null },
    divisionId?: string
  ) {
    return mutate(
      () =>
        request(
          divisionId ? `/api/divisions/${divisionId}` : "/api/divisions",
          { method: divisionId ? "PATCH" : "POST", body: JSON.stringify(input) },
          "Divisi gagal disimpan."
        ),
      divisionId ? "Divisi diperbarui." : "Divisi dibuat.",
      "Gagal menyimpan divisi."
    );
  }

  async function deleteDivision(division: Division) {
    if (
      !window.confirm(
        `Nonaktifkan divisi "${division.name}"? ${division._count.users} anggota akan dilepas dari divisi ini.`
      )
    )
      return;
    await mutate(
      () => request(`/api/divisions/${division.id}`, { method: "DELETE" }, "Divisi gagal dihapus."),
      "Divisi dinonaktifkan.",
      "Gagal menghapus divisi."
    );
  }

  /* ---------- Tampilan tersimpan ---------- */

  async function saveView(name: string, filters: Partial<TaskFilters>) {
    try {
      const result = await request<{ view: SavedView }>(
        "/api/views",
        { method: "POST", body: JSON.stringify({ name, filters }) },
        "Tampilan gagal disimpan."
      );
      setViews((list) => [...list, result.view]);
      setNotice(`Tampilan "${name}" disimpan.`);
      return result.view;
    } catch (err) {
      setError(errorText(err, "Gagal menyimpan tampilan."));
      return null;
    }
  }

  async function deleteView(view: SavedView) {
    try {
      await request(`/api/views/${view.id}`, { method: "DELETE" }, "Tampilan gagal dihapus.");
      setViews((list) => list.filter((item) => item.id !== view.id));
      setNotice(`Tampilan "${view.name}" dihapus.`);
    } catch (err) {
      setError(errorText(err, "Gagal menghapus tampilan."));
    }
  }

  return {
    data,
    allTasks,
    projects,
    members,
    labels,
    divisions,
    views,
    wipLimits,
    loading,
    saving,
    error,
    notice,
    setError,
    setNotice,
    refresh,
    resetForMenu,
    ensureMembers,
    ensureProjects,
    ensureDivisions,
    patchTask,
    createTask,
    updateTaskStatus,
    patchTaskFields,
    bulkUpdate,
    saveWipLimits,
    createProject,
    saveProjectAsTemplate,
    deleteProject,
    createMember,
    updateMemberRole,
    updateMember,
    saveLabel,
    deleteLabel,
    saveDivision,
    deleteDivision,
    saveView,
    deleteView,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
