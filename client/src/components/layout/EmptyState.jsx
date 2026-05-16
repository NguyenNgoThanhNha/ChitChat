import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center px-6 py-8 page-content-in",
                className
            )}
        >
            {Icon && (
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#8417ff]/10 text-[#8417ff] auth-float">
                    <Icon className="text-2xl" />
                </div>
            )}
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description && (
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function ListSkeleton({ rows = 4 }) {
    return (
        <div className="mt-2 space-y-2 px-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 py-2 page-stagger-item"
                    style={{ animationDelay: `${i * 60}ms` }}
                >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted animate-skeleton-pulse" />
                    <div className="h-3 flex-1 max-w-[120px] rounded bg-muted animate-skeleton-pulse" />
                </div>
            ))}
        </div>
    );
}
