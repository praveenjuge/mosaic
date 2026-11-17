import { useSyncExternalStore } from "react";

/**
 * Light, dark, or system theme, stored in `localStorage` under the key
 * next-themes used, so saved choices carry over. `themeScript` applies it
 * before the first paint; `useTheme` reads and changes it afterwards.
 */
export type Theme = "light" | "dark" | "system";

const storageKey = "theme";
const defaultTheme: Theme = "light";
const darkQuery = "(prefers-color-scheme: dark)";

/** Runs in `<head>` before the page paints, so it never flashes. */
export const themeScript = `(()=>{try{let t=localStorage.getItem("${storageKey}")||"${defaultTheme}",d=t==="dark"||t==="system"&&matchMedia("${darkQuery}").matches,e=document.documentElement;e.classList.remove("light","dark");e.classList.add(d?"dark":"light");e.style.colorScheme=d?"dark":"light"}catch{}})()`;

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Storage can be blocked; fall back to the default.
  }
  return defaultTheme;
}

function systemIsDark() {
  return window.matchMedia(darkQuery).matches;
}

/** Sets the `<html>` class without animating every color on the page. */
function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && systemIsDark());
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(dark ? "dark" : "light");
  root.style.colorScheme = dark ? "dark" : "light";
  // Flush the styles before transitions come back.
  window.getComputedStyle(document.body);
  setTimeout(() => style.remove(), 1);
}

const listeners = new Set<() => void>();
let current: Theme | undefined;

function getTheme() {
  return (current ??= readTheme());
}

function setTheme(theme: Theme) {
  current = theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // The choice still applies to this page.
  }
  applyTheme(theme);
  for (const listener of listeners) listener();
}

function onSystemChange() {
  if (getTheme() === "system") applyTheme("system");
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== storageKey) return;
  current = undefined;
  applyTheme(getTheme());
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.matchMedia(darkQuery).addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window
        .matchMedia(darkQuery)
        .removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    }
  };
}

function getResolvedTheme(): "light" | "dark" {
  const theme = getTheme();
  if (theme === "system") return systemIsDark() ? "dark" : "light";
  return theme;
}

/**
 * The stored theme and the one showing. Both are `undefined` while the page
 * hydrates, since the server can't know them.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => undefined);
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getResolvedTheme,
    () => undefined,
  );
  return { theme, resolvedTheme, setTheme };
}
