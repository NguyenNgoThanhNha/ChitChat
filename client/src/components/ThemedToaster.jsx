import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ThemedToaster() {
    const { resolvedTheme } = useTheme();
    return (
        <Toaster
            visibleToasts={2}
            position="top-right"
            richColors
            closeButton
            theme={resolvedTheme === "light" ? "light" : "dark"}
        />
    );
}
