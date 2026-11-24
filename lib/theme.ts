import { faCrown, faDroplet, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type Theme = "light" | "dark" | "glass" | "gold";

export const THEME_STORAGE_KEY = "rei-theme";
export const THEME_CHANGE_EVENT = "rei-theme-change";

export const THEMES: Array<{
  id: Theme;
  label: string;
  description: string;
  icon: IconDefinition;
}> = [
  { id: "light", label: "Terang", description: "Bersih dan lega", icon: faSun },
  { id: "dark", label: "Gelap", description: "Nyaman untuk malam", icon: faMoon },
  { id: "glass", label: "Glassy", description: "Kaca buram dengan aurora", icon: faDroplet },
  { id: "gold", label: "Emas", description: "Hangat dan mewah", icon: faCrown },
];

export function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
