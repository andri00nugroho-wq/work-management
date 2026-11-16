"use client";

import { useSyncExternalStore } from "react";
import { THEMES, THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type Theme } from "./theme";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): Theme {
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  const match = THEMES.find((item) => item.id === saved);
  if (match) return match.id;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

/** Tema aktif, tersinkron antar-tab dan antar-komponen. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
