import { useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("bixvest-theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (typeof window === "undefined" ? "dark" : getInitial()));

  useEffect(() => {
    apply(theme);
    localStorage.setItem("bixvest-theme", theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme(t => (t === "dark" ? "light" : "dark")), []);
  return { theme, setTheme, toggle };
}

// Run once on module import to avoid FOUC
if (typeof window !== "undefined") {
  try { apply(getInitial()); } catch {}
}
