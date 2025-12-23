import { create } from "zustand";
import toast from "react-hot-toast";
import { API } from "../lib/axios";
import { useAuth } from "../authentication/useAuth";

export const useChat = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    getUsers: async () => {
        set({ isUsersLoading: true });

        try {
            const res = await API.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await API.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();

        try {
            const res = await API.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data.newMessage] });
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    subcribeToMessages: () => {
        const socket = useAuth.getState().socket;
        if (!socket) return;

        const handler = (newMessage) => {
            const authUser = useAuth.getState().authUser;
            if (String(newMessage.senderId) !== String(authUser._id)) {
                const { messages } = get();
                set({ messages: [...messages, newMessage] });
            }
        };

        socket.on("newMessage", handler);
        return handler;
    },

    unsubcribeToMessages: (handler) => {
        const socket = useAuth.getState().socket;
        if (socket && handler) {
            socket.off("newMessage", handler);
        }
    },

    // todo: optimize this one later
    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));