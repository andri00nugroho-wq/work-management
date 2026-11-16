"use client";

import { useCallback, useMemo, useState } from "react";
import FaviconBadge from "@/components/favicon-badge";
import ChatView from "./chat/chat-view";
import { ADMIN_ROLES, MANAGE_ROLES, TASK_MENUS } from "./constants";
import { dashboardStyles } from "./dashboard.styles";
import MemberForm from "./forms/member-form";
import ProjectForm from "./forms/project-form";
import TaskForm from "./forms/task-form";
import { useCardSpotlight } from "./hooks/use-card-spotlight";
import { useChat } from "./hooks/use-chat";
import { useWorkspace } from "./hooks/use-workspace";
import PageHeader from "./layout/page-header";
import Sidebar from "./layout/sidebar";
import Topbar from "./layout/topbar";
import { exportMenuCsv } from "./lib/export";
import { errorText } from "./lib/format";
import { buildReport, matchesQuery } from "./lib/tasks";
import TaskDetailModal from "./tasks/task-detail-modal";
import TasksPanel from "./tasks/tasks-panel";
import type { DashboardUser, MenuName, Task } from "./types";
import { Alert } from "./ui";
import OverviewView from "./views/overview-view";
import ProjectsView from "./views/projects-view";
import ReportsView from "./views/reports-view";
import TeamView from "./views/team-view";

type OpenForm = "task" | "project" | "member" | null;

export default function DashboardClient({ user }: { user: DashboardUser }) {
  const [activeMenu, setActiveMenu] = useState<MenuName>("Dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const ws = useWorkspace(activeMenu);
  const chat = useChat(user.id, activeMenu);
  useCardSpotlight();

  const canManageTasks = MANAGE_ROLES.includes(user.role);
  const canAdmin = ADMIN_ROLES.includes(user.role);
  const isTaskMenu = TASK_MENUS.includes(activeMenu);

  /* ---------- Turunan data tugas ---------- */

  const isMine = useCallback(
    (task: Task) =>
      (task.assignee?.id && task.assignee.id === user.id) ||
      task.assignee?.name === user.name ||
      Boolean(task.tags?.some((tag) => tag.user.id === user.id)),
    [user.id, user.name]
  );

  const dashboardTasks = useMemo(
    () => ws.data.recentTasks ?? ws.data.tasks ?? [],
    [ws.data]
  );

  // Dashboard hanya menampilkan tugas terbaru; menu lain menggabungkan semua tugas.
  const baseTasks = useMemo(() => {
    if (activeMenu === "Dashboard") return dashboardTasks;
    const merged = new Map<string, Task>();
    dashboardTasks.forEach((task) => merged.set(task.id, task));
    ws.allTasks.forEach((task) => merged.set(task.id, task));
    return Array.from(merged.values());
  }, [activeMenu, dashboardTasks, ws.allTasks]);

  const myTasks = useMemo(
    () => (ws.allTasks.length ? ws.allTasks : dashboardTasks).filter(isMine),
    [ws.allTasks, dashboardTasks, isMine]
  );
  const myOpenTasksCount = myTasks.filter((task) => task.status !== "DONE").length;

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return baseTasks.filter(
      (task) =>
        matchesQuery(task, query) &&
        (statusFilter === "ALL" || task.status === statusFilter) &&
        (activeMenu !== "Tugas Saya" || isMine(task))
    );
  }, [baseTasks, search, statusFilter, activeMenu, isMine]);

  const report = useMemo(() => buildReport(ws.allTasks), [ws.allTasks]);

  const canEditSelectedTask = Boolean(
    selectedTask &&
      (canManageTasks ||
        selectedTask.assignee?.id === user.id ||
        selectedTask.creator?.id === user.id)
  );

  /* ---------- Navigasi & aksi ---------- */

  function switchMenu(menu: MenuName) {
    ws.resetForMenu(menu);
    setActiveMenu(menu);
    setSearch("");
    setStatusFilter("ALL");
    setOpenForm(null);
  }

  function toggleForm(form: Exclude<OpenForm, null>) {
    ws.setError("");
    setOpenForm((current) => (current === form ? null : form));
    // Isi pilihan "Penanggung jawab" dan "Proyek" saat form tugas dibuka.
    if (form === "task" && openForm !== "task") {
      Promise.all([ws.ensureMembers(), ws.ensureProjects()]).catch(() =>
        ws.setError("Gagal memuat daftar anggota atau proyek untuk form.")
      );
    }
  }

  const primaryAction = (() => {
    if (isTaskMenu && canManageTasks) {
      return { label: "＋ Buat Tugas", onClick: () => toggleForm("task") };
    }
    if (activeMenu === "Proyek" && canManageTasks) {
      return { label: "＋ Buat Proyek", onClick: () => toggleForm("project") };
    }
    if (activeMenu === "Tim" && canAdmin) {
      return { label: "＋ Tambah Anggota", onClick: () => toggleForm("member") };
    }
    return null;
  })();

  /** Tutup form hanya jika penyimpanan berhasil. */
  function submitAndClose<T>(action: (input: T) => Promise<boolean>) {
    return async (input: T) => {
      const ok = await action(input);
      if (ok) setOpenForm(null);
      return ok;
    };
  }

  function openTaskDetails(task: Task) {
    setSelectedTask(task);
    ws.ensureMembers().catch(() => {});
  }

  function patchTask(taskId: string, patch: Partial<Task>) {
    ws.patchTask(taskId, patch);
    setSelectedTask((current) =>
      current && current.id === taskId ? { ...current, ...patch } : current
    );
  }

  async function logout() {
    ws.setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout gagal. Silakan coba kembali.");
      window.location.href = "/login";
    } catch (err) {
      ws.setError(errorText(err, "Logout gagal."));
    }
  }

  const refresh = () => void ws.refresh();

  /* ---------- Tampilan ---------- */

  return (
    <div className="rei-app">
      <FaviconBadge count={chat.unreadTotal + myOpenTasksCount} />

      <Sidebar
        user={user}
        activeMenu={activeMenu}
        myTasksCount={myTasks.length}
        chatUnread={chat.unreadTotal}
        showProfileMenu={showProfileMenu}
        onToggleProfileMenu={() => setShowProfileMenu((open) => !open)}
        onSelectMenu={switchMenu}
        onHelp={() => ws.setNotice("Hubungi administrator jika Anda memerlukan bantuan.")}
        onLogout={logout}
      />

      <main className="main-content">
        <Topbar
          user={user}
          activeMenu={activeMenu}
          onRefresh={refresh}
          onToggleProfileMenu={() => setShowProfileMenu((open) => !open)}
        />

        <div className="page-content">
          <PageHeader
            user={user}
            activeMenu={activeMenu}
            primaryAction={primaryAction}
            onExport={
              activeMenu === "Chat"
                ? null
                : () =>
                    exportMenuCsv(activeMenu, {
                      projects: ws.projects,
                      members: ws.members,
                      allTasks: ws.allTasks,
                      visibleTasks,
                    })
            }
          />

          <Alert kind="error" message={ws.error} onClose={() => ws.setError("")} />
          <Alert kind="success" message={ws.notice} onClose={() => ws.setNotice("")} />

          {openForm === "task" && (
            <TaskForm
              user={user}
              members={ws.members}
              projects={ws.projects}
              saving={ws.saving}
              onSubmit={submitAndClose(ws.createTask)}
              onInvalid={ws.setError}
              onCancel={() => setOpenForm(null)}
            />
          )}
          {openForm === "project" && (
            <ProjectForm
              saving={ws.saving}
              onSubmit={submitAndClose(ws.createProject)}
              onInvalid={ws.setError}
              onCancel={() => setOpenForm(null)}
            />
          )}
          {openForm === "member" && (
            <MemberForm
              currentRole={user.role}
              saving={ws.saving}
              onSubmit={submitAndClose(ws.createMember)}
              onInvalid={ws.setError}
              onCancel={() => setOpenForm(null)}
            />
          )}

          {activeMenu === "Dashboard" && (
            <OverviewView
              data={ws.data}
              loading={ws.loading}
              onOpenProjects={() => switchMenu("Proyek")}
            />
          )}

          {activeMenu === "Proyek" && (
            <ProjectsView
              projects={ws.projects}
              allTasks={ws.allTasks}
              loading={ws.loading}
              canDelete={canAdmin}
              onOpenBoard={(project) => {
                switchMenu("Board Kanban");
                setSearch(project.name);
              }}
              onDelete={(project) => void ws.deleteProject(project)}
            />
          )}

          {activeMenu === "Tim" && (
            <TeamView
              user={user}
              members={ws.members}
              allTasks={ws.allTasks}
              loading={ws.loading}
              canAdmin={canAdmin}
              onRoleChange={(member, role) => void ws.updateMemberRole(member, role)}
              onRefresh={refresh}
            />
          )}

          {activeMenu === "Laporan" && (
            <ReportsView report={report} loading={ws.loading} onRefresh={refresh} />
          )}

          {activeMenu === "Chat" && (
            <ChatView
              chat={chat}
              user={user}
              members={ws.members}
              ensureMembers={ws.ensureMembers}
            />
          )}

          {isTaskMenu && (
            <TasksPanel
              menu={activeMenu}
              tasks={visibleTasks}
              loading={ws.loading}
              userId={user.id}
              search={search}
              statusFilter={statusFilter}
              onSearchChange={setSearch}
              onStatusFilterChange={setStatusFilter}
              onRefresh={refresh}
              onOpenTask={openTaskDetails}
              onStatusChange={(task, status) => void ws.updateTaskStatus(task, status)}
            />
          )}

          <footer className="page-footer">
            <span>© 2026 REI Work Management</span>
            <span>Raja Emas Indonesia · Sistem manajemen pekerjaan</span>
          </footer>
        </div>
      </main>

      {selectedTask && (
        <TaskDetailModal
          key={selectedTask.id}
          task={selectedTask}
          userId={user.id}
          members={ws.members}
          canEdit={canEditSelectedTask}
          onPatch={patchTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      <style jsx>{dashboardStyles}</style>
    </div>
  );
}
