import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn("rounded-md bg-muted animate-skeleton-pulse", className)}
            {...props}
        />
    );
}
