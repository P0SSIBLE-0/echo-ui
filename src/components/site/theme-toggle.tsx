"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "echo-ui-theme";
const DARK_CLASS = "dark";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore<Theme>(
    subscribe,
    getStoredTheme,
    () => "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle(DARK_CLASS, next === "dark");
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, [theme]);

  const isDark = theme === "dark";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="grid h-[18px] w-[18px] place-items-center rounded-[4px] bg-[#ececec] text-[#111111] transition hover:bg-white"
        aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      >
        {isDark ? <Sun size={11} strokeWidth={2.7} /> : <Moon size={11} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 w-[72px] items-center rounded-full border border-border-soft bg-surface p-1 text-foreground shadow-sm transition hover:bg-surface-muted"
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span
        className={`grid h-7 w-7 place-items-center rounded-full bg-foreground text-background shadow-sm transition-transform duration-300 ${
          isDark ? "translate-x-8" : "translate-x-0"
        }`}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </span>
    </button>
  );
}
