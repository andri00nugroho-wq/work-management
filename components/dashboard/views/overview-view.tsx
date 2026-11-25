"use client";

import { faArrowRight, faArrowTrendUp, faCircleCheck, faHourglassStart, faListCheck } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { formatDateTime, formatRelative, initials, percent } from "../lib/format";
import { countDone } from "../lib/tasks";
import type { DashboardData } from "../types";
import { Legend, Panel, ProgressBar, ProjectRow, StatCard } from "../ui";

export default function OverviewView({
  data,
  loading,
  onOpenProjects,
  onOpenTask,
}: {
  data: DashboardData;
  loading: boolean;
  onOpenProjects: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  const stats = data.stats ?? {};
  const total = stats.totalTasks ?? 0;
  const done = stats.done ?? 0;
  const progress = percent(done, total);
  const projects = data.projects ?? [];

  return (
    <>
      <section className="stats-grid">
        <StatCard
          label="Total Tugas"
          value={total}
          note="Tugas sesuai hak akses"
          icon={faListCheck}
          color="var(--rei-accent)"
        />
        <StatCard
          label="Belum Mulai"
          value={stats.todo ?? 0}
          note="Menunggu dikerjakan"
          icon={faHourglassStart}
          color="var(--rei-neutral-text)"
        />
        <StatCard
          label="Sedang Berjalan"
          value={stats.inProgress ?? 0}
          note="Dalam pengerjaan"
          icon={faArrowTrendUp}
          color="var(--rei-orange-text)"
        />
        <StatCard
          label="Selesai"
          value={done}
          note={`${progress}% penyelesaian`}
          icon={faCircleCheck}
          color="var(--rei-success-text)"
        />
      </section>

      <section className="overview-grid">
        <Panel
          className="progress-panel"
          title="Ringkasan progres"
          subtitle="Persentase penyelesaian tugas dari data server"
          aside={<span className="live-pill">LIVE DATA</span>}
        >
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
              <Legend color="var(--rei-success-text)" label="Selesai" value={done} />
            </div>
          </div>

          <div className="progress-footer">
            <span>Total tugas selesai</span>
            <strong>
              {done} dari {total}
            </strong>
          </div>
          <ProgressBar value={progress} />

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
        </Panel>

        <Panel
          className="projects-panel"
          title="Proyek"
          subtitle="Proyek yang tersedia pada data dashboard"
          aside={
            <button className="text-button" onClick={onOpenProjects}>
              Lihat proyek <Icon icon={faArrowRight} />
            </button>
          }
        >
          <div className="project-list">
            {projects.length === 0 && (
              <div className="empty-projects">
                {loading
                  ? "Memuat data proyek..."
                  : "Belum ada data proyek atau API belum mengirim daftar proyek."}
              </div>
            )}

            {projects.slice(0, 5).map((project, index) => {
              const list = project.tasks ?? [];
              const completed = countDone(list);
              return (
                <ProjectRow
                  key={project.id}
                  name={project.name}
                  index={index}
                  summary={`${list.length} tugas · ${completed} selesai`}
                  percentage={percent(completed, list.length)}
                />
              );
            })}
          </div>
        </Panel>
      </section>

      <Panel
        className="activity-panel"
        title="Aktivitas terbaru"
        subtitle="Perubahan terakhir pada tugas yang bisa Anda lihat"
      >
        {(data.recentActivities ?? []).length === 0 ? (
          <div className="empty-projects">{loading ? "Memuat aktivitas..." : "Belum ada aktivitas."}</div>
        ) : (
          <ol className="activity-list activity-feed">
            {(data.recentActivities ?? []).map((activity) => (
              <li key={activity.id}>
                <span className="task-tag-avatar">{initials(activity.user.name)}</span>
                <span className="activity-body">
                  {activity.task ? (
                    <button type="button" className="activity-link" onClick={() => onOpenTask(activity.task!.id)}>
                      {activity.message}
                    </button>
                  ) : (
                    <span>{activity.message}</span>
                  )}
                  <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)}>
                    {formatRelative(activity.createdAt)}
                  </time>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}
