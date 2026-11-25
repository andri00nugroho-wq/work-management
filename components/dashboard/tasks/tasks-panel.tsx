"use client";

import { faFilter, faFloppyDisk, faMagnifyingGlass, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useState } from "react";
import { PRIORITY_LABEL } from "../constants";
import { EMPTY_FILTERS, activeFilterCount } from "../lib/tasks";
import type { Label, Member, MenuName, SavedView, Task, TaskFilters, TaskStatus, WipLimits } from "../types";
import { TableFooter } from "../ui";
import CalendarView from "../views/calendar-view";
import TimelineView from "../views/timeline-view";
import KanbanBoard from "./kanban-board";
import TaskTable, { type BulkAction } from "./task-table";

type TaskHandlers = {
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
};

export default function TasksPanel({
  menu,
  tasks,
  loading,
  userId,
  filters,
  members,
  labels,
  views,
  canManage,
  readOnly = false,
  wipLimits,
  onFiltersChange,
  onSaveView,
  onDeleteView,
  onRefresh,
  onOpenTask,
  onStatusChange,
  onReschedule,
  onBulk,
}: TaskHandlers & {
  menu: MenuName;
  tasks: Task[];
  loading: boolean;
  userId: string;
  filters: TaskFilters;
  members: Member[];
  labels: Label[];
  views: SavedView[];
  canManage: boolean;
  readOnly?: boolean;
  wipLimits: WipLimits;
  onFiltersChange: (filters: TaskFilters) => void;
  onSaveView: (name: string, filters: TaskFilters) => void;
  onDeleteView: (view: SavedView) => void;
  onRefresh: () => void;
  onReschedule: (task: Task, dates: { startDate: string | null; dueDate: string }) => void;
  onBulk: (tasks: Task[], action: BulkAction) => Promise<void>;
}) {
  const handlers = { onOpenTask, onStatusChange };
  const [showFilters, setShowFilters] = useState(false);
  const [activeViewId, setActiveViewId] = useState("");
  const filterCount = activeFilterCount(filters);
  const set = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
    setActiveViewId("");
    onFiltersChange({ ...filters, [key]: value });
  };

  function applyView(viewId: string) {
    setActiveViewId(viewId);
    const view = views.find((item) => item.id === viewId);
    onFiltersChange({ ...EMPTY_FILTERS, ...(view?.filters ?? {}) });
    if (view) setShowFilters(true);
  }

  function saveCurrentView() {
    const name = window.prompt("Nama tampilan ini?", "Tampilan saya")?.trim();
    if (name) onSaveView(name, filters);
  }

  const activeView = views.find((view) => view.id === activeViewId);

  return (
    <section className="panel tasks-panel">
      <div className="panel-heading tasks-heading">
        <div>
          <h2>{menu === "Dashboard" ? "Daftar tugas" : menu}</h2>
          <p>Status dan informasi tugas dari database</p>
        </div>

        <div className="task-tools">
          <div className="search-box">
            <span><Icon icon={faMagnifyingGlass} /></span>
            <input
              value={filters.search}
              onChange={(event) => set("search", event.target.value)}
              placeholder="Cari tugas atau label..."
              aria-label="Cari tugas"
            />
          </div>

          <select
            className="filter-select"
            value={filters.status}
            onChange={(event) => set("status", event.target.value)}
            aria-label="Filter status"
          >
            <option value="ALL">Semua status</option>
            <option value="TODO">Belum mulai</option>
            <option value="IN_PROGRESS">Berjalan</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Selesai</option>
          </select>

          <button
            type="button"
            className={`secondary-button filter-toggle ${showFilters || filterCount > 1 ? "active" : ""}`}
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
          >
            <Icon icon={faFilter} /> Filter{filterCount ? ` (${filterCount})` : ""}
          </button>

          <select
            className="filter-select"
            value={activeViewId}
            onChange={(event) => applyView(event.target.value)}
            aria-label="Tampilan tersimpan"
          >
            <option value="">{views.length ? "Tampilan tersimpan..." : "Belum ada tampilan"}</option>
            {views.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="filter-bar">
          <label>
            Prioritas
            <select value={filters.priority} onChange={(event) => set("priority", event.target.value)}>
              <option value="ALL">Semua</option>
              {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Penanggung jawab
            <select value={filters.assigneeId} onChange={(event) => set("assigneeId", event.target.value)}>
              <option value="">Semua orang</option>
              <option value={userId}>Saya</option>
              {members
                .filter((member) => member.id !== userId)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Label
            <select value={filters.labelId} onChange={(event) => set("labelId", event.target.value)}>
              <option value="">Semua label</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tenggat dari
            <input
              type="date"
              value={filters.dueFrom}
              max={filters.dueTo || undefined}
              onChange={(event) => set("dueFrom", event.target.value)}
            />
          </label>
          <label>
            sampai
            <input
              type="date"
              value={filters.dueTo}
              min={filters.dueFrom || undefined}
              onChange={(event) => set("dueTo", event.target.value)}
            />
          </label>
          <div className="filter-bar-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setActiveViewId("");
                onFiltersChange(EMPTY_FILTERS);
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={saveCurrentView}
              disabled={filterCount === 0 && !filters.search.trim()}
            >
              <Icon icon={faFloppyDisk} /> Simpan tampilan
            </button>
            {activeView && (
              <button
                type="button"
                className="secondary-button danger"
                onClick={() => {
                  onDeleteView(activeView);
                  setActiveViewId("");
                }}
              >
                <Icon icon={faTrashCan} /> Hapus &quot;{activeView.name}&quot;
              </button>
            )}
          </div>
        </div>
      )}

      {menu === "Board Kanban" ? (
        <KanbanBoard tasks={tasks} loading={loading} wipLimits={wipLimits} readOnly={readOnly} {...handlers} />
      ) : menu === "Kalender" ? (
        <CalendarView tasks={tasks} canReschedule={canManage} onOpenTask={onOpenTask} onReschedule={onReschedule} />
      ) : menu === "Timeline" ? (
        <TimelineView tasks={tasks} onOpenTask={onOpenTask} />
      ) : (
        <TaskTable
          tasks={tasks}
          loading={loading}
          userId={userId}
          members={members}
          canBulk={canManage}
          readOnly={readOnly}
          onBulk={onBulk}
          {...handlers}
        />
      )}

      <TableFooter
        label={`Menampilkan ${tasks.length} tugas${loading ? " · Memuat..." : ""}`}
        onRefresh={onRefresh}
      />
    </section>
  );
}

