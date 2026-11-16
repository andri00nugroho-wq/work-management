"use client";

import { useCallback, useEffect, useState } from "react";
import { errorText } from "../lib/format";
import { pickList, request } from "../lib/http";
import type {
  DashboardData,
  Member,
  MenuName,
  Project,
  Task,
  TaskStatus,
  UserRole,
} from "../types";

export type TaskInput = {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  projectId: string;
  assigneeId: string;
};

export type ProjectInput = { name: string; description: string };

export type MemberInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type WorkspaceSnapshot = {
  dashboard: DashboardData;
  tasks: Task[];
  projects: Project[] | null;
  members: Member[] | null;
};

const fetchMembers = () =>
  request<unknown>("/api/users", { method: "GET" }, "Gagal mengambil data tim.").then((result) =>
    pickList<Member>(result, "users")
  );

const fetchProjects = () =>
  request<unknown>("/api/projects", { method: "GET" }, "Gagal mengambil data proyek.").then(
    (result) => pickList<Project>(result, "projects")
  );

/** Data dashboard + data tambahan yang dibutuhkan menu aktif. */
async function fetchWorkspace(menu: MenuName): Promise<WorkspaceSnapshot> {
  const [dashboard, tasks, projects, members] = await Promise.all([
    request<DashboardData>("/api/dashboard", { method: "GET" }, "Gagal mengambil data dashboard."),
    request<unknown>("/api/tasks", { method: "GET" }, "Gagal mengambil data tugas.").then(
      (result) => pickList<Task>(result, "tasks")
    ),
    menu === "Proyek" || menu === "Laporan" ? fetchProjects() : null,
    menu === "Tim" ? fetchMembers() : null,
  ]);
  return { dashboard, tasks, projects, members };
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const applySnapshot = useCallback((snapshot: WorkspaceSnapshot) => {
    setData(snapshot.dashboard);
    setAllTasks(snapshot.tasks);
    if (snapshot.projects) setProjects(snapshot.projects);
    if (snapshot.members) setMembers(snapshot.members);
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
              dueDate: input.dueDate || null,
              projectId: input.projectId || null,
              assigneeId: input.assigneeId || undefined,
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

  return {
    data,
    allTasks,
    projects,
    members,
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
    patchTask,
    createTask,
    updateTaskStatus,
    createProject,
    deleteProject,
    createMember,
    updateMemberRole,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
