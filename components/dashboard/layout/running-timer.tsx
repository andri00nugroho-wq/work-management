"use client";

import { faStopwatch } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { formatClock, useRunningTimer } from "../hooks/use-running-timer";

/** Chip timer aktif di topbar; klik membuka tugasnya. */
export default function RunningTimer({ onOpenTask }: { onOpenTask: (taskId: string) => void }) {
  const { timer, elapsed } = useRunningTimer();
  if (!timer) return null;
  return (
    <button
      type="button"
      className="running-timer"
      title={`Timer berjalan: ${timer.task.title}`}
      onClick={() => onOpenTask(timer.task.id)}
    >
      <Icon icon={faStopwatch} />
      <span className="running-timer-title">{timer.task.title}</span>
      <strong>{formatClock(elapsed)}</strong>
    </button>
  );
}
