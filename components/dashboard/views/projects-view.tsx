"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { percent } from "../lib/format";
import { countDone, tasksOfProject } from "../lib/tasks";
import type { Project, Task } from "../types";
import { ProjectRow } from "../ui";

export default function ProjectsView({
  projects,
  allTasks,
  loading,
  canDelete,
  canTemplate,
  onOpenBoard,
  onDelete,
  onSaveTemplate,
}: {
  projects: Project[];
  allTasks: Task[];
  loading: boolean;
  canDelete: boolean;
  canTemplate: boolean;
  onOpenBoard: (project: Project) => void;
  onDelete: (project: Project) => void;
  onSaveTemplate: (project: Project) => void;
}) {
  return (
    <section className="project-grid">
      {projects.length === 0 && (
        <article className="panel">
          <div className="empty-projects">
            {loading ? "Memuat data proyek..." : "Belum ada proyek. Buat proyek pertama Anda."}
          </div>
        </article>
      )}

      {projects.map((project, index) => {
        const list = tasksOfProject(project, allTasks);
        const completed = countDone(list);
        const inProgress = list.filter((task) => task.status === "IN_PROGRESS").length;

        return (
          <article className="panel" key={project.id}>
            <ProjectRow
              name={project.name}
              index={index}
              summary={`${list.length} tugas · ${completed} selesai · ${inProgress} berjalan`}
              percentage={percent(completed, list.length)}
            />

            {project.description && <p className="project-description">{project.description}</p>}

            <div className="project-card-actions">
              <button className="text-button" onClick={() => onOpenBoard(project)}>
                Buka di board <Icon icon={faArrowRight} />
              </button>
              {canTemplate && list.length > 0 && (
                <button className="text-button" onClick={() => onSaveTemplate(project)}>
                  Simpan sebagai templat
                </button>
              )}
              {canDelete && (
                <button className="text-button danger-text" onClick={() => onDelete(project)}>
                  Hapus
                </button>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
