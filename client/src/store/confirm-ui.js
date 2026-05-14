import { create } from "zustand";

/**
 * Xác nhận dạng popup (thay window.confirm).
 * Dùng: `const ok = await useConfirmUi.getState().show({ title, description, destructive });`
 */
export const useConfirmUi = create((set, get) => ({
    open: false,
    title: "",
    description: "",
    destructive: false,
    confirmLabel: null,
    resolve: null,
    show: ({ title, description, destructive = false, confirmLabel = null }) =>
        new Promise((resolve) => {
            set({
                open: true,
                title: title ?? "",
                description: description ?? "",
                destructive,
                confirmLabel,
                resolve
            });
        }),
    close: (value) => {
        const r = get().resolve;
        set({ open: false, title: "", description: "", destructive: false, confirmLabel: null, resolve: null });
        r?.(value);
    }
}));
