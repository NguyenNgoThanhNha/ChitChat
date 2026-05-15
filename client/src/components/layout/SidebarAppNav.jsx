import { cn } from "@/lib/utils";
import { staggerStyle } from "@/components/layout/AnimatedPage";
import SocialToolbar from "@/pages/chat/contact-container/social-toolbar/SocialToolbar";
import { useNavigate } from "react-router-dom";
import { FiBookOpen } from "react-icons/fi";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navBtn =
    "page-stagger-item flex flex-col items-center justify-center gap-0.5 rounded-xl p-2 min-h-[52px] text-muted-foreground hover:text-[#8417ff] dark:hover:text-white hover:bg-[#8417ff]/10 border border-transparent hover:border-[#8417ff]/20 transition-all duration-300 active:scale-95";

export function SidebarAppNav({ onContactsUpdated, className }) {
    const navigate = useNavigate();

    return (
        <nav
            className={cn(
                "shrink-0 px-2 sm:px-3 pb-3 border-b border-chat-border/60 page-header-in",
                className
            )}
            aria-label="App menu"
        >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium px-2 mb-2">
                Menu
            </p>
            <TooltipProvider delayDuration={300}>
            <div className="grid grid-cols-4 gap-1.5">
                <SocialToolbar onContactsUpdated={onContactsUpdated} variant="grid" />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className={navBtn}
                            style={staggerStyle(2)}
                            onClick={() => navigate("/shop")}
                            aria-label="Shop"
                        >
                            <HiOutlineShoppingBag className="text-xl" />
                            <span className="text-[9px] font-medium leading-none">Shop</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Shop</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className={navBtn}
                            style={staggerStyle(3)}
                            onClick={() => navigate("/blog")}
                            aria-label="Blog"
                        >
                            <FiBookOpen className="text-xl" />
                            <span className="text-[9px] font-medium leading-none">Blog</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Blog</TooltipContent>
                </Tooltip>
            </div>
            </TooltipProvider>
        </nav>
    );
}
