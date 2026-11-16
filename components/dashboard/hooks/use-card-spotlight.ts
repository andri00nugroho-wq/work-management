"use client";

import { useEffect } from "react";

const SPOTLIGHT_TARGETS = ".stat-card, .panel, .kanban-card";

/** Sorotan mengikuti kursor pada kartu (lewat variabel CSS --mx / --my). */
export function useCardSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    function spotlight(event: PointerEvent) {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(SPOTLIGHT_TARGETS);
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    }

    document.addEventListener("pointermove", spotlight, { passive: true });
    return () => document.removeEventListener("pointermove", spotlight);
  }, []);
}
