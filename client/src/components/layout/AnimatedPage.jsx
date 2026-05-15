import { cn } from "@/lib/utils";

export function AnimatedPage({ className, children }) {
    return (
        <div className={cn("min-h-[100dvh] bg-background text-foreground animate-page-in", className)}>
            {children}
        </div>
    );
}

export function AnimatedPageHeader({ className, children }) {
    return <header className={cn("page-header-in", className)}>{children}</header>;
}

export function AnimatedPageMain({ className, children }) {
    return <main className={cn("page-content-in", className)}>{children}</main>;
}

/** Stagger delay in ms for grid/list items (cap at maxMs). */
export function staggerMs(index, step = 55, maxMs = 440) {
    return Math.min(index * step, maxMs);
}

export function staggerItemClass(index, step = 55, maxMs = 440) {
    return "page-stagger-item";
}

export function staggerStyle(index, step = 55, maxMs = 440) {
    return { animationDelay: `${staggerMs(index, step, maxMs)}ms` };
}
