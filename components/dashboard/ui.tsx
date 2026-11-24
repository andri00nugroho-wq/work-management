"use client";

import { faCircle, faRotateRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PRIORITY_LABEL, STATUSES, STATUS_LABEL } from "./constants";
import { initials, percent } from "./lib/format";
import type { Label, TaskPriority, TaskStatus } from "./types";

export function StatCard({
  label,
  value,
  note,
  icon,
  color,
}: {
  label: string;
  value: number;
  note: string;
  icon: IconDefinition;
  color: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span
          className="stat-icon"
          style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          <Icon icon={icon} />
        </span>
      </div>
      <div className="stat-value">
        <AnimatedNumber value={value} />
      </div>
      <div className="stat-note">
        <span style={{ color }}><Icon icon={faCircle} /></span> {note}
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

export function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <span className="legend-dot" style={{ background: color }} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export function ReportBar({
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
  return (
    <div>
      <div className="report-row-top">
        <span>{label}</span>
        <strong>{suffix ?? value}</strong>
      </div>
      <ProgressBar value={percent(value, max)} />
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  aside,
  className = "",
  headingClassName = "",
  children,
}: {
  title: string;
  subtitle: string;
  aside?: ReactNode;
  className?: string;
  headingClassName?: string;
  children: ReactNode;
}) {
  return (
    <article className={`panel ${className}`.trim()}>
      <div className={`panel-heading ${headingClassName}`.trim()}>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {aside}
      </div>
      {children}
    </article>
  );
}

export function Alert({
  kind,
  message,
  onClose,
  className = "",
}: {
  kind: "error" | "success";
  message: string;
  onClose: () => void;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      className={`message ${kind}-message ${className}`.trim()}
      role={kind === "error" ? "alert" : "status"}
    >
      <span>{message}</span>
      <button onClick={onClose} aria-label="Tutup pesan">
        <Icon icon={faXmark} />
      </button>
    </div>
  );
}

/** Backdrop modal: tutup saat klik di luar atau tekan Escape. */
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="task-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

export function ModalHeading({
  eyebrow,
  title,
  titleId,
  closeLabel = "Tutup",
  inlineEyebrow = false,
  onClose,
}: {
  eyebrow: string;
  title: string;
  titleId?: string;
  closeLabel?: string;
  inlineEyebrow?: boolean;
  onClose: () => void;
}) {
  const Eyebrow = inlineEyebrow ? "span" : "div";
  return (
    <div className="task-modal-heading">
      <div>
        <Eyebrow className="task-modal-eyebrow">{eyebrow}</Eyebrow>
        <h2 id={titleId}>{title}</h2>
      </div>
      <button type="button" className="task-modal-close" onClick={onClose} aria-label={closeLabel}>
        <Icon icon={faXmark} />
      </button>
    </div>
  );
}

const STATUS_OPTION_LABEL: Record<TaskStatus, string> = {
  ...STATUS_LABEL,
  REVIEW: "Review",
};

export function StatusSelect({
  status,
  title,
  onChange,
  stopClick = false,
  disabled = false,
}: {
  status: TaskStatus;
  title: string;
  onChange: (status: TaskStatus) => void;
  stopClick?: boolean;
  disabled?: boolean;
}) {
  return (
    <select
      className={`status-select status-${status.toLowerCase()}`}
      value={status}
      disabled={disabled}
      onClick={stopClick ? (event) => event.stopPropagation() : undefined}
      onChange={(event) => onChange(event.target.value as TaskStatus)}
      aria-label={`Ubah status ${title}`}
    >
      {STATUSES.map((item) => (
        <option key={item} value={item}>
          {STATUS_OPTION_LABEL[item]}
        </option>
      ))}
    </select>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`priority priority-${priority.toLowerCase()}`}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function ProjectRow({
  name,
  index,
  summary,
  percentage,
}: {
  name: string;
  index: number;
  summary: string;
  percentage: number;
}) {
  return (
    <div className="project-row">
      <div className={`project-symbol project-color-${index % 3}`}>{initials(name)}</div>
      <div className="project-details">
        <strong>{name}</strong>
        <span>{summary}</span>
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
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-state">
        {children}
      </td>
    </tr>
  );
}

export function TableFooter({ label, onRefresh }: { label: ReactNode; onRefresh: () => void }) {
  return (
    <div className="table-footer">
      <span>{label}</span>
      <button className="text-button" onClick={onRefresh}>
        <Icon icon={faRotateRight} /> Perbarui data
      </button>
    </div>
  );
}

/** Kerangka bagian di modal detail tugas: judul, keterangan, info kanan, isi. */
export function TaskSection({
  title,
  subtitle,
  aside,
  className = "",
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`task-tags-section ${className}`.trim()}>
      <div className="task-tags-heading">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {aside !== undefined && <span>{aside}</span>}
      </div>
      {children}
    </div>
  );
}

/** Pesan galat/sukses kecil di bawah bagian. */
export function SectionMessages({ error, notice }: { error: string; notice: string }) {
  return (
    <>
      {error && (
        <p className="task-link-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="task-link-notice" role="status">
          {notice}
        </p>
      )}
    </>
  );
}

/** Deretan label berwarna. */
export function LabelChips({ labels, small = false }: { labels?: Array<{ label: Label }>; small?: boolean }) {
  if (!labels?.length) return null;
  return (
    <span className={`label-chips ${small ? "label-chips-small" : ""}`.trim()}>
      {labels.map(({ label }) => (
        <span
          key={label.id}
          className="label-chip"
          style={{ "--label-color": label.color } as CSSProperties}
        >
          {label.name}
        </span>
      ))}
    </span>
  );
}

/** Pilih beberapa label (checkbox berwarna). */
export function LabelPicker({
  labels,
  value,
  onChange,
}: {
  labels: Label[];
  value: string[];
  onChange: (labelIds: string[]) => void;
}) {
  function toggle(labelId: string) {
    onChange(value.includes(labelId) ? value.filter((id) => id !== labelId) : [...value, labelId]);
  }
  return (
    <fieldset className="description-field label-picker">
      <legend>Label</legend>
      {labels.length === 0 ? (
        <small>Belum ada label. Buat label di menu Pengaturan.</small>
      ) : (
        labels.map((label) => (
          <label
            key={label.id}
            className={`label-option ${value.includes(label.id) ? "active" : ""}`}
            style={{ "--label-color": label.color } as CSSProperties}
          >
            <input type="checkbox" checked={value.includes(label.id)} onChange={() => toggle(label.id)} />
            {label.name}
          </label>
        ))
      )}
    </fieldset>
  );
}
