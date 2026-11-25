"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FaviconBadge from "@/components/favicon-badge";
import ChatView from "./chat/chat-view";
import { ADMIN_ROLES, MANAGE_ROLES, TASK_MENUS } from "./constants";
import { dashboardStyles } from "./dashboard.styles";
import { featureStyles } from "./features.styles";
import ChangePasswordModal from "./forms/change-password-modal";
import IntegrationsModal from "./forms/integrations-modal";
import MemberForm from "./forms/member-form";
import ProjectForm from "./forms/project-form";
import TaskForm from "./forms/task-form";
import TemplateModal from "./forms/template-modal";
import { useCardSpotlight } from "./hooks/use-card-spotlight";
import { useChat } from "./hooks/use-chat";
import { useNotifications } from "./hooks/use-notifications";
import { useWorkspace } from "./hooks/use-workspace";
import PageHeader from "./layout/page-header";
import Sidebar from "./layout/sidebar";
import Topbar from "./layout/topbar";
import { exportMenuCsv } from "./lib/export";
import { errorText } from "./lib/format";
import { request } from "./lib/http";
import { EMPTY_FILTERS, buildReport, matchesFilters } from "./lib/tasks";
import TaskDetailModal from "./tasks/task-detail-modal";
import TasksPanel from "./tasks/tasks-panel";
import type { DashboardUser, MenuName, Task, TaskFilters } from "./types";
import { Alert } from "./ui";
import OverviewView from "./views/overview-view";
import ProjectsView from "./views/projects-view";
import ReportsView from "./views/reports-view";
import SettingsView from "./views/settings-view";
import AutomationPanel from "./views/automation-panel";
import IntakePanel from "./views/intake-panel";
import WebhooksPanel from "./views/webhooks-panel";
import WipSettingsPanel from "./views/wip-settings-panel";
import TeamView from "./views/team-view";

type OpenForm = "task" | "project" | "member" | null;

export default function DashboardClient({ user }: { user: DashboardUser }) {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuName>("Dashboard");
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const ws = useWorkspace(activeMenu);
  const chat = useChat(user.id, activeMenu);
  const notifications = useNotifications();
  useCardSpotlight();

  const canManageTasks = MANAGE_ROLES.includes(user.role);
  const canAdmin = ADMIN_ROLES.includes(user.role);
  const isGuest = user.role === "GUEST";
  const isTaskMenu = TASK_MENUS.includes(activeMenu);

  /* ---------- Turunan data tugas ---------- */

  const isMine = useCallback(
    (task: Task) =>
      (task.assignee?.id && task.assignee.id === user.id) ||
      task.assignee?.name === user.name ||
      Boolean(task.assignments?.some((assignment) => assignment.user.id === user.id)) ||
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

  const visibleTasks = useMemo(
    () =>
      baseTasks.filter(
        (task) => matchesFilters(task, filters) && (activeMenu !== "Tugas Saya" || isMine(task))
      ),
    [baseTasks, filters, activeMenu, isMine]
  );

  // Daftar anggota dibutuhkan filter "Penanggung jawab" di menu tugas.
  const { ensureMembers, setError: setWsError } = ws;
  useEffect(() => {
    if (!isTaskMenu) return;
    ensureMembers().catch(() => setWsError("Gagal memuat daftar anggota untuk filter."));
  }, [isTaskMenu, ensureMembers, setWsError]);

  const report = useMemo(() => buildReport(ws.allTasks), [ws.allTasks]);

  const canEditSelectedTask = Boolean(
    !isGuest &&
    selectedTask &&
      (canManageTasks ||
        selectedTask.assignee?.id === user.id ||
        selectedTask.creator?.id === user.id ||
        selectedTask.assignments?.some((assignment) => assignment.user.id === user.id))
  );

  /* ---------- Navigasi & aksi ---------- */

  function switchMenu(menu: MenuName) {
    ws.resetForMenu(menu);
    setActiveMenu(menu);
    setFilters(EMPTY_FILTERS);
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
    if (form === "member" && openForm !== "member") {
      ws.ensureDivisions().catch(() => ws.setError("Gagal memuat daftar divisi untuk form."));
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
    if (canManageTasks) ws.ensureProjects().catch(() => {});
  }

  /** Buka detail dari id saja (mis. dari feed aktivitas); ambil dari server bila belum dimuat. */
  async function openTaskById(taskId: string) {
    const known = [...ws.allTasks, ...dashboardTasks].find((task) => task.id === taskId);
    if (known) return openTaskDetails(known);
    try {
      const result = await request<{ task: Task }>(`/api/tasks/${taskId}`, {}, "Tugas tidak ditemukan.");
      openTaskDetails(result.task);
    } catch (err) {
      ws.setError(errorText(err, "Tugas tidak dapat dibuka."));
    }
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
      router.replace("/login");
      router.refresh();
    } catch (err) {
      ws.setError(errorText(err, "Logout gagal."));
    }
  }

  const refresh = () => void ws.refresh();

  /* ---------- Tampilan ---------- */

  return (
    <div className="rei-app">
      <FaviconBadge count={chat.unreadTotal + notifications.unread + myOpenTasksCount} />

      <Sidebar
        user={user}
        activeMenu={activeMenu}
        myTasksCount={myTasks.length}
        chatUnread={chat.unreadTotal}
        showProfileMenu={showProfileMenu}
        onToggleProfileMenu={() => setShowProfileMenu((open) => !open)}
        onSelectMenu={switchMenu}
        onHelp={() => ws.setNotice("Hubungi administrator jika Anda memerlukan bantuan.")}
        onIntegrations={() => {
          setShowProfileMenu(false);
          setShowIntegrations(true);
        }}
        onChangePassword={() => {
          setShowProfileMenu(false);
          setShowPasswordModal(true);
        }}
        onLogout={logout}
      />

      <main className="main-content">
        <Topbar
          user={user}
          activeMenu={activeMenu}
          notifications={notifications}
          onOpenTask={(taskId) => void openTaskById(taskId)}
          onRefresh={refresh}
          onToggleProfileMenu={() => setShowProfileMenu((open) => !open)}
        />

        <div className="page-content">
          <PageHeader
            user={user}
            activeMenu={activeMenu}
            primaryAction={primaryAction}
            secondaryAction={
              activeMenu === "Proyek" && canManageTasks
                ? { label: "Dari templat", onClick: () => setShowTemplateModal(true) }
                : null
            }
            onExport={
              activeMenu === "Chat" || activeMenu === "Pengaturan"
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
              labels={ws.labels}
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
              divisions={ws.divisions}
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
              onOpenTask={(taskId) => void openTaskById(taskId)}
            />
          )}

          {activeMenu === "Proyek" && (
            <ProjectsView
              projects={ws.projects}
              allTasks={ws.allTasks}
              loading={ws.loading}
              canDelete={canAdmin}
              canTemplate={canManageTasks}
              onSaveTemplate={(project) => {
                const name = window.prompt("Nama templat?", `Templat ${project.name}`)?.trim();
                if (name) void ws.saveProjectAsTemplate(project, name);
              }}
              onOpenBoard={(project) => {
                switchMenu("Board Kanban");
                setFilters({ ...EMPTY_FILTERS, search: project.name });
              }}
              onDelete={(project) => void ws.deleteProject(project)}
            />
          )}

          {activeMenu === "Tim" && (
            <TeamView
              user={user}
              members={ws.members}
              allTasks={ws.allTasks}
              divisions={ws.divisions}
              loading={ws.loading}
              canAdmin={canAdmin}
              onRoleChange={(member, role) => void ws.updateMemberRole(member, role)}
              onUpdateMember={(member, patch, success) => void ws.updateMember(member, patch, success)}
              onRefresh={refresh}
            />
          )}

          {activeMenu === "Pengaturan" && canManageTasks && (
            <SettingsView
              canAdmin={canAdmin}
              divisions={ws.divisions}
              labels={ws.labels}
              members={ws.members}
              saving={ws.saving}
              onSaveDivision={ws.saveDivision}
              onDeleteDivision={(division) => void ws.deleteDivision(division)}
              onSaveLabel={ws.saveLabel}
              onDeleteLabel={(label) => void ws.deleteLabel(label)}
              extra={
                <>
                  <WipSettingsPanel key={JSON.stringify(ws.wipLimits)} wipLimits={ws.wipLimits} onSave={ws.saveWipLimits} />
                  <AutomationPanel canEdit={canAdmin} />
                  <IntakePanel members={ws.members} projects={ws.projects} />
                  {canAdmin && <WebhooksPanel />}
                </>
              }
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
              key={activeMenu}
              menu={activeMenu}
              tasks={visibleTasks}
              loading={ws.loading}
              userId={user.id}
              filters={filters}
              members={ws.members}
              labels={ws.labels}
              views={ws.views}
              canManage={canManageTasks}
              readOnly={isGuest}
              wipLimits={ws.wipLimits}
              onFiltersChange={setFilters}
              onSaveView={(name, current) => void ws.saveView(name, current)}
              onDeleteView={(view) => void ws.deleteView(view)}
              onReschedule={(task, dates) =>
                void ws.patchTaskFields(task, dates, `Jadwal "${task.title}" digeser.`)
              }
              onBulk={ws.bulkUpdate}
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
          projects={ws.projects}
          labels={ws.labels}
          allTasks={ws.allTasks}
          canEdit={canEditSelectedTask}
          canManage={canManageTasks}
          isGuest={isGuest}
          onPatch={patchTask}
          onChanged={() => void ws.refresh(true)}
          onOpenTask={(taskId) => void openTaskById(taskId)}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showIntegrations && <IntegrationsModal canUseApi={!isGuest} onClose={() => setShowIntegrations(false)} />}
      {showTemplateModal && (
        <TemplateModal
          onClose={() => setShowTemplateModal(false)}
          onCreated={(message) => {
            ws.setNotice(message);
            void ws.refresh(true);
          }}
        />
      )}

      <style jsx>{dashboardStyles}</style>
      <style jsx>{featureStyles}</style>
    </div>
  );
}
