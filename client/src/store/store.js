import { create } from "zustand";
import { createAuthSlice } from "./slices/auth-slice";
import { createChatSlice } from "./slices/chat-slice";

export const useAppStore = create()((...a) => ({
    ...createAuthSlice(...a), // truyền vào tham số cho slice
    ...createChatSlice(...a)
}))