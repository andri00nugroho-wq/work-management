"use client";

import { formatDate, percent } from "../lib/format";
import type { TaskReport } from "../lib/tasks";
import { EmptyRow, Panel, PriorityBadge, ReportBar, StatCard, TableFooter } from "../ui";

type ProgressRow = { label: string; total: number; done: number };

function ProgressList({ rows, loading }: { rows: ProgressRow[]; loading: boolean }) {
  return (
    <div className="report-list">
      {rows.length === 0 && (
        <div className="empty-projects">{loading ? "Memuat data..." : "Belum ada data."}</div>
      )}
      {rows.map((row) => (
        <ReportBar
          key={row.label}
          label={row.label}
          value={row.done}
          max={row.total}
          suffix={`${row.done}/${row.total}`}
        />
      ))}
    </div>
  );
}

export default function ReportsView({
  report,
  loading,
  onRefresh,
}: {
  report: TaskReport;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
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
          note={`${percent(report.done, report.total)}% penyelesaian`}
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
        <Panel title="Tugas per status" subtitle="Distribusi status seluruh tugas">
          <div className="report-list">
            {report.byStatus.map((row) => (
              <ReportBar key={row.label} label={row.label} value={row.value} max={report.total} />
            ))}
          </div>
        </Panel>

        <Panel title="Tugas per prioritas" subtitle="Distribusi tingkat prioritas">
          <div className="report-list">
            {report.byPriority.map((row) => (
              <ReportBar key={row.label} label={row.label} value={row.value} max={report.total} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="overview-grid">
        <Panel title="Kinerja per proyek" subtitle="Tugas selesai dibanding total">
          <ProgressList rows={report.byProject} loading={loading} />
        </Panel>

        <Panel title="Kinerja per penanggung jawab" subtitle="Tugas selesai dibanding total">
          <ProgressList rows={report.byAssignee} loading={loading} />
        </Panel>
      </section>

      <Panel
        className="tasks-panel"
        headingClassName="tasks-heading"
        title="Tugas terlambat"
        subtitle="Belum selesai dan sudah melewati tenggat"
      >
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
                <EmptyRow colSpan={5}>
                  {loading ? "Memuat data..." : "Tidak ada tugas terlambat."}
                </EmptyRow>
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
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="due-date">{formatDate(task.dueDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TableFooter
          label={`${report.overdueTasks.length} tugas terlambat`}
          onRefresh={onRefresh}
        />
      </Panel>
    </>
  );
}
