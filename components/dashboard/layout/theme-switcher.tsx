"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, applyTheme, type Theme } from "@/lib/theme";
import { useTheme } from "@/lib/use-theme";

export default function ThemeSwitcher() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const current = THEMES.find((item) => item.id === theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!open) return;

    function closeOnPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function choose(next: Theme) {
    applyTheme(next);
    setOpen(false);
  }

  return (
    <div className="theme-switcher" ref={rootRef}>
      <button
        className="theme-toggle"
        type="button"
        aria-label="Ubah tema tampilan"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Ubah tema tampilan"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="theme-toggle-icon" aria-hidden="true">
          {current?.icon}
        </span>
        <span>{current?.label}</span>
        <span className={`theme-caret ${open ? "open" : ""}`} aria-hidden="true">
          ⌄
        </span>
      </button>

      {open && (
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
              onClick={() => choose(item.id)}
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
  );
}
