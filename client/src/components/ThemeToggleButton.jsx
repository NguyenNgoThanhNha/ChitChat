import { useTheme } from "next-themes";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi";

export function ThemeToggleButton({ className = "" }) {
    const { setTheme, resolvedTheme } = useTheme();
    const isDark = (resolvedTheme ?? "dark") === "dark";

    return (
        <button
            type="button"
            className={`rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${className}`}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
        >
            {isDark ? <HiOutlineSun className="text-xl" /> : <HiOutlineMoon className="text-xl" />}
        </button>
    );
}
