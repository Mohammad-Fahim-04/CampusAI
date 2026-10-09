import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      className={`icon-btn theme-toggle ${isDark ? "is-dark" : "is-light"}`}
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      <span className="theme-icon theme-sun">
        <Sun size={18} />
      </span>
      <span className="theme-icon theme-moon">
        <Moon size={18} />
      </span>
    </button>
  );
}