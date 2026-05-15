import { cn } from "@/lib/utils";

export function AnimatedPage({ className, mesh = false, children }) {
    return (
        <div
            className={cn(
                "min-h-[100dvh] bg-background text-foreground animate-page-in relative overflow-x-hidden",
                mesh && "app-page-bg",
                className
            )}
        >
            {mesh && (
                <>
                    <div className="app-orb w-64 h-64 bg-[#8417ff]/20 -top-20 -left-20" aria-hidden />
                    <div className="app-orb w-80 h-80 bg-[#975aed]/15 -bottom-32 -right-24" style={{ animationDelay: "-4s" }} aria-hidden />
                </>
            )}
            <div className="relative z-[1]">{children}</div>
        </div>
    );
}

export function AnimatedPageHeader({ className, children }) {
    return <header className={cn("page-header-in relative z-[1]", className)}>{children}</header>;
}

export function AnimatedPageMain({ className, children }) {
    return <main className={cn("page-content-in relative z-[1]", className)}>{children}</main>;
}

export function AnimatedCard({ className, children, delay = 0 }) {
    return (
        <div
            className={cn("page-stagger-item auth-card-glow rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm", className)}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export function AnimatedReveal({ className, children, delay = 0 }) {
    return (
        <div
            className={cn("auth-field-in", className)}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export function staggerMs(index, step = 55, maxMs = 440) {
    return Math.min(index * step, maxMs);
}

export function staggerItemClass() {
    return "page-stagger-item";
}

export function staggerStyle(index, step = 55, maxMs = 440) {
    return { animationDelay: `${staggerMs(index, step, maxMs)}ms` };
}
