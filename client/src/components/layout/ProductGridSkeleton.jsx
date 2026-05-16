import { Skeleton } from "@/components/ui/skeleton";
import { staggerStyle } from "@/components/layout/AnimatedPage";

export function ProductGridSkeleton({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="page-stagger-item rounded-xl border border-border overflow-hidden"
                    style={staggerStyle(i, 40)}
                >
                    <Skeleton className="aspect-[4/3] w-full rounded-none" />
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function PostListSkeleton({ count = 3 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="page-stagger-item rounded-xl border border-border p-4 space-y-3"
                    style={staggerStyle(i, 50)}
                >
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                </div>
            ))}
        </div>
    );
}
