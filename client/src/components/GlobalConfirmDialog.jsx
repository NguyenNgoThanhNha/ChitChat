import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { useConfirmUi } from "@/store/confirm-ui";

const GlobalConfirmDialog = () => {
    const open = useConfirmUi((s) => s.open);
    const title = useConfirmUi((s) => s.title);
    const description = useConfirmUi((s) => s.description);
    const destructive = useConfirmUi((s) => s.destructive);
    const confirmLabel = useConfirmUi((s) => s.confirmLabel);
    const close = useConfirmUi((s) => s.close);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) close(false);
            }}
        >
            <DialogContent className="sm:max-w-md border-border bg-background text-foreground">
                <DialogHeader>
                    <DialogTitle>{title || "Xác nhận"}</DialogTitle>
                    <DialogDescription>{description || "Vui lòng xác nhận thao tác."}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
                        onClick={() => close(false)}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white ${
                            destructive
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-[#8417ff] hover:bg-[#741bda]"
                        }`}
                        onClick={() => close(true)}
                    >
                        {confirmLabel || (destructive ? "Xóa" : "OK")}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default GlobalConfirmDialog;
