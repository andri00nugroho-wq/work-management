export type Theme = "light" | "dark" | "glass" | "gold";

export const THEME_STORAGE_KEY = "rei-theme";
export const THEME_CHANGE_EVENT = "rei-theme-change";

export const THEMES: Array<{
  id: Theme;
  label: string;
  description: string;
  icon: string;
}> = [
  { id: "light", label: "Terang", description: "Bersih dan lega", icon: "☀" },
  { id: "dark", label: "Gelap", description: "Nyaman untuk malam", icon: "☾" },
  { id: "glass", label: "Glassy", description: "Kaca buram dengan aurora", icon: "◈" },
  { id: "gold", label: "Emas", description: "Hangat dan mewah", icon: "✦" },
];

export function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
