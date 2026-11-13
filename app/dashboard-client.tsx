"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import ReiLogo from "@/components/rei-logo";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "SPV" | "MANAGER" | "MEMBER";
type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type Theme = "light" | "dark" | "glass" | "gold";
type TaskLink = { id: string; label: string; url: string; createdAt: string };
type TaskLinkDraft = { label: string; url: string };
type TaskIssueReport = {
  id: string;
  description: string;
  createdAt: string;
  user: { name: string };
  evidenceName: string | null;
  evidenceMimeType: string | null;
  evidenceSize: number | null;
};

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  project?: { id?: string; name: string } | null;
  division?: { name: string } | null;
  assignee?: { id?: string; name: string } | null;
  links?: TaskLink[];
  issueReports?: TaskIssueReport[];
};

type Project = {
  id: string;
  name: string;
  description?: string | null;
  tasks?: Task[];
  _count?: { tasks?: number };
};

type Member = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  division?: { name: string } | null;
};

type DashboardData = {
  stats?: {
    totalTasks?: number;
    todo?: number;
    inProgress?: number;
    review?: number;
    done?: number;
    overdue?: number;
    totalUsers?: number;
    totalDivisions?: number;
    totalProjects?: number;
  };
  recentTasks?: Task[];
  tasks?: Task[];
  projects?: Array<{
    id: string;
    name: string;
    tasks?: Task[];
  }>;
};

const MENU = [
  { name: "Dashboard", icon: "▦" },
  { name: "Proyek", icon: "▤" },
  { name: "Tugas Saya", icon: "✓" },
  { name: "Board Kanban", icon: "▥" },
  { name: "Tim", icon: "♙" },
  { name: "Laporan", icon: "▤" },
];

const THEMES: Array<{
  id: Theme;
  label: string;
  description: string;
  icon: string;
}> = [
  { id: "light", label: "Terang", description: "Bersih dan lega", icon: "☀" },
  { id: "dark", label: "Gelap", description: "Nyaman untuk malam", icon: "☾" },
  { id: "glass", label: "Transparan", description: "Kaca dengan aurora", icon: "◈" },
  { id: "gold", label: "Emas", description: "Hangat dan mewah", icon: "✦" },
];

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "Belum Mulai",
  IN_PROGRESS: "Berjalan",
  REVIEW: "Menunggu Review",
  DONE: "Selesai",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  SPV: "Supervisor",
  MANAGER: "Manager",
  MEMBER: "Karyawan",
};

function formatDate(value?: string | null) {
  if (!value) return "Tanpa tenggat";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Tanpa tenggat";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Waktu tidak diketahui";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(value: number) {
  return value < 1024 * 1024
    ? `${Math.max(1, Math.round(value / 1024))} KB`
    : `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "R";
}

function errorMessage(data: unknown, fallback: string) {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return fallback;
}

/** Wrapper fetch: selalu parse JSON dan lempar Error dengan pesan dari server. */
async function request<T>(
  url: string,
  init: RequestInit = {},
  fallback = "Permintaan ke server gagal."
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers ?? {}),
    },
  });

  let result: unknown = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) throw new Error(errorMessage(result, fallback));

  return result as T;
}

/** API boleh mengirim array langsung ataupun { key: [...] }. */
function pickList<T>(result: unknown, key: string): T[] {
  if (Array.isArray(result)) return result as T[];

  if (typeof result === "object" && result !== null && key in result) {
    const value = (result as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }

  return [];
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "DONE") return false;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("rei-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("rei-theme-change", onChange);
  };
}

function getThemeSnapshot(): Theme {
  const savedTheme = window.localStorage.getItem("rei-theme");
  const saved = THEMES.find((item) => item.id === savedTheme);
  if (saved) return saved.id;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

export default function DashboardClient({ user }: { user: DashboardUser }) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [data, setData] = useState<DashboardData>({});
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskLinksDraft, setTaskLinksDraft] = useState<TaskLinkDraft[]>([]);
  const [newTaskLink, setNewTaskLink] = useState<TaskLinkDraft>({ label: "", url: "" });
  const [linkError, setLinkError] = useState("");
  const [linkNotice, setLinkNotice] = useState("");
  const [savingLinks, setSavingLinks] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [issueEvidence, setIssueEvidence] = useState<File | null>(null);
  const [issueError, setIssueError] = useState("");
  const [savingIssue, setSavingIssue] = useState(false);
  const [issueFileInputKey, setIssueFileInputKey] = useState(0);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    projectId: "",
    assigneeId: user.id,
  });

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
  });

  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER" as UserRole,
  });

  const canManageTasks = [
    "SUPER_ADMIN",
    "ADMIN",
    "SPV",
    "MANAGER",
  ].includes(user.role);

  const canAdmin = ["SUPER_ADMIN", "ADMIN"].includes(user.role);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!themeMenuOpen) return;

    function closeOnPointerDown(event: PointerEvent) {
      if (!themeMenuRef.current?.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setThemeMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [themeMenuOpen]);

  // Sorotan emas mengikuti kursor pada kartu (efek interaktif).
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    function spotlight(event: PointerEvent) {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        ".stat-card, .panel, .kanban-card"
      );
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    }

    document.addEventListener("pointermove", spotlight, { passive: true });
    return () => document.removeEventListener("pointermove", spotlight);
  }, []);

  useEffect(() => {
    if (!selectedTask) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedTask(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedTask]);

  /**
   * Muat data dashboard + data tambahan sesuai menu aktif.
   * silent = true -> tidak menampilkan state "Memuat..." (dipakai setelah aksi).
   */
  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");

      const needTasks = true;
      const needProjects = ["Proyek", "Laporan"].includes(activeMenu);
      const needMembers = activeMenu === "Tim";

      try {
        const [dashboard, tasksResult, projectsResult, membersResult] =
          await Promise.all([
            request<DashboardData>(
              "/api/dashboard",
              { method: "GET" },
              "Gagal mengambil data dashboard."
            ),
            needTasks
              ? request<unknown>("/api/tasks", { method: "GET" }, "Gagal mengambil data tugas.")
              : Promise.resolve(null),
            needProjects
              ? request<unknown>("/api/projects", { method: "GET" }, "Gagal mengambil data proyek.")
              : Promise.resolve(null),
            needMembers
              ? request<unknown>("/api/users", { method: "GET" }, "Gagal mengambil data tim.")
              : Promise.resolve(null),
          ]);

        setData(dashboard);
        if (tasksResult !== null) setAllTasks(pickList<Task>(tasksResult, "tasks"));
        if (projectsResult !== null)
          setProjects(pickList<Project>(projectsResult, "projects"));
        if (membersResult !== null)
          setMembers(pickList<Member>(membersResult, "users"));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Tidak dapat menghubungi server."
        );
      } finally {
        setLoading(false);
      }
    },
    [activeMenu]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Isi pilihan "Penanggung jawab" dan "Proyek" saat form tugas dibuka.
  useEffect(() => {
    if (!showForm) return;

    (async () => {
      try {
        if (members.length === 0) {
          const result = await request<unknown>("/api/users", { method: "GET" });
          setMembers(pickList<Member>(result, "users"));
        }
        if (projects.length === 0) {
          const result = await request<unknown>("/api/projects", { method: "GET" });
          setProjects(pickList<Project>(result, "projects"));
        }
      } catch {
        setError("Gagal memuat daftar anggota atau proyek untuk form.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm]);

  const isMine = useCallback(
    (task: Task) =>
      (task.assignee?.id && task.assignee.id === user.id) ||
      task.assignee?.name === user.name,
    [user.id, user.name]
  );

  const dashboardTasks = useMemo(
    () => data.recentTasks ?? data.tasks ?? [],
    [data]
  );

  const baseTasks = useMemo(() => {
    if (activeMenu === "Dashboard") return dashboardTasks;

    const merged = new Map<string, Task>();
    dashboardTasks.forEach((task) => merged.set(task.id, task));
    allTasks.forEach((task) => merged.set(task.id, task));
    return Array.from(merged.values());
  }, [activeMenu, dashboardTasks, allTasks]);

  const myTasksCount = useMemo(
    () => (allTasks.length ? allTasks : dashboardTasks).filter(isMine).length,
    [allTasks, dashboardTasks, isMine]
  );

  const tasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return baseTasks.filter((task) => {
      const matchesSearch =
        !query ||
        [
          task.title,
          task.description ?? "",
          task.project?.name ?? "",
          task.division?.name ?? "",
          task.assignee?.name ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      const matchesMenu = activeMenu !== "Tugas Saya" || isMine(task);

      return matchesSearch && matchesStatus && matchesMenu;
    });
  }, [baseTasks, search, statusFilter, activeMenu, isMine]);

  const stats = data.stats ?? {};
  const total = stats.totalTasks ?? 0;
  const done = stats.done ?? 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  /* ---------- Aksi: Tugas ---------- */

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Nama tugas wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await request(
        "/api/tasks",
        {
          method: "POST",
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            priority: form.priority,
            dueDate: form.dueDate || null,
            projectId: form.projectId || null,
            assigneeId: form.assigneeId || undefined,
          }),
        },
        "Tugas gagal disimpan."
      );

      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
        projectId: "",
        assigneeId: user.id,
      });
      setShowForm(false);
      setNotice("Tugas berhasil dibuat.");
      await refresh(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan tugas.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTaskStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;

    setError("");
    setNotice("");

    const previousAll = allTasks;
    const previousData = data;

    // Optimistic update supaya kanban/tabel langsung berubah.
    const patch = (list: Task[]) =>
      list.map((item) => (item.id === task.id ? { ...item, status } : item));

    setAllTasks(patch(allTasks));
    setData({
      ...data,
      recentTasks: data.recentTasks ? patch(data.recentTasks) : data.recentTasks,
      tasks: data.tasks ? patch(data.tasks) : data.tasks,
    });

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
      setError(
        err instanceof Error ? err.message : "Gagal memperbarui status tugas."
      );
    }
  }

  function openTaskDetails(task: Task) {
    setSelectedTask(task);
    setTaskLinksDraft(
      (task.links ?? []).map(({ label, url }) => ({ label, url }))
    );
    setNewTaskLink({ label: "", url: "" });
    setLinkError("");
    setLinkNotice("");
  }

  function addTaskLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = newTaskLink.label.trim();
    const url = newTaskLink.url.trim();

    if (!label || label.length > 80 || !url || url.length > 2048) {
      setLinkError("Nama tautan wajib diisi (maksimal 80 karakter) dan URL maksimal 2048 karakter.");
      return;
    }
    if (taskLinksDraft.length >= 20) {
      setLinkError("Maksimal 20 tautan dapat ditambahkan ke satu tugas.");
      return;
    }

    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
        setLinkError("Gunakan URL HTTP atau HTTPS yang valid.");
        return;
      }
      setTaskLinksDraft((links) => [...links, { label, url: parsedUrl.toString() }]);
      setNewTaskLink({ label: "", url: "" });
      setLinkError("");
      setLinkNotice("");
    } catch {
      setLinkError("Gunakan URL HTTP atau HTTPS yang valid.");
    }
  }

  async function saveTaskLinks() {
    if (!selectedTask) return;

    setSavingLinks(true);
    setLinkError("");
    setLinkNotice("");
    try {
      const result = await request<{ task: Task }>(
        `/api/tasks/${selectedTask.id}`,
        { method: "PATCH", body: JSON.stringify({ links: taskLinksDraft }) },
        "Tautan tugas gagal disimpan."
      );
      const updatedTask = result.task;
      const patchTask = (list: Task[]) =>
        list.map((task) => (task.id === updatedTask.id ? updatedTask : task));

      setAllTasks(patchTask);
      setData((previous) => ({
        ...previous,
        recentTasks: previous.recentTasks
          ? patchTask(previous.recentTasks)
          : previous.recentTasks,
        tasks: previous.tasks ? patchTask(previous.tasks) : previous.tasks,
      }));
      setSelectedTask(updatedTask);
      setTaskLinksDraft(
        (updatedTask.links ?? []).map(({ label, url }) => ({ label, url }))
      );
      setLinkNotice("Tautan berhasil disimpan.");
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Gagal menyimpan tautan tugas."
      );
    } finally {
      setSavingLinks(false);
    }
  }

  async function submitTaskIssue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask) return;

    const description = issueDescription.trim();
    if (!description) {
      setIssueError("Jelaskan kendala yang terjadi.");
      return;
    }

    setSavingIssue(true);
    setIssueError("");
    try {
      const body = new FormData();
      body.set("description", description);
      if (issueEvidence) body.set("evidence", issueEvidence);

      const result = await request<{ issueReport: TaskIssueReport }>(
        `/api/tasks/${selectedTask.id}/issues`,
        { method: "POST", body },
        "Laporan kendala gagal disimpan."
      );
      const updatedTask = {
        ...selectedTask,
        issueReports: [result.issueReport, ...(selectedTask.issueReports ?? [])],
      };
      const patchTask = (list: Task[]) =>
        list.map((task) => (task.id === updatedTask.id ? updatedTask : task));

      setAllTasks(patchTask);
      setData((previous) => ({
        ...previous,
        recentTasks: previous.recentTasks
          ? patchTask(previous.recentTasks)
          : previous.recentTasks,
        tasks: previous.tasks ? patchTask(previous.tasks) : previous.tasks,
      }));
      setSelectedTask(updatedTask);
      setIssueDescription("");
      setIssueEvidence(null);
      setIssueFileInputKey((key) => key + 1);
    } catch (err) {
      setIssueError(
        err instanceof Error ? err.message : "Gagal mengirim laporan kendala."
      );
    } finally {
      setSavingIssue(false);
    }
  }

  /* ---------- Aksi: Proyek ---------- */

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectForm.name.trim()) {
      setError("Nama proyek wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await request(
        "/api/projects",
        {
          method: "POST",
          body: JSON.stringify({
            name: projectForm.name.trim(),
            description: projectForm.description.trim() || null,
          }),
        },
        "Proyek gagal disimpan."
      );

      setProjectForm({ name: "", description: "" });
      setShowProjectForm(false);
      setNotice("Proyek berhasil dibuat.");
      await refresh(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan proyek.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Hapus proyek "${project.name}"?`)) return;

    setError("");
    setNotice("");

    try {
      await request(
        `/api/projects/${project.id}`,
        { method: "DELETE" },
        "Proyek gagal dihapus."
      );
      setNotice("Proyek berhasil dihapus.");
      await refresh(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus proyek.");
    }
  }

  /* ---------- Aksi: Tim ---------- */

  async function createMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      setError("Nama dan email anggota wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await request(
        "/api/users",
        {
          method: "POST",
          body: JSON.stringify({
            name: memberForm.name.trim(),
            email: memberForm.email.trim(),
            password: memberForm.password,
            role: memberForm.role,
          }),
        },
        "Anggota gagal disimpan."
      );

      setMemberForm({ name: "", email: "", password: "", role: "MEMBER" });
      setShowMemberForm(false);
      setNotice("Anggota berhasil ditambahkan.");
      await refresh(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan anggota.");
    } finally {
      setSaving(false);
    }
  }

  async function updateMemberRole(member: Member, role: UserRole) {
    if (member.role === role) return;

    setError("");
    setNotice("");

    try {
      await request(
        `/api/users/${member.id}`,
        { method: "PATCH", body: JSON.stringify({ role }) },
        "Peran gagal diperbarui."
      );
      setNotice("Peran anggota berhasil diperbarui.");
      await refresh(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui peran.");
    }
  }

  async function logout() {
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal. Silakan coba kembali.");
      }

      window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout gagal.");
    }
  }

  /* ---------- Ekspor ---------- */

  function exportTasks() {
    if (activeMenu === "Proyek") {
      downloadCsv("laporan-proyek-rei.csv", [
        ["Nama Proyek", "Deskripsi", "Total Tugas", "Selesai", "Progres"],
        ...projects.map((project) => {
          const list = projectTasks(project);
          const completed = list.filter((t) => t.status === "DONE").length;
          const pct = list.length ? Math.round((completed / list.length) * 100) : 0;
          return [
            project.name,
            project.description ?? "",
            String(list.length),
            String(completed),
            `${pct}%`,
          ];
        }),
      ]);
      return;
    }

    if (activeMenu === "Tim") {
      downloadCsv("laporan-tim-rei.csv", [
        ["Nama", "Email", "Peran", "Divisi", "Total Tugas", "Tugas Selesai"],
        ...members.map((member) => {
          const list = memberTasks(member);
          return [
            member.name,
            member.email,
            ROLE_LABEL[member.role],
            member.division?.name ?? "",
            String(list.length),
            String(list.filter((t) => t.status === "DONE").length),
          ];
        }),
      ]);
      return;
    }

    downloadCsv("laporan-tugas-rei.csv", [
      ["Nama Tugas", "Proyek", "Divisi", "Penanggung Jawab", "Prioritas", "Status", "Tenggat"],
      ...tasks.map((task) => [
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

  /* ---------- Helper turunan data ---------- */

  function projectTasks(project: Project): Task[] {
    if (project.tasks && project.tasks.length) return project.tasks;

    const fromAll = allTasks.filter(
      (task) =>
        (task.project?.id && task.project.id === project.id) ||
        task.project?.name === project.name
    );

    return fromAll;
  }

  function memberTasks(member: Member): Task[] {
    return allTasks.filter(
      (task) =>
        (task.assignee?.id && task.assignee.id === member.id) ||
        task.assignee?.name === member.name
    );
  }

  const report = useMemo(() => {
    const byStatus = STATUSES.map((status) => ({
      label: STATUS_LABEL[status],
      value: allTasks.filter((task) => task.status === status).length,
    }));

    const byPriority = (Object.keys(PRIORITY_LABEL) as TaskPriority[]).map(
      (priority) => ({
        label: PRIORITY_LABEL[priority],
        value: allTasks.filter((task) => task.priority === priority).length,
      })
    );

    const assigneeMap = new Map<string, { total: number; done: number }>();
    allTasks.forEach((task) => {
      const name = task.assignee?.name ?? "Belum ditetapkan";
      const entry = assigneeMap.get(name) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (task.status === "DONE") entry.done += 1;
      assigneeMap.set(name, entry);
    });

    const projectMap = new Map<string, { total: number; done: number }>();
    allTasks.forEach((task) => {
      const name = task.project?.name ?? "Tanpa proyek";
      const entry = projectMap.get(name) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (task.status === "DONE") entry.done += 1;
      projectMap.set(name, entry);
    });

    return {
      total: allTasks.length,
      done: allTasks.filter((task) => task.status === "DONE").length,
      inProgress: allTasks.filter((task) => task.status === "IN_PROGRESS").length,
      overdue: allTasks.filter(isOverdue).length,
      byStatus,
      byPriority,
      byAssignee: Array.from(assigneeMap.entries()).map(([label, v]) => ({
        label,
        ...v,
      })),
      byProject: Array.from(projectMap.entries()).map(([label, v]) => ({
        label,
        ...v,
      })),
      overdueTasks: allTasks.filter(isOverdue),
    };
  }, [allTasks]);

  function switchMenu(name: string) {
    setActiveMenu(name);
    setSearch("");
    setStatusFilter("ALL");
    setNotice("");
    setError("");
    setShowForm(false);
    setShowProjectForm(false);
    setShowMemberForm(false);
  }

  function chooseTheme(nextTheme: Theme) {
    window.localStorage.setItem("rei-theme", nextTheme);
    window.dispatchEvent(new Event("rei-theme-change"));
    setThemeMenuOpen(false);
  }

  const showTasksPanel = ["Dashboard", "Tugas Saya", "Board Kanban"].includes(
    activeMenu
  );

  const primaryAction = (() => {
    if (["Dashboard", "Tugas Saya", "Board Kanban"].includes(activeMenu) && canManageTasks) {
      return { label: "＋ Buat Tugas", onClick: () => { setShowForm(!showForm); setError(""); } };
    }
    if (activeMenu === "Proyek" && canManageTasks) {
      return { label: "＋ Buat Proyek", onClick: () => { setShowProjectForm(!showProjectForm); setError(""); } };
    }
    if (activeMenu === "Tim" && canAdmin) {
      return { label: "＋ Tambah Anggota", onClick: () => { setShowMemberForm(!showMemberForm); setError(""); } };
    }
    return null;
  })();

  return (
    <div className="rei-app">
      <aside className="sidebar">
        <div className="brand">
         <div
  style={{
    padding: "20px 16px",
    borderBottom: "1px solid rgba(212, 175, 55, 0.25)",
    marginBottom: "12px",
  }}
>
  <ReiLogo compact />
</div>
          <div>
            <div className="brand-name">RAJA EMAS</div>
            <div className="brand-subtitle">WORK MANAGEMENT</div>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace">
         
          <div className="workspace-info">
            <strong>REI Indonesia</strong>
            <span>Workspace utama</span>
          </div>
        </div>

        <div className="menu-label">MENU UTAMA</div>
        <nav className="navigation">
          {MENU.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activeMenu === item.name ? "active" : ""}`}
              onClick={() => switchMenu(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              {item.name === "Tugas Saya" && (
                <span className="nav-count">
                  {myTasksCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <strong>REI Work Management</strong>
            <p>Kelola pekerjaan, tim, dan progres dalam satu tempat.</p>
            <button onClick={() => setNotice("Hubungi administrator jika Anda memerlukan bantuan.")}>
              Pusat Bantuan →
            </button>
          </div>

          <div className="profile">
            <div className="profile-avatar">{initials(user.name)}</div>
            <div className="profile-info">
              <strong>{user.name}</strong>
              <span>{ROLE_LABEL[user.role]}</span>
            </div>
            <button
              className="profile-more"
              aria-label="Menu profil"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              •••
            </button>
          </div>

          {showProfileMenu && (
            <div className="profile-menu">
              <div className="profile-email">{user.email}</div>
              <button onClick={logout}>Keluar dari akun ↗</button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>REI Indonesia</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activeMenu}</strong>
          </div>

          <div className="topbar-actions">
            <div className="system-status">
              <span className="status-dot" />
              Terhubung
            </div>
            <div className="theme-switcher" ref={themeMenuRef}>
              <button
                className="theme-toggle"
                type="button"
                aria-label="Ubah tema tampilan"
                aria-haspopup="menu"
                aria-expanded={themeMenuOpen}
                title="Ubah tema tampilan"
                onClick={() => setThemeMenuOpen((open) => !open)}
              >
                <span className="theme-toggle-icon" aria-hidden="true">
                  {THEMES.find((item) => item.id === theme)?.icon}
                </span>
                <span>{THEMES.find((item) => item.id === theme)?.label}</span>
                <span className={`theme-caret ${themeMenuOpen ? "open" : ""}`} aria-hidden="true">
                  ⌄
                </span>
              </button>

              {themeMenuOpen && (
                <div className="theme-menu" role="menu" aria-label="Pilihan tema">
                  <div className="theme-menu-heading">
                    <strong>Tampilan</strong>
                    <span>Pilih suasana kerja</span>
                  </div>
                  {THEMES.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={theme === item.id}
                      className={`theme-option ${theme === item.id ? "active" : ""}`}
                      style={{ animationDelay: `${index * 45}ms` }}
                      onClick={() => chooseTheme(item.id)}
                    >
                      <span className={`theme-swatch theme-swatch-${item.id}`} aria-hidden="true" />
                      <span className="theme-option-text">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                      <span className="theme-check" aria-hidden="true">
                        {theme === item.id ? "✓" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="icon-button"
              aria-label="Muat ulang data"
              title="Muat ulang data"
              onClick={() => void refresh()}
            >
              ↻
            </button>
            <button
              className="topbar-avatar"
              title={user.name}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {initials(user.name)}
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">WORKSPACE OVERVIEW</div>
              <h1>{activeMenu}</h1>
              <p>
                Selamat datang, {user.name}. Pantau pekerjaan dan
                kolaborasi tim Raja Emas Indonesia.
              </p>
              <span className="role-label">{ROLE_LABEL[user.role]}</span>
            </div>

            <div className="welcome-actions">
              <button className="secondary-button" onClick={exportTasks}>
                ↓ Ekspor CSV
              </button>
              {primaryAction && (
                <button className="primary-button" onClick={primaryAction.onClick}>
                  {primaryAction.label}
                </button>
              )}
            </div>
          </section>

          {error && (
            <div className="message error-message" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Tutup pesan">
                ×
              </button>
            </div>
          )}

          {notice && (
            <div className="message success-message" role="status">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Tutup pesan">
                ×
              </button>
            </div>
          )}

          {showForm && canManageTasks && showTasksPanel && (
            <form className="new-task-panel" onSubmit={createTask}>
              <div className="form-heading">
                <strong>Buat tugas baru</strong>
                <p>Data akan dikirim ke server untuk disimpan.</p>
              </div>

              <div className="form-grid">
                <label>
                  Nama tugas *
                  <input
                    required
                    maxLength={180}
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    placeholder="Contoh: Evaluasi kinerja tim"
                  />
                </label>

                <label>
                  Prioritas
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                  >
                    <option value="LOW">Rendah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi</option>
                    <option value="URGENT">Mendesak</option>
                  </select>
                </label>

                <label>
                  Tenggat waktu
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm({ ...form, dueDate: event.target.value })
                    }
                  />
                </label>

                <label>
                  Ditugaskan kepada *
                  <select
                    required
                    value={form.assigneeId}
                    onChange={(event) =>
                      setForm({ ...form, assigneeId: event.target.value })
                    }
                  >
                    {!members.some((member) => member.id === user.id) && (
                      <option value={user.id}>{user.name} (Saya)</option>
                    )}
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {ROLE_LABEL[member.role]}
                        {member.id === user.id ? " (Saya)" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Proyek
                  <select
                    value={form.projectId}
                    onChange={(event) =>
                      setForm({ ...form, projectId: event.target.value })
                    }
                  >
                    <option value="">Tanpa proyek</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="description-field">
                  Deskripsi
                  <textarea
                    maxLength={5000}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="Jelaskan pekerjaan yang perlu dilakukan..."
                    rows={3}
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Tugas"}
                </button>
              </div>
            </form>
          )}

          {showProjectForm && canManageTasks && activeMenu === "Proyek" && (
            <form className="new-task-panel" onSubmit={createProject}>
              <div className="form-heading">
                <strong>Buat proyek baru</strong>
                <p>Data akan dikirim ke server untuk disimpan.</p>
              </div>

              <div className="form-grid">
                <label>
                  Nama proyek *
                  <input
                    required
                    maxLength={180}
                    value={projectForm.name}
                    onChange={(event) =>
                      setProjectForm({ ...projectForm, name: event.target.value })
                    }
                    placeholder="Contoh: Kampanye Q4"
                  />
                </label>

                <label className="description-field">
                  Deskripsi
                  <textarea
                    maxLength={5000}
                    value={projectForm.description}
                    onChange={(event) =>
                      setProjectForm({ ...projectForm, description: event.target.value })
                    }
                    placeholder="Jelaskan tujuan proyek..."
                    rows={3}
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowProjectForm(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Proyek"}
                </button>
              </div>
            </form>
          )}

          {showMemberForm && canAdmin && activeMenu === "Tim" && (
            <form className="new-task-panel" onSubmit={createMember}>
              <div className="form-heading">
                <strong>Tambah anggota tim</strong>
                <p>Akun baru akan dibuat di database.</p>
              </div>

              <div className="form-grid">
                <label>
                  Nama lengkap *
                  <input
                    required
                    maxLength={120}
                    value={memberForm.name}
                    onChange={(event) =>
                      setMemberForm({ ...memberForm, name: event.target.value })
                    }
                    placeholder="Nama anggota"
                  />
                </label>

                <label>
                  Email *
                  <input
                    required
                    type="email"
                    value={memberForm.email}
                    onChange={(event) =>
                      setMemberForm({ ...memberForm, email: event.target.value })
                    }
                    placeholder="nama@perusahaan.com"
                  />
                </label>

                <label>
                  Peran
                  <select
                    value={memberForm.role}
                    onChange={(event) =>
                      setMemberForm({
                        ...memberForm,
                        role: event.target.value as UserRole,
                      })
                    }
                  >
                    {(Object.keys(ROLE_LABEL) as UserRole[])
                      .filter((role) => role !== "SUPER_ADMIN" || user.role === "SUPER_ADMIN")
                      .map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="description-field">
                  Kata sandi awal
                  <input
                    type="password"
                    minLength={8}
                    value={memberForm.password}
                    onChange={(event) =>
                      setMemberForm({ ...memberForm, password: event.target.value })
                    }
                    placeholder="Minimal 8 karakter"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowMemberForm(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Anggota"}
                </button>
              </div>
            </form>
          )}

          {/* ================= DASHBOARD ================= */}
          {activeMenu === "Dashboard" && (
            <>
              <section className="stats-grid">
                <StatCard
                  label="Total Tugas"
                  value={stats.totalTasks ?? 0}
                  note="Tugas sesuai hak akses"
                  icon="▤"
                  color="var(--rei-accent)"
                />
                <StatCard
                  label="Belum Mulai"
                  value={stats.todo ?? 0}
                  note="Menunggu dikerjakan"
                  icon="◷"
                  color="var(--rei-neutral-text)"
                />
                <StatCard
                  label="Sedang Berjalan"
                  value={stats.inProgress ?? 0}
                  note="Dalam pengerjaan"
                  icon="↗"
                  color="var(--rei-orange-text)"
                />
                <StatCard
                  label="Selesai"
                  value={stats.done ?? 0}
                  note={`${progress}% penyelesaian`}
                  icon="✓"
                  color="var(--rei-success-text)"
                />
              </section>

              <section className="overview-grid">
                <article className="panel progress-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Ringkasan progres</h2>
                      <p>Persentase penyelesaian tugas dari data server</p>
                    </div>
                    <span className="live-pill">LIVE DATA</span>
                  </div>

                  <div className="progress-summary">
                    <div
                      className="progress-ring"
                      style={{
                        background: `conic-gradient(var(--rei-accent) 0deg ${progress * 3.6}deg, var(--rei-chart-track) ${progress * 3.6}deg 360deg)`,
                      }}
                    >
                      <div className="progress-ring-inner">
                        <strong>{progress}%</strong>
                        <span>Selesai</span>
                      </div>
                    </div>

                    <div className="progress-legend">
                      <Legend color="var(--rei-neutral-text)" label="Belum mulai" value={stats.todo ?? 0} />
                      <Legend color="var(--rei-orange-text)" label="Berjalan" value={stats.inProgress ?? 0} />
                      <Legend color="var(--rei-warning-text)" label="Review" value={stats.review ?? 0} />
                      <Legend color="var(--rei-success-text)" label="Selesai" value={stats.done ?? 0} />
                    </div>
                  </div>

                  <div className="progress-footer">
                    <span>Total tugas selesai</span>
                    <strong>{done} dari {total}</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="mini-stats">
                    <div>
                      <span>Pengguna</span>
                      <strong>{stats.totalUsers ?? 0}</strong>
                    </div>
                    <div>
                      <span>Divisi</span>
                      <strong>{stats.totalDivisions ?? 0}</strong>
                    </div>
                    <div>
                      <span>Terlambat</span>
                      <strong className="overdue-number">{stats.overdue ?? 0}</strong>
                    </div>
                  </div>
                </article>

                <article className="panel projects-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Proyek</h2>
                      <p>Proyek yang tersedia pada data dashboard</p>
                    </div>
                    <button className="text-button" onClick={() => switchMenu("Proyek")}>
                      Lihat proyek →
                    </button>
                  </div>

                  <div className="project-list">
                    {(data.projects ?? []).length === 0 && (
                      <div className="empty-projects">
                        {loading
                          ? "Memuat data proyek..."
                          : "Belum ada data proyek atau API belum mengirim daftar proyek."}
                      </div>
                    )}

                    {(data.projects ?? []).slice(0, 5).map((project, index) => {
                      const list = project.tasks ?? [];
                      const completed = list.filter(
                        (task) => task.status === "DONE"
                      ).length;
                      const percentage = list.length
                        ? Math.round((completed / list.length) * 100)
                        : 0;

                      return (
                        <div className="project-row" key={project.id}>
                          <div className={`project-symbol project-color-${index % 3}`}>
                            {initials(project.name)}
                          </div>
                          <div className="project-details">
                            <strong>{project.name}</strong>
                            <span>{list.length} tugas · {completed} selesai</span>
                            <div className="mini-track">
                              <div
                                style={{
                                  width: `${percentage}%`,
                                  background: index % 3 === 1 ? "var(--rei-gold)" : "var(--rei-accent)",
                                }}
                              />
                            </div>
                          </div>
                          <strong className="project-percent">{percentage}%</strong>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </section>
            </>
          )}

          {/* ================= PROYEK ================= */}
          {activeMenu === "Proyek" && (
            <section className="project-grid">
              {projects.length === 0 && (
                <article className="panel">
                  <div className="empty-projects">
                    {loading
                      ? "Memuat data proyek..."
                      : "Belum ada proyek. Buat proyek pertama Anda."}
                  </div>
                </article>
              )}

              {projects.map((project, index) => {
                const list = projectTasks(project);
                const completed = list.filter((task) => task.status === "DONE").length;
                const percentage = list.length
                  ? Math.round((completed / list.length) * 100)
                  : 0;
                const inProgress = list.filter((task) => task.status === "IN_PROGRESS").length;

                return (
                  <article className="panel" key={project.id}>
                    <div className="project-row">
                      <div className={`project-symbol project-color-${index % 3}`}>
                        {initials(project.name)}
                      </div>
                      <div className="project-details">
                        <strong>{project.name}</strong>
                        <span>{list.length} tugas · {completed} selesai · {inProgress} berjalan</span>
                        <div className="mini-track">
                          <div
                            style={{
                              width: `${percentage}%`,
                              background: index % 3 === 1 ? "var(--rei-gold)" : "var(--rei-accent)",
                            }}
                          />
                        </div>
                      </div>
                      <strong className="project-percent">{percentage}%</strong>
                    </div>

                    {project.description && (
                      <p className="project-description">{project.description}</p>
                    )}

                    <div className="project-card-actions">
                      <button
                        className="text-button"
                        onClick={() => {
                          switchMenu("Board Kanban");
                          setSearch(project.name);
                        }}
                      >
                        Buka di board →
                      </button>
                      {canAdmin && (
                        <button
                          className="text-button danger-text"
                          onClick={() => void deleteProject(project)}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {/* ================= TIM ================= */}
          {activeMenu === "Tim" && (
            <section className="panel tasks-panel">
              <div className="panel-heading tasks-heading">
                <div>
                  <h2>Anggota tim</h2>
                  <p>Pengguna terdaftar beserta beban kerjanya</p>
                </div>
                <span className="live-pill">{members.length} ANGGOTA</span>
              </div>

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
                      <tr>
                        <td colSpan={6} className="empty-state">
                          Memuat data tim...
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          Belum ada anggota tim.
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => {
                        const list = memberTasks(member);
                        const completed = list.filter((t) => t.status === "DONE").length;

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
                                    void updateMemberRole(member, event.target.value as UserRole)
                                  }
                                  aria-label={`Ubah peran ${member.name}`}
                                >
                                  {(Object.keys(ROLE_LABEL) as UserRole[])
                                    .filter(
                                      (role) =>
                                        role !== "SUPER_ADMIN" ||
                                        user.role === "SUPER_ADMIN" ||
                                        member.role === "SUPER_ADMIN"
                                    )
                                    .map((role) => (
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
                            <td>{completed}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>Menampilkan {members.length} anggota</span>
                <button className="text-button" onClick={() => void refresh()}>
                  ↻ Perbarui data
                </button>
              </div>
            </section>
          )}

          {/* ================= LAPORAN ================= */}
          {activeMenu === "Laporan" && (
            <>
              <section className="stats-grid">
                <StatCard
                  label="Total Tugas"
                  value={report.total}
                  note="Seluruh tugas sesuai hak akses"
                  icon="▤"
                  color="var(--rei-accent)"
                />
                <StatCard
                  label="Selesai"
                  value={report.done}
                  note={`${report.total ? Math.round((report.done / report.total) * 100) : 0}% penyelesaian`}
                  icon="✓"
                  color="var(--rei-success-text)"
                />
                <StatCard
                  label="Sedang Berjalan"
                  value={report.inProgress}
                  note="Dalam pengerjaan"
                  icon="↗"
                  color="var(--rei-orange-text)"
                />
                <StatCard
                  label="Terlambat"
                  value={report.overdue}
                  note="Lewat tenggat"
                  icon="◷"
                  color="var(--rei-danger-text)"
                />
              </section>

              <section className="overview-grid">
                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Tugas per status</h2>
                      <p>Distribusi status seluruh tugas</p>
                    </div>
                  </div>
                  <div className="report-list">
                    {report.byStatus.map((row) => (
                      <ReportBar key={row.label} label={row.label} value={row.value} max={report.total} />
                    ))}
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Tugas per prioritas</h2>
                      <p>Distribusi tingkat prioritas</p>
                    </div>
                  </div>
                  <div className="report-list">
                    {report.byPriority.map((row) => (
                      <ReportBar key={row.label} label={row.label} value={row.value} max={report.total} />
                    ))}
                  </div>
                </article>
              </section>

              <section className="overview-grid">
                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Kinerja per proyek</h2>
                      <p>Tugas selesai dibanding total</p>
                    </div>
                  </div>
                  <div className="report-list">
                    {report.byProject.length === 0 && (
                      <div className="empty-projects">
                        {loading ? "Memuat data..." : "Belum ada data."}
                      </div>
                    )}
                    {report.byProject.map((row) => (
                      <ReportBar
                        key={row.label}
                        label={row.label}
                        value={row.done}
                        max={row.total}
                        suffix={`${row.done}/${row.total}`}
                      />
                    ))}
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Kinerja per penanggung jawab</h2>
                      <p>Tugas selesai dibanding total</p>
                    </div>
                  </div>
                  <div className="report-list">
                    {report.byAssignee.length === 0 && (
                      <div className="empty-projects">
                        {loading ? "Memuat data..." : "Belum ada data."}
                      </div>
                    )}
                    {report.byAssignee.map((row) => (
                      <ReportBar
                        key={row.label}
                        label={row.label}
                        value={row.done}
                        max={row.total}
                        suffix={`${row.done}/${row.total}`}
                      />
                    ))}
                  </div>
                </article>
              </section>

              <section className="panel tasks-panel">
                <div className="panel-heading tasks-heading">
                  <div>
                    <h2>Tugas terlambat</h2>
                    <p>Belum selesai dan sudah melewati tenggat</p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>NAMA TUGAS</th>
                        <th>PROYEK / DIVISI</th>
                        <th>PENANGGUNG JAWAB</th>
                        <th>PRIORITAS</th>
                        <th>TENGGAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.overdueTasks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="empty-state">
                            {loading ? "Memuat data..." : "Tidak ada tugas terlambat."}
                          </td>
                        </tr>
                      ) : (
                        report.overdueTasks.map((task) => (
                          <tr key={task.id}>
                            <td>
                              <div className="task-name">
                                <span className="task-indicator" />
                                <span className="task-title">{task.title}</span>
                              </div>
                            </td>
                            <td>
                              <span className="project-tag">
                                {task.project?.name ?? task.division?.name ?? "Umum"}
                              </span>
                            </td>
                            <td>{task.assignee?.name ?? "Belum ditetapkan"}</td>
                            <td>
                              <span className={`priority priority-${task.priority.toLowerCase()}`}>
                                {PRIORITY_LABEL[task.priority]}
                              </span>
                            </td>
                            <td className="due-date">{formatDate(task.dueDate)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer">
                  <span>{report.overdueTasks.length} tugas terlambat</span>
                  <button className="text-button" onClick={() => void refresh()}>
                    ↻ Perbarui data
                  </button>
                </div>
              </section>
            </>
          )}

          {/* ============ DASHBOARD / TUGAS SAYA / KANBAN ============ */}
          {showTasksPanel && (
            <section className="panel tasks-panel">
              <div className="panel-heading tasks-heading">
                <div>
                  <h2>
                    {activeMenu === "Tugas Saya"
                      ? "Tugas Saya"
                      : activeMenu === "Board Kanban"
                        ? "Board Kanban"
                        : "Daftar tugas"}
                  </h2>
                  <p>
                    Status dan informasi tugas dari database
                  </p>
                </div>

                <div className="task-tools">
                  <div className="search-box">
                    <span>⌕</span>
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Cari tugas..."
                      aria-label="Cari tugas"
                    />
                  </div>

                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    aria-label="Filter status"
                  >
                    <option value="ALL">Semua status</option>
                    <option value="TODO">Belum mulai</option>
                    <option value="IN_PROGRESS">Berjalan</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Selesai</option>
                  </select>
                </div>
              </div>

              {activeMenu === "Board Kanban" ? (
                <div className="kanban-grid">
                  {STATUSES.map((status) => (
                    <div
                      className={`kanban-column ${dragOver === status ? "drag-over" : ""}`}
                      key={status}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOver(status);
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragOver(null);
                        const task = allTasks.find((item) => item.id === dragId);
                        setDragId(null);
                        if (task) void updateTaskStatus(task, status);
                      }}
                    >
                      <div className="kanban-title">
                        <span>{STATUS_LABEL[status]}</span>
                        <strong>
                          {tasks.filter((task) => task.status === status).length}
                        </strong>
                      </div>
                      {loading && tasks.length === 0 && (
                        <div className="empty-projects">Memuat...</div>
                      )}
                      {tasks
                        .filter((task) => task.status === status)
                        .map((task) => (
                          <article
                            className="kanban-card"
                            key={task.id}
                            draggable
                            onDragStart={() => setDragId(task.id)}
                            onDragEnd={() => {
                              setDragId(null);
                              setDragOver(null);
                            }}
                          >
                            <button
                              className="kanban-card-details"
                              type="button"
                              onClick={() => openTaskDetails(task)}
                              aria-label={`Lihat detail tugas ${task.title}`}
                            >
                              <strong>{task.title}</strong>
                              <span>{task.project?.name ?? "Tanpa proyek"}</span>
                              <span>{task.assignee?.name ?? "Belum ditetapkan"}</span>
                              <small>
                                {PRIORITY_LABEL[task.priority]} · {formatDate(task.dueDate)}
                              </small>
                              {!!task.links?.length && (
                                <span className="kanban-link-count">
                                  ↗ {task.links.length} tautan
                                </span>
                              )}
                            </button>
                            <select
                              className={`status-select status-${task.status.toLowerCase()}`}
                              value={task.status}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                void updateTaskStatus(task, event.target.value as TaskStatus)
                              }
                              aria-label={`Ubah status ${task.title}`}
                            >
                              <option value="TODO">Belum Mulai</option>
                              <option value="IN_PROGRESS">Berjalan</option>
                              <option value="REVIEW">Review</option>
                              <option value="DONE">Selesai</option>
                            </select>
                          </article>
                        ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>NAMA TUGAS</th>
                        <th>PROYEK / DIVISI</th>
                        <th>PENANGGUNG JAWAB</th>
                        <th>PRIORITAS</th>
                        <th>STATUS</th>
                        <th>TENGGAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            Memuat data dari PostgreSQL...
                          </td>
                        </tr>
                      ) : tasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            Tidak ada tugas yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        tasks.map((task) => (
                          <tr key={task.id}>
                            <td>
                              <div className="task-name">
                                <span className={`task-indicator ${task.status === "DONE" ? "indicator-done" : ""}`} />
                                <span className="task-title">{task.title}</span>
                              </div>
                            </td>
                            <td>
                              <span className="project-tag">
                                {task.project?.name ?? task.division?.name ?? "Umum"}
                              </span>
                            </td>
                            <td>{task.assignee?.name ?? "Belum ditetapkan"}</td>
                            <td>
                              <span className={`priority priority-${task.priority.toLowerCase()}`}>
                                {PRIORITY_LABEL[task.priority]}
                              </span>
                            </td>
                            <td>
                              <select
                                className={`status-select status-${task.status.toLowerCase()}`}
                                value={task.status}
                                onChange={(event) =>
                                  void updateTaskStatus(
                                    task,
                                    event.target.value as TaskStatus
                                  )
                                }
                                aria-label={`Ubah status ${task.title}`}
                              >
                                <option value="TODO">Belum Mulai</option>
                                <option value="IN_PROGRESS">Berjalan</option>
                                <option value="REVIEW">Review</option>
                                <option value="DONE">Selesai</option>
                              </select>
                            </td>
                            <td className="due-date">{formatDate(task.dueDate)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="table-footer">
                <span>
                  Menampilkan {tasks.length} tugas
                  {loading ? " · Memuat..." : ""}
                </span>
                <button className="text-button" onClick={() => void refresh()}>
                  ↻ Perbarui data
                </button>
              </div>
            </section>
          )}

          <footer className="page-footer">
            <span>© 2026 REI Work Management</span>
            <span>Raja Emas Indonesia · Sistem manajemen pekerjaan</span>
          </footer>
        </div>
      </main>

      {selectedTask && (
        <div
          className="task-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedTask(null);
          }}
        >
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
          >
            <div className="task-modal-heading">
              <div>
                <span className="task-modal-eyebrow">DETAIL TUGAS</span>
                <h2 id="task-modal-title">{selectedTask.title}</h2>
              </div>
              <button
                type="button"
                className="task-modal-close"
                aria-label="Tutup detail tugas"
                onClick={() => setSelectedTask(null)}
              >
                ×
              </button>
            </div>

            <div className="task-modal-meta">
              <span className={`status-select status-${selectedTask.status.toLowerCase()}`}>
                {STATUS_LABEL[selectedTask.status]}
              </span>
              <span className={`priority priority-${selectedTask.priority.toLowerCase()}`}>
                {PRIORITY_LABEL[selectedTask.priority]}
              </span>
              <span>{selectedTask.project?.name ?? "Tanpa proyek"}</span>
            </div>

            <div className="task-modal-details">
              <div>
                <span>Penanggung jawab</span>
                <strong>{selectedTask.assignee?.name ?? "Belum ditetapkan"}</strong>
              </div>
              <div>
                <span>Tenggat</span>
                <strong>{formatDate(selectedTask.dueDate)}</strong>
              </div>
            </div>

            <div className="task-modal-description">
              <h3>Deskripsi</h3>
              <p>{selectedTask.description || "Belum ada deskripsi untuk tugas ini."}</p>
            </div>

            <div className="task-links-section">
              <div className="task-links-heading">
                <div>
                  <h3>Tautan tugas</h3>
                  <p>Tambahkan GitHub, dokumen, desain, atau referensi lainnya.</p>
                </div>
                <span>{taskLinksDraft.length}/20</span>
              </div>

              {taskLinksDraft.length > 0 ? (
                <ul className="task-links-list">
                  {taskLinksDraft.map((link, index) => (
                    <li key={`${link.url}-${index}`}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <span>{link.label}</span>
                        <small>{link.url}</small>
                      </a>
                      <button
                        type="button"
                        aria-label={`Hapus tautan ${link.label}`}
                        onClick={() => {
                          setTaskLinksDraft((links) =>
                            links.filter((_, linkIndex) => linkIndex !== index)
                          );
                          setLinkNotice("");
                        }}
                      >
                        Hapus
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="task-links-empty">Belum ada tautan pada tugas ini.</p>
              )}

              <form className="task-link-form" onSubmit={addTaskLink}>
                <label>
                  Nama tautan
                  <input
                    value={newTaskLink.label}
                    maxLength={80}
                    onChange={(event) =>
                      setNewTaskLink({ ...newTaskLink, label: event.target.value })
                    }
                    placeholder="Contoh: GitHub repository"
                    required
                  />
                </label>
                <label>
                  URL
                  <input
                    type="url"
                    value={newTaskLink.url}
                    maxLength={2048}
                    onChange={(event) =>
                      setNewTaskLink({ ...newTaskLink, url: event.target.value })
                    }
                    placeholder="https://..."
                    required
                  />
                </label>
                <button className="secondary-button" type="submit">
                  + Tambah tautan
                </button>
              </form>

              {linkError && <p className="task-link-error" role="alert">{linkError}</p>}
              {linkNotice && <p className="task-link-notice" role="status">{linkNotice}</p>}

              <div className="task-modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setSelectedTask(null)}
                >
                  Tutup
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void saveTaskLinks()}
                  disabled={savingLinks}
                >
                  {savingLinks ? "Menyimpan..." : "Simpan tautan"}
                </button>
              </div>
            </div>

            <div className="task-issues-section">
              <div className="task-issues-heading">
                <h3>Riwayat kendala</h3>
                <span>{selectedTask.issueReports?.length ?? 0} laporan</span>
              </div>

              {selectedTask.issueReports?.length ? (
                <ul className="task-issue-list">
                  {selectedTask.issueReports.map((report) => (
                    <li key={report.id}>
                      <div className="task-issue-meta">
                        <strong>{report.user.name}</strong>
                        <time dateTime={report.createdAt}>
                          {formatDateTime(report.createdAt)}
                        </time>
                      </div>
                      <p>{report.description}</p>
                      {report.evidenceName && report.evidenceMimeType && (
                        <a
                          className="task-issue-evidence"
                          href={`/api/tasks/${selectedTask.id}/issues/${report.id}/evidence`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ↗ Bukti: {report.evidenceName}
                          {report.evidenceSize !== null &&
                            ` · ${formatFileSize(report.evidenceSize)}`}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="task-issue-empty">Belum ada kendala yang dilaporkan.</p>
              )}

              <form className="task-issue-form" onSubmit={submitTaskIssue}>
                <label>
                  Jelaskan kendala *
                  <textarea
                    value={issueDescription}
                    maxLength={5000}
                    onChange={(event) => setIssueDescription(event.target.value)}
                    placeholder="Ceritakan masalah atau hambatan yang terjadi..."
                    rows={3}
                    required
                  />
                </label>
                <label>
                  Bukti kendala <span>(opsional)</span>
                  <input
                    key={issueFileInputKey}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && file.size > 10 * 1024 * 1024) {
                        setIssueEvidence(null);
                        setIssueError("Ukuran file bukti maksimal 10 MB.");
                        setIssueFileInputKey((key) => key + 1);
                        return;
                      }
                      if (
                        file &&
                        !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
                          file.type
                        )
                      ) {
                        setIssueEvidence(null);
                        setIssueError("Pilih gambar JPG, PNG, WebP, atau file PDF.");
                        setIssueFileInputKey((key) => key + 1);
                        return;
                      }
                      setIssueEvidence(file);
                      setIssueError("");
                    }}
                  />
                  <small>JPG, PNG, WebP, atau PDF · maksimal 10 MB</small>
                </label>
                {issueEvidence && (
                  <p className="task-issue-selected-file">
                    File dipilih: {issueEvidence.name} · {formatFileSize(issueEvidence.size)}
                  </p>
                )}
                {issueError && <p className="task-link-error" role="alert">{issueError}</p>}
                <div className="task-issue-actions">
                  <span>Bukti tidak wajib disertakan.</span>
                  <button className="primary-button" disabled={savingIssue}>
                    {savingIssue ? "Mengirim..." : "Kirim laporan kendala"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; background-color: var(--rei-bg); color: var(--rei-text); font-family: 'DM Sans', sans-serif; font-size: 13px; transition: background-color .45s ease, color .3s ease; }
        button, input, select, textarea { font: inherit; }
        button { cursor: pointer; }
        button:disabled { cursor: not-allowed; opacity: .65; }
        a { color: var(--rei-accent); }
        :where(button, a, input, select, textarea):focus-visible { outline: 2px solid color-mix(in srgb, var(--rei-accent) 70%, transparent); outline-offset: 2px; }

        .rei-app { position: relative; isolation: isolate; min-height: 100vh; animation: page-enter .4s ease both; transition: background-color .45s ease, color .3s ease; }
        .rei-app::before { content: ''; position: fixed; inset: -22vmax; z-index: -1; pointer-events: none; opacity: var(--rei-aura-strength); background:
          radial-gradient(42vmax 42vmax at 16% 18%, var(--rei-aura-1), transparent 70%),
          radial-gradient(36vmax 36vmax at 84% 14%, var(--rei-aura-2), transparent 70%),
          radial-gradient(44vmax 44vmax at 70% 86%, var(--rei-aura-3), transparent 70%);
          animation: rei-aura 28s ease-in-out infinite alternate; will-change: transform;
        }

        .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 10; width: 248px; padding: 27px 17px 14px; display: flex; flex-direction: column; background: var(--rei-surface); border-right: 1px solid var(--rei-border); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); transition: background-color .3s ease, border-color .3s ease; }
        .brand { display: flex; align-items: center; gap: 11px; padding: 0 7px 31px; }
        .brand-mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; background: var(--rei-accent); color: var(--rei-gold); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 800; letter-spacing: -1px; box-shadow: 0 8px 18px color-mix(in srgb, var(--rei-accent) 28%, transparent); }
        .brand-name { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: .5px; color: var(--rei-heading); }
        .brand-subtitle { margin-top: 4px; color: var(--rei-soft); font-size: 9px; font-weight: 700; letter-spacing: 1.2px; }
        .workspace-label, .menu-label { padding: 0 9px; color: var(--rei-soft); font-size: 9px; font-weight: 700; letter-spacing: 1.3px; }
        .workspace { display: flex; align-items: center; gap: 10px; padding: 12px 9px; margin: 9px 0 28px; border: 1px solid var(--rei-border); border-radius: 10px; transition: border-color .2s ease, background-color .2s ease; }
        .workspace:hover { border-color: color-mix(in srgb, var(--rei-accent) 35%, var(--rei-border)); background: var(--rei-surface-2); }
        .workspace-avatar, .profile-avatar, .topbar-avatar { display: grid; place-items: center; flex-shrink: 0; font-weight: 700; }
        .workspace-avatar { width: 32px; height: 32px; border-radius: 8px; color: var(--rei-accent-soft-text); background: var(--rei-accent-soft-bg); }
        .workspace-info, .profile-info { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
        .workspace-info strong, .profile-info strong { font-size: 11px; color: var(--rei-text); }
        .workspace-info span, .profile-info span { color: var(--rei-muted); font-size: 10px; }
        .menu-label { margin-bottom: 11px; }
        .navigation { display: grid; gap: 5px; }
        .nav-item { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; min-height: 42px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; color: var(--rei-muted); text-align: left; font-size: 12px; font-weight: 500; transition: transform .18s ease, background-color .2s ease, color .2s ease; }
        .nav-item:hover { background: var(--rei-surface-hover); color: var(--rei-text); }
        .nav-item:active { transform: scale(.985); }
        .nav-item.active { color: var(--rei-accent-soft-text); background: var(--rei-accent-soft-bg); font-weight: 700; }
        .nav-item.active:before { position: absolute; left: -17px; top: 9px; bottom: 9px; width: 3px; border-radius: 0 4px 4px 0; background: var(--rei-accent); content: ''; animation: nav-indicator .3s ease both; }
        .nav-icon { display: grid; place-items: center; width: 19px; font-size: 17px; transition: transform .25s cubic-bezier(.2,.8,.2,1); }
        .nav-item:hover .nav-icon { transform: translateY(-1px) scale(1.1); }
        .nav-count { margin-left: auto; padding: 3px 7px; border-radius: 6px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 10px; }
        .sidebar-bottom { position: relative; margin-top: auto; }
        .help-card { padding: 15px; margin-bottom: 17px; border: 1px solid var(--rei-border); border-radius: 11px; background: linear-gradient(135deg, color-mix(in srgb, var(--rei-accent) 7%, var(--rei-surface)), color-mix(in srgb, var(--rei-gold) 9%, var(--rei-surface))); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); transition: transform .2s ease, border-color .2s ease; }
        .help-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--rei-gold) 45%, var(--rei-border)); }
        .help-icon { display: grid; place-items: center; width: 27px; height: 27px; margin-bottom: 10px; border-radius: 8px; background: var(--rei-surface); color: var(--rei-gold-text); font-size: 17px; box-shadow: var(--rei-shadow-soft); }
        .help-card strong { font-size: 11px; color: var(--rei-text); }
        .help-card p { margin: 6px 0 11px; color: var(--rei-muted); font-size: 10px; line-height: 1.6; }
        .help-card button, .text-button { padding: 0; border: 0; background: transparent; color: var(--rei-accent); font-size: 11px; font-weight: 700; transition: color .18s ease, transform .18s ease; }
        .help-card button:hover, .text-button:hover { color: var(--rei-accent-hover); transform: translateX(2px); }
        .profile { display: flex; align-items: center; gap: 10px; padding: 14px 2px 0; border-top: 1px solid var(--rei-border); }
        .profile-avatar, .topbar-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); }
        .profile-more { border: 0; background: transparent; color: var(--rei-soft); transition: color .18s ease, transform .18s ease; }
        .profile-more:hover { color: var(--rei-accent); transform: translateY(-1px); }
        .profile-menu { position: absolute; bottom: 54px; right: 0; left: 0; z-index: 20; padding: 12px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); box-shadow: var(--rei-shadow); animation: menu-in .18s cubic-bezier(.2,.8,.2,1) both; }
        .profile-email { overflow-wrap: anywhere; margin-bottom: 10px; color: var(--rei-muted); font-size: 10px; }
        .profile-menu button { width: 100%; padding: 9px; border: 0; border-radius: 7px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); text-align: left; font-weight: 700; transition: filter .18s ease; }
        .profile-menu button:hover { filter: brightness(1.06); }
        .main-content { min-height: 100vh; margin-left: 248px; }
        .topbar { position: sticky; top: 0; z-index: 5; height: 66px; display: flex; align-items: center; justify-content: space-between; padding: 0 36px; border-bottom: 1px solid var(--rei-border); background: var(--rei-topbar-bg); backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%); transition: background-color .3s ease, border-color .3s ease; }
        .breadcrumb { display: flex; align-items: center; gap: 12px; color: var(--rei-muted); font-size: 11px; }
        .breadcrumb-divider { color: var(--rei-soft); }
        .breadcrumb strong { color: var(--rei-text); font-weight: 700; }
        .topbar-actions { display: flex; align-items: center; gap: 18px; }
        .system-status { display: flex; align-items: center; gap: 7px; color: var(--rei-muted); font-size: 10px; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #22a06b; box-shadow: 0 0 0 3px #22a06b18; animation: pulse-dot 2.4s ease-in-out infinite; }
        .icon-button { border: 0; background: transparent; color: var(--rei-muted); font-size: 22px; transition: transform .3s cubic-bezier(.2,.8,.2,1), color .2s ease; }
        .icon-button:hover { color: var(--rei-accent); transform: rotate(90deg); }
        .topbar-avatar { border: 0; width: 31px; height: 31px; font-size: 11px; transition: transform .2s ease, box-shadow .2s ease; }
        .topbar-avatar:hover { transform: translateY(-1px); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 20%, transparent); }

        /* Pemilih tema */
        .theme-switcher { position: relative; }
        .theme-toggle { display: inline-flex; align-items: center; gap: 7px; min-height: 32px; padding: 0 10px; border: 1px solid var(--rei-border); border-radius: 8px; background: var(--rei-surface); color: var(--rei-text); font-size: 10px; font-weight: 700; transition: transform .18s ease, background-color .2s ease, border-color .2s ease, color .2s ease; }
        .theme-toggle:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--rei-accent) 45%, var(--rei-border)); color: var(--rei-accent-soft-text); }
        .theme-toggle-icon { font-size: 15px; line-height: 1; }
        .theme-caret { font-size: 12px; line-height: 1; color: var(--rei-soft); transition: transform .2s ease; }
        .theme-caret.open { transform: rotate(180deg); }
        .theme-menu { position: absolute; top: calc(100% + 10px); right: 0; z-index: 40; width: 244px; padding: 9px; border: 1px solid var(--rei-border); border-radius: 14px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); box-shadow: var(--rei-shadow); animation: menu-in .18s cubic-bezier(.2,.8,.2,1) both; }
        .theme-menu-heading { display: flex; flex-direction: column; gap: 2px; padding: 4px 8px 9px; margin-bottom: 6px; border-bottom: 1px solid var(--rei-border-soft); }
        .theme-menu-heading strong { font-size: 11px; color: var(--rei-heading); }
        .theme-menu-heading span { color: var(--rei-muted); font-size: 9px; }
        .theme-option { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px; border: 1px solid transparent; border-radius: 10px; background: transparent; color: var(--rei-text); text-align: left; animation: option-in .22s ease both; transition: background-color .18s ease, border-color .18s ease, transform .18s ease; }
        .theme-option:hover { background: var(--rei-surface-hover); transform: translateX(1px); }
        .theme-option.active { border-color: color-mix(in srgb, var(--rei-accent) 38%, transparent); background: var(--rei-accent-soft-bg); }
        .theme-swatch { width: 30px; height: 30px; flex-shrink: 0; border-radius: 9px; border: 1px solid var(--rei-border); box-shadow: inset 0 0 0 1px rgba(255,255,255,.25); }
        .theme-swatch-light { background: linear-gradient(140deg, #f7f6fd 0 38%, #5436aa 38% 72%, #d4af37 72%); }
        .theme-swatch-dark { background: linear-gradient(140deg, #0e0626 0 38%, #5436aa 38% 72%, #e1c162 72%); }
        .theme-swatch-glass { background: linear-gradient(140deg, rgba(255,255,255,.55) 0 32%, rgba(114,85,215,.8) 32% 68%, rgba(212,175,55,.9) 68%); }
        .theme-swatch-gold { background: linear-gradient(140deg, #faf6ec 0 38%, #d4af37 38% 72%, #5436aa 72%); }
        .theme-option-text { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
        .theme-option-text strong { font-size: 11px; color: var(--rei-text); }
        .theme-option-text small { color: var(--rei-muted); font-size: 9px; }
        .theme-check { width: 18px; flex-shrink: 0; color: var(--rei-accent); font-weight: 800; text-align: center; }

        .page-content { max-width: 1500px; padding: 32px 36px 20px; margin: 0 auto; }
        .welcome-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 26px; animation: rei-fade-up .4s ease both; }
        .eyebrow { margin-bottom: 8px; color: var(--rei-gold-text); font-size: 9px; font-weight: 700; letter-spacing: 1.6px; }
        h1 { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 27px; font-weight: 800; letter-spacing: -1px; color: var(--rei-heading); }
        .welcome-row p, .panel-heading p { margin: 7px 0 0; color: var(--rei-muted); font-size: 11px; line-height: 1.6; }
        .role-label, .live-pill { display: inline-block; margin-top: 9px; padding: 4px 7px; border-radius: 5px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 9px; font-weight: 700; }
        .live-pill { margin-top: 0; background: var(--rei-success-soft); color: var(--rei-success-text); letter-spacing: .4px; }
        .welcome-actions, .task-tools { display: flex; align-items: center; gap: 9px; }
        .primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 36px; padding: 0 14px; border: 1px solid transparent; border-radius: 8px; font-size: 11px; font-weight: 700; white-space: nowrap; transition: transform .18s ease, background-color .2s ease, color .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .primary-button { position: relative; overflow: hidden; background: var(--rei-accent); color: var(--rei-accent-contrast); box-shadow: 0 4px 12px color-mix(in srgb, var(--rei-accent) 30%, transparent); }
        .primary-button::after { content: ''; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.34) 50%, transparent 70%); transform: translateX(-130%); transition: transform .6s ease; }
        .primary-button:hover { background: var(--rei-accent-hover); box-shadow: 0 8px 20px color-mix(in srgb, var(--rei-accent) 38%, transparent); }
        .primary-button:hover::after { transform: translateX(130%); }
        .primary-button:active, .secondary-button:active { transform: translateY(0) scale(.985); }
        .secondary-button { border-color: var(--rei-border-strong); background: var(--rei-surface); color: var(--rei-muted); }
        .secondary-button:hover { background: var(--rei-surface-hover); color: var(--rei-text); }
        .message { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; margin-bottom: 15px; border: 1px solid; border-radius: 9px; font-size: 11px; animation: rei-fade-up .28s ease both; }
        .message button { border: 0; background: transparent; font-size: 18px; color: inherit; }
        .error-message { border-color: var(--rei-danger-border); background: var(--rei-danger-bg); color: var(--rei-danger-fg); }
        .success-message { border-color: var(--rei-success-border); background: var(--rei-success-bg); color: var(--rei-success-fg); }
        .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 17px; margin-bottom: 21px; }
        .stat-card, .panel { position: relative; min-width: 0; border: 1px solid var(--rei-border); border-radius: 12px; background: var(--rei-surface); box-shadow: var(--rei-shadow-soft); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); transition: transform .2s ease, box-shadow .25s ease, background-color .3s ease, border-color .3s ease; }
        .stat-card::after, .panel::after, .kanban-card::after { content: ''; position: absolute; inset: 0; z-index: 0; border-radius: inherit; pointer-events: none; background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), var(--rei-sheen), transparent 62%); opacity: 0; transition: opacity .3s ease; }
        .stat-card:hover::after, .panel:hover::after, .kanban-card:hover::after { opacity: 1; }
        .stat-card > *, .panel > *, .kanban-card > * { position: relative; z-index: 1; }
        .stat-card { padding: 18px 19px 16px; animation: card-enter .45s cubic-bezier(.2,.8,.2,1) both; }
        .stat-card:nth-child(2) { animation-delay: .05s; }
        .stat-card:nth-child(3) { animation-delay: .1s; }
        .stat-card:nth-child(4) { animation-delay: .15s; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: var(--rei-shadow-hover); border-color: color-mix(in srgb, var(--rei-accent) 26%, var(--rei-border)); }
        .stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .stat-label { color: var(--rei-muted); font-size: 11px; font-weight: 500; }
        .stat-icon { display: grid; place-items: center; width: 33px; height: 33px; border-radius: 9px; font-size: 17px; transition: transform .25s cubic-bezier(.2,.8,.2,1); }
        .stat-card:hover .stat-icon { transform: translateY(-2px) rotate(-6deg) scale(1.06); }
        .stat-value { margin-top: 13px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 29px; font-weight: 800; letter-spacing: -1px; color: var(--rei-heading); font-variant-numeric: tabular-nums; }
        .stat-note { display: flex; align-items: center; gap: 6px; margin-top: 7px; color: var(--rei-soft); font-size: 10px; }
        .stat-note span { font-size: 7px; }
        .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 21px; }
        .overview-grid > * { animation: card-enter .5s cubic-bezier(.2,.8,.2,1) both; animation-delay: .08s; }
        .panel { padding: 20px; }
        .panel:hover { border-color: color-mix(in srgb, var(--rei-accent) 20%, var(--rei-border)); }
        .panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .panel-heading h2 { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: -.2px; color: var(--rei-heading); }
        .panel-heading p { margin-top: 5px; font-size: 10px; }
        .progress-summary { display: flex; align-items: center; justify-content: center; gap: 42px; min-height: 180px; }
        .progress-ring { display: grid; place-items: center; width: 132px; height: 132px; flex-shrink: 0; border-radius: 50%; box-shadow: 0 10px 30px color-mix(in srgb, var(--rei-accent) 16%, transparent); }
        .progress-ring-inner { display: flex; align-items: center; justify-content: center; flex-direction: column; width: 99px; height: 99px; border-radius: 50%; background: var(--rei-surface); box-shadow: inset 0 0 0 1px var(--rei-border-soft); }
        .progress-ring-inner strong { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 800; color: var(--rei-heading); }
        .progress-ring-inner span { margin-top: 3px; color: var(--rei-muted); font-size: 10px; }
        .progress-legend { display: grid; gap: 14px; min-width: 140px; }
        .progress-legend div { display: grid; grid-template-columns: 9px 1fr auto; align-items: center; gap: 9px; color: var(--rei-muted); font-size: 10px; }
        .progress-legend strong { color: var(--rei-text); font-size: 11px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 3px; }
        .progress-footer { display: flex; justify-content: space-between; gap: 10px; margin: 2px 0 10px; color: var(--rei-muted); font-size: 10px; }
        .progress-footer strong { color: var(--rei-text); }
        .progress-track, .mini-track { overflow: hidden; border-radius: 20px; background: var(--rei-chart-track); }
        .progress-track { height: 6px; }
        .progress-fill { height: 100%; border-radius: 20px; background: linear-gradient(90deg, var(--rei-accent), color-mix(in srgb, var(--rei-accent) 50%, var(--rei-gold))); transition: width .6s cubic-bezier(.2,.8,.2,1); box-shadow: 0 0 12px color-mix(in srgb, var(--rei-accent) 35%, transparent); }
        .mini-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 19px; padding-top: 15px; border-top: 1px solid var(--rei-border-soft); }
        .mini-stats div { display: flex; flex-direction: column; gap: 6px; }
        .mini-stats span { color: var(--rei-soft); font-size: 10px; }
        .mini-stats strong { font-size: 16px; color: var(--rei-text); }
        .overdue-number { color: var(--rei-danger-text); }
        .project-list { display: grid; gap: 19px; margin-top: 22px; }
        .project-row { display: flex; align-items: center; gap: 12px; }
        .project-symbol { display: grid; place-items: center; width: 37px; height: 37px; flex-shrink: 0; border-radius: 9px; font-size: 10px; font-weight: 800; transition: transform .2s ease; }
        .project-row:hover .project-symbol { transform: scale(1.06) rotate(-3deg); }
        .project-color-0 { background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); }
        .project-color-1 { background: var(--rei-gold-soft); color: var(--rei-gold-text); }
        .project-color-2 { background: var(--rei-info-soft); color: var(--rei-info-text); }
        .project-details { flex: 1; min-width: 0; }
        .project-details strong { font-size: 11px; color: var(--rei-text); }
        .project-details span { display: block; margin-top: 4px; color: var(--rei-soft); font-size: 9px; }
        .mini-track { height: 4px; margin-top: 9px; }
        .mini-track div { height: 100%; border-radius: 20px; transition: width .6s cubic-bezier(.2,.8,.2,1); }
        .project-percent { width: 35px; text-align: right; font-size: 10px; color: var(--rei-text); }
        .empty-projects { padding: 28px 8px; color: var(--rei-soft); text-align: center; font-size: 11px; line-height: 1.6; }
        .tasks-panel { padding: 20px 0 0; }
        .tasks-heading { align-items: center; padding: 0 20px 19px; }
        .task-tools { gap: 8px; }
        .search-box { display: flex; align-items: center; gap: 8px; height: 35px; padding: 0 10px; border: 1px solid var(--rei-border-strong); border-radius: 8px; color: var(--rei-soft); transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease; }
        .search-box:focus-within { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
        .search-box span { font-size: 18px; }
        .search-box input { width: 120px; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--rei-text); font-size: 10px; }
        .search-box input::placeholder { color: var(--rei-soft); }
        .filter-select { height: 35px; max-width: 145px; padding: 0 8px; border: 1px solid var(--rei-border-strong); border-radius: 8px; background: var(--rei-surface); color: var(--rei-muted); font-size: 10px; transition: border-color .2s ease, background-color .2s ease, color .2s ease; }
        .filter-select:hover { border-color: color-mix(in srgb, var(--rei-accent) 40%, var(--rei-border)); color: var(--rei-text); }
        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        thead { background: var(--rei-surface-2); }
        th { padding: 12px 14px; color: var(--rei-soft); font-size: 9px; font-weight: 700; letter-spacing: .5px; white-space: nowrap; }
        th:first-child, td:first-child { padding-left: 20px; }
        td { padding: 14px; border-top: 1px solid var(--rei-border-soft); color: var(--rei-muted); font-size: 10px; white-space: nowrap; }
        tbody tr { transition: background-color .18s ease; }
        tbody tr:hover { background: var(--rei-surface-2); }
        .task-name { display: flex; align-items: center; gap: 9px; color: var(--rei-text); font-weight: 600; }
        .task-title { max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
        .task-indicator { width: 9px; height: 9px; flex-shrink: 0; border: 2px solid var(--rei-border-strong); border-radius: 50%; }
        .indicator-done { border-color: var(--rei-success-text); background: var(--rei-success-text); }
        .project-tag { display: inline-flex; align-items: center; gap: 6px; }
        .priority { display: inline-block; padding: 5px 8px; border-radius: 5px; font-size: 9px; font-weight: 700; }
        .priority-low { background: var(--rei-success-soft); color: var(--rei-success-text); }
        .priority-medium { background: var(--rei-warning-soft); color: var(--rei-warning-text); }
        .priority-high { background: var(--rei-orange-soft); color: var(--rei-orange-text); }
        .priority-urgent { background: var(--rei-danger-soft); color: var(--rei-danger-text); }
        .status-select { max-width: 130px; padding: 6px 7px; border: 0; border-radius: 6px; outline: none; font-size: 9px; font-weight: 600; cursor: pointer; }
        .status-todo { background: var(--rei-neutral-soft); color: var(--rei-neutral-text); }
        .status-in_progress { background: var(--rei-info-soft); color: var(--rei-info-text); }
        .status-review { background: var(--rei-warning-soft); color: var(--rei-warning-text); }
        .status-done { background: var(--rei-success-soft); color: var(--rei-success-text); }
        .due-date { color: var(--rei-muted); }
        .empty-state { padding: 30px; text-align: center; color: var(--rei-soft); }
        .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; border-top: 1px solid var(--rei-border-soft); color: var(--rei-soft); font-size: 10px; }
        .page-footer { display: flex; justify-content: space-between; gap: 12px; padding: 23px 2px 0; color: var(--rei-soft); font-size: 10px; }
        .new-task-panel { padding: 20px; margin-bottom: 20px; border: 1px solid var(--rei-border); border-radius: 12px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); box-shadow: var(--rei-shadow-soft); animation: card-enter .3s ease both; }
        .form-heading strong { font-size: 13px; color: var(--rei-heading); }
        .form-heading p { margin: 5px 0 17px; color: var(--rei-muted); font-size: 10px; }
        .form-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px; }
        .form-grid label { display: flex; flex-direction: column; gap: 7px; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
        .form-grid input, .form-grid select, .form-grid textarea { width: 100%; min-width: 0; padding: 10px; border: 1px solid var(--rei-border-strong); border-radius: 8px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 11px; transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease; }
        .form-grid input:focus, .form-grid select:focus, .form-grid textarea:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
        .form-grid input::placeholder, .form-grid textarea::placeholder, .task-link-form input::placeholder, .task-issue-form textarea::placeholder { color: var(--rei-soft); }
        .description-field { grid-column: 1 / -1; }
        .form-grid textarea { resize: vertical; }
        .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
        .kanban-grid { display: grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap: 12px; overflow-x: auto; padding: 0 18px 18px; }
        .kanban-column { min-height: 180px; padding: 10px; border: 1px solid var(--rei-border-soft); border-radius: 9px; background: var(--rei-surface-3); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); transition: background-color .3s ease, border-color .2s ease; }
        .kanban-title { display: flex; align-items: center; justify-content: space-between; padding: 7px 4px 12px; font-size: 10px; font-weight: 700; }
        .kanban-title strong { color: var(--rei-muted); }
        .kanban-card { position: relative; display: flex; flex-direction: column; gap: 8px; padding: 12px; margin-bottom: 9px; border: 1px solid var(--rei-border); border-radius: 8px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); animation: card-enter .28s ease both; transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background-color .3s ease; }
        .kanban-card:nth-child(2) { animation-delay: .04s; }
        .kanban-card:nth-child(3) { animation-delay: .08s; }
        .kanban-card:nth-child(4) { animation-delay: .12s; }
        .kanban-card:nth-child(5) { animation-delay: .16s; }
        .kanban-card:hover { transform: translateY(-2px); box-shadow: var(--rei-shadow-hover); border-color: color-mix(in srgb, var(--rei-accent) 30%, var(--rei-border)); }
        .kanban-card strong { font-size: 11px; line-height: 1.5; color: var(--rei-text); }
        .kanban-card span, .kanban-card small { color: var(--rei-soft); font-size: 10px; }

        /* Tambahan untuk halaman baru (memakai gaya yang sama dengan komponen lama) */
        .kanban-card[draggable="true"] { cursor: grab; }
        .kanban-card .status-select { align-self: flex-start; }
        .kanban-card-details { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; }
        .kanban-card-details:focus-visible { outline: 2px solid var(--rei-accent); outline-offset: 4px; border-radius: 4px; }
        .kanban-card-details .kanban-link-count { color: var(--rei-accent); font-weight: 700; }
        .kanban-column.drag-over { outline: 2px dashed color-mix(in srgb, var(--rei-accent) 60%, transparent); outline-offset: -2px; background: color-mix(in srgb, var(--rei-accent) 7%, var(--rei-surface-3)); }
        .project-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 21px; }
        .project-description { margin: 14px 0 0; color: var(--rei-muted); font-size: 10px; line-height: 1.6; }
        .project-card-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--rei-border-soft); }
        .danger-text { color: var(--rei-danger-text) !important; }
        .member-avatar { display: grid; place-items: center; width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 9px; font-weight: 700; }
        .report-list { display: grid; gap: 16px; margin-top: 20px; }
        .report-row-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 7px; color: var(--rei-muted); font-size: 10px; }
        .report-row-top strong { color: var(--rei-text); font-size: 11px; }

        .task-modal-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 16px; background: var(--rei-overlay); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); animation: fade-in .18s ease both; }
        .task-modal { width: min(600px, 100%); max-height: min(88vh, 820px); overflow-y: auto; padding: 24px; border: 1px solid var(--rei-border); border-radius: 16px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); color: var(--rei-text); box-shadow: var(--rei-shadow); animation: modal-enter .22s cubic-bezier(.2,.8,.2,1) both; }
        .task-modal-heading, .task-links-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
        .task-modal-eyebrow { color: var(--rei-gold-text); font-size: 9px; font-weight: 800; letter-spacing: 1.4px; }
        .task-modal-heading h2 { margin: 7px 0 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; line-height: 1.4; color: var(--rei-heading); }
        .task-modal-close { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border: 1px solid var(--rei-border); border-radius: 9px; background: transparent; color: var(--rei-muted); font-size: 21px; transition: transform .2s ease, color .2s ease, border-color .2s ease; }
        .task-modal-close:hover { transform: rotate(90deg); color: var(--rei-accent); border-color: color-mix(in srgb, var(--rei-accent) 40%, var(--rei-border)); }
        .task-modal-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 16px 0; border-bottom: 1px solid var(--rei-border); color: var(--rei-muted); font-size: 10px; }
        .task-modal-meta .status-select { max-width: none; }
        .task-modal-details { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 16px 0; }
        .task-modal-details div { display: flex; flex-direction: column; gap: 6px; }
        .task-modal-details span { color: var(--rei-muted); font-size: 10px; }
        .task-modal-details strong { font-size: 11px; color: var(--rei-text); }
        .task-modal-description { padding-bottom: 17px; border-bottom: 1px solid var(--rei-border); }
        .task-modal h3 { margin: 0; font-size: 11px; font-weight: 800; color: var(--rei-heading); }
        .task-modal-description p { margin: 7px 0 0; color: var(--rei-muted); font-size: 11px; line-height: 1.7; white-space: pre-wrap; }
        .task-links-section { padding-top: 17px; }
        .task-links-heading { align-items: center; }
        .task-links-heading p { margin: 5px 0 0; color: var(--rei-muted); font-size: 10px; line-height: 1.5; }
        .task-links-heading > span { flex-shrink: 0; color: var(--rei-muted); font-size: 10px; }
        .task-links-list { display: grid; gap: 8px; padding: 0; margin: 13px 0; list-style: none; }
        .task-links-list li { display: flex; align-items: center; gap: 10px; padding: 10px 11px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface-2); transition: border-color .2s ease, transform .2s ease; }
        .task-links-list li:hover { transform: translateX(2px); border-color: color-mix(in srgb, var(--rei-accent) 32%, var(--rei-border)); }
        .task-links-list a { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; color: var(--rei-accent); text-decoration: none; }
        .task-links-list a span { font-size: 10px; font-weight: 700; }
        .task-links-list a small { overflow: hidden; color: var(--rei-muted); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
        .task-links-list li > button { padding: 5px 7px; border: 0; border-radius: 6px; background: var(--rei-danger-soft); color: var(--rei-danger-text); font-size: 9px; font-weight: 700; }
        .task-links-empty { margin: 13px 0; color: var(--rei-muted); font-size: 10px; }
        .task-link-form { display: grid; grid-template-columns: 1fr 1.5fr auto; align-items: end; gap: 8px; padding: 12px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface-2); }
        .task-link-form label { display: flex; flex-direction: column; gap: 6px; min-width: 0; color: var(--rei-muted); font-size: 9px; font-weight: 700; }
        .task-link-form input { width: 100%; min-width: 0; height: 34px; padding: 0 9px; border: 1px solid var(--rei-border-strong); border-radius: 7px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; transition: border-color .2s ease, box-shadow .2s ease; }
        .task-link-form input:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
        .task-link-form .secondary-button { min-height: 34px; padding: 0 9px; font-size: 9px; }
        .task-link-error, .task-link-notice { margin: 9px 0 0; font-size: 10px; }
        .task-link-error { color: var(--rei-danger-text); }
        .task-link-notice { color: var(--rei-success-text); }
        .task-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
        .task-issues-section { padding-top: 18px; margin-top: 18px; border-top: 1px solid var(--rei-border); }
        .task-issues-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .task-issues-heading span { color: var(--rei-muted); font-size: 10px; }
        .task-issue-list { display: grid; gap: 9px; max-height: 260px; overflow-y: auto; padding: 0; margin: 13px 0; list-style: none; }
        .task-issue-list li { padding: 12px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface-2); }
        .task-issue-meta { display: flex; justify-content: space-between; gap: 10px; color: var(--rei-text); font-size: 10px; }
        .task-issue-meta time { color: var(--rei-muted); font-size: 9px; }
        .task-issue-list li p { margin: 8px 0; color: var(--rei-text); font-size: 11px; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
        .task-issue-evidence { color: var(--rei-accent); font-size: 10px; font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
        .task-issue-evidence:hover { text-decoration: underline; }
        .task-issue-empty { margin: 13px 0; color: var(--rei-muted); font-size: 10px; }
        .task-issue-form { display: grid; gap: 11px; padding: 13px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface-2); }
        .task-issue-form label { display: flex; flex-direction: column; gap: 7px; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
        .task-issue-form label span, .task-issue-form label small { color: var(--rei-soft); font-size: 9px; font-weight: 400; }
        .task-issue-form textarea, .task-issue-form input[type="file"] { width: 100%; padding: 9px; border: 1px solid var(--rei-border-strong); border-radius: 7px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; transition: border-color .2s ease, box-shadow .2s ease; }
        .task-issue-form textarea:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
        .task-issue-form textarea { resize: vertical; line-height: 1.5; }
        .task-issue-selected-file { margin: -4px 0 0; color: var(--rei-muted); font-size: 9px; overflow-wrap: anywhere; }
        .task-issue-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .task-issue-actions > span { color: var(--rei-soft); font-size: 9px; }

        @keyframes page-enter { from { opacity: 0; } to { opacity: 1; } }
        @keyframes card-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-enter { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes menu-in { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes option-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes nav-indicator { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
        @keyframes pulse-dot { 0%, 100% { box-shadow: 0 0 0 3px #22a06b18; } 50% { box-shadow: 0 0 0 6px #22a06b10; } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }

        @media (min-width: 1600px) { .page-content { padding-right: 48px; padding-left: 48px; } }
        @media (max-width: 1150px) {
          .sidebar { width: 215px; }
          .main-content { margin-left: 215px; }
          .topbar { padding: 0 24px; }
          .page-content { padding: 27px 24px 18px; }
          .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .progress-summary { gap: 22px; }
          .progress-ring { width: 110px; height: 110px; }
          .progress-ring-inner { width: 83px; height: 83px; }
          .progress-ring-inner strong { font-size: 22px; }
          .form-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 800px) {
          .sidebar { position: static; width: 100%; height: auto; padding: 14px 16px; border-right: 0; border-bottom: 1px solid var(--rei-border); }
          .brand { padding-bottom: 12px; }
          .workspace-label, .workspace, .menu-label, .sidebar-bottom { display: none; }
          .navigation { display: flex; overflow-x: auto; gap: 5px; padding: 0 0 2px; }
          .nav-item { width: auto; min-width: max-content; min-height: 36px; padding: 0 11px; }
          .nav-item.active:before { display: none; }
          .main-content { margin-left: 0; }
          .topbar { height: 54px; padding: 0 17px; }
          .page-content { padding: 24px 16px 16px; }
          .welcome-row { align-items: flex-start; flex-direction: column; }
          .welcome-actions { width: 100%; flex-wrap: wrap; }
          .stats-grid { gap: 10px; }
          .stat-card { padding: 14px; }
          .stat-value { font-size: 25px; }
          .overview-grid { grid-template-columns: 1fr; }
          .project-grid { grid-template-columns: 1fr; }
          .tasks-heading { align-items: flex-start; flex-direction: column; }
          .task-tools { width: 100%; }
          .search-box { flex: 1; }
          .search-box input { width: 100%; }
          .form-grid { grid-template-columns: 1fr; }
          .description-field { grid-column: auto; }
          .page-footer { flex-direction: column; }
          .task-link-form { grid-template-columns: 1fr; }
          .task-issue-actions { align-items: flex-start; flex-direction: column; }
          .task-modal { padding: 19px; }
          .theme-toggle span:nth-child(2) { display: none; }
        }
        @media (max-width: 430px) {
          .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .stat-label { font-size: 10px; }
          .stat-note { font-size: 9px; }
          .system-status { display: none; }
          h1 { font-size: 24px; }
          .progress-summary { gap: 17px; }
          .progress-ring { width: 100px; height: 100px; }
          .progress-ring-inner { width: 76px; height: 76px; }
          .progress-legend { min-width: 120px; }
          .progress-legend div { gap: 6px; }
          .filter-select { max-width: 125px; }
          .theme-menu { width: min(244px, calc(100vw - 34px)); }
        }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon,
  color,
}: {
  label: string;
  value: number;
  note: string;
  icon: string;
  color: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span
          className="stat-icon"
          style={{
            color,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
          }}
        >
          {icon}
        </span>
      </div>
      <div className="stat-value">
        <AnimatedNumber value={value} />
      </div>
      <div className="stat-note">
        <span style={{ color }}>●</span> {note}
      </div>
    </article>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = previous.current;
    previous.current = value;

    if (reduced || from === value) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display.toLocaleString("id-ID")}</>;
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div>
      <span className="legend-dot" style={{ background: color }} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReportBar({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="report-row-top">
        <span>{label}</span>
        <strong>{suffix ?? value}</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}