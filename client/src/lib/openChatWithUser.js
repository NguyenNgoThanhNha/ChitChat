import { apiClient } from "@/lib/api.client";
import { saveActiveChat } from "@/store/chatPersistence";
import { CONTACT_RELATION_ROUTE } from "@/utils/constant";
import { toast } from "sonner";

export const openChatWithUser = async (navigate, contact, store) => {
    if (!contact?._id) return;
    try {
        const res = await apiClient.get(CONTACT_RELATION_ROUTE(contact._id), { withCredentials: true });
        if (res.data?.relation !== "friends") {
            toast.info("Send a friend request first (use + in Direct Messages)");
            navigate("/chat");
            return;
        }
    } catch {
        toast.error("Could not verify friendship");
        return;
    }
    store.setSelectedChatType("contact");
    store.setSelectedChatData(contact);
    store.setselectedChatMessages([]);
    saveActiveChat("contact", contact._id);
    navigate("/chat");
};
