import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<"light" | "dark" | "auto">("auto");

  useEffect(() => {
    const stored = localStorage.getItem("sommyart-theme");
    if (stored === "light" || stored === "dark" || stored === "auto") setMode(stored);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", mode === "dark" || (mode === "auto" && media.matches));
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);

  function changeMode(next: "light" | "dark" | "auto") {
    setMode(next);
    localStorage.setItem("sommyart-theme", next);
  }

  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  return (
    <label className={`bg-card shadow-soft text-foreground inline-flex items-center gap-1 rounded-full px-2 ${className}`}>
      <Icon className="h-4 w-4" aria-hidden />
      <span className="sr-only">Theme mode</span>
      <select
        aria-label="Theme mode"
        value={mode}
        onChange={(event) => changeMode(event.target.value as "light" | "dark" | "auto")}
        className="bg-transparent py-2 text-xs font-bold outline-none"
      >
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
