import { create } from "zustand";
import { createAuthSlice } from "./slices/auth-slice";
import { createChatSlice } from "./slices/chat-slice";
import { saveActiveChat } from "./chatPersistence.js";

export const useAppStore = create()((...a) => ({
    ...createAuthSlice(...a),
    ...createChatSlice(...a)
}));

useAppStore.subscribe((state) => {
    const t = state.selectedChatType;
    const d = state.selectedChatData;
    // Chỉ ghi khi đang có chat mở — không xóa persistence ở đây (tránh F5 xóa key trước khi khôi phục).
    // Xóa persistence chỉ trong closeChat / removeChannelFromList.
    if (t && d?._id) {
        saveActiveChat(t, d._id);
    }
});