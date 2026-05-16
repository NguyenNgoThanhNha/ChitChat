import { Loader2 } from "lucide-react";

const Loading = ({ label = "Loading Syncronus…" }) => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 app-page-bg animate-page-in">
            <div className="relative">
                <span className="auth-pulse-ring absolute inset-0 rounded-full bg-[#8417ff]/25" aria-hidden />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8417ff]/15 border border-[#8417ff]/30">
                    <Loader2 className="h-7 w-7 animate-spin text-[#8417ff]" />
                </div>
            </div>
            <p className="text-sm text-muted-foreground auth-field-in">{label}</p>
        </div>
    );
};

export default Loading;
