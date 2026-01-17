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
            const messages = res.data;
            set({ messages });

            const { authUser, socket } = useAuth.getState();
            if (socket) {
                messages.forEach(message => {
                    if (message.status === 'sent' && String(message.receiverId) === String(authUser._id)) {
                        socket.emit("messageDelivered", {
                            messageId: message._id,
                            receiverId: authUser._id
                        });
                    }
                });
            }
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

    initChatListeners: () => {
        const socket = useAuth.getState().socket;
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            const { authUser } = useAuth.getState();

            // Acknowledge delivery as soon as the client receives the message
            socket.emit("messageDelivered", {
                messageId: newMessage._id,
                receiverId: authUser._id,
            });

            const { messages, selectedUser } = get();
            
            // Only add the message to the UI if it belongs to the currently open chat
            if (selectedUser && String(newMessage.senderId) === String(selectedUser._id)) {
                set({ messages: [...messages, newMessage] });

                // Since the chat is open and the message is displayed, mark it as read
                socket.emit("markAsRead", {
                    myId: authUser._id,
                    userToChatId: selectedUser._id,
                });
            }
        });

        socket.on("messageStatusUpdated", (updatedMessage) => {
            const { messages } = get();
            const updatedMessages = messages.map(msg =>
                msg._id === updatedMessage._id ? updatedMessage : msg
            );
            set({ messages: updatedMessages });
        });

        socket.on("messagesRead", ({ readerId }) => {
            const { messages, selectedUser } = get();
            const authUser = useAuth.getState().authUser;
            if (selectedUser && String(readerId) === String(selectedUser._id)) {
                const updatedMessages = messages.map(msg => {
                    // Explicitly check that the message was sent by me TO the reader
                    if (
                        msg.senderId === authUser._id &&
                        String(msg.receiverId) === String(readerId) &&
                        msg.status !== 'read'
                    ) {
                        return { ...msg, status: 'read' };
                    }
                    return msg;
                });
                set({ messages: updatedMessages });
            }
        });
    },

    setSelectedUser: (selectedUser) => {
        set({ selectedUser });
        if (selectedUser) {
            const { authUser, socket } = useAuth.getState();
            get().getMessages(selectedUser._id);
            socket.emit("markAsRead", {
                myId: authUser._id,
                userToChatId: selectedUser._id,
            });
        }
    },
}));
