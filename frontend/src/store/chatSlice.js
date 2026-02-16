import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "../lib/axios";
import toast from "react-hot-toast";

const SELECTED_USER_ID_KEY = "selectedChatUserId";

const initialState = {
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    error: null,
};

const toIdString = (idOrObject) => {
    if (!idOrObject) return "";
    if (typeof idOrObject === "object" && idOrObject._id) return String(idOrObject._id);
    return String(idOrObject);
};

export const getUsers = createAsyncThunk(
    "chat/getUsers",
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get("/messages/users");
            return res.data;
        } catch (error) {
            toast.error(error.response.data.message);
            return rejectWithValue(error.response.data);
        }
    },
    {
        condition: (_, { getState }) => {
            const { isUsersLoading } = getState().chat;
            return !isUsersLoading;
        },
    }
);

export const getMessages = createAsyncThunk("chat/getMessages", async (userId, { getState }) => {
    try {
        const res = await API.get(`/messages/${userId}`);
        const messages = res.data;


        const { authUser, socket } = getState().auth;
        if (socket) {
            messages.forEach((message) => {
                if (message.status === "sent" && toIdString(message.receiverId) === toIdString(authUser?._id)) {
                    socket.emit("messageDelivered", {
                        messageId: message._id,
                        receiverId: authUser._id,
                    });
                }
            });
        }
        return messages;
    } catch (error) {
        toast.error(error.response.data.message);
        throw error;
    }
});

export const sendMessage = createAsyncThunk("chat/sendMessage", async (messageData, { getState }) => {
    const { selectedUser } = getState().chat;
    try {
        const res = await API.post(`/messages/send/${selectedUser._id}`, messageData);
        return res.data.newMessage;
    } catch (error) {
        toast.error(error.response.data.message);
        throw error;
    }
});

export const editMessage = createAsyncThunk("chat/editMessage", async ({ messageId, text }) => {
    try {
        const res = await API.put(`/messages/edit/${messageId}`, { text });
        return res.data.message;
    } catch (error) {
        toast.error(error.response.data.error);
        throw error;
    }
});

export const deleteMessage = createAsyncThunk("chat/deleteMessage", async (messageId) => {
    try {
        await API.delete(`/messages/delete/${messageId}`);
        return messageId;
    } catch (error) {
        toast.error(error.response.data.error);
        throw error;
    }
});


export const selectUser = (user) => (dispatch, getState) => {
    dispatch(chatSlice.actions.setSelectedUser(user));

    if (user?._id) {
        localStorage.setItem(SELECTED_USER_ID_KEY, String(user._id));
    } else {
        localStorage.removeItem(SELECTED_USER_ID_KEY);
    }

    if (user) {
        dispatch(getMessages(user._id));
        const { authUser, socket } = getState().auth;
        if (socket) {
            socket.emit("markAsRead", {
                myId: authUser._id,
                userToChatId: user._id,
            });
        }
    }
};

export const getPersistedSelectedUserId = () => localStorage.getItem(SELECTED_USER_ID_KEY);


export const initChatListeners = () => (dispatch, getState) => {
    const { socket } = getState().auth;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messageStatusUpdated");
    socket.off("messagesRead");
    socket.off("messageUpdated");
    socket.off("messageDeleted");

    socket.on("newMessage", (newMessage) => {
        const { authUser } = getState().auth;

        if (toIdString(newMessage.receiverId) === toIdString(authUser?._id)) {
            socket.emit("messageDelivered", {
                messageId: newMessage._id,
                receiverId: authUser._id,
            });
        }

        const { selectedUser } = getState().chat;
        if (selectedUser && toIdString(newMessage.senderId) === toIdString(selectedUser._id)) {
            dispatch(chatSlice.actions.addMessage(newMessage));
            socket.emit("markAsRead", {
                myId: authUser._id,
                userToChatId: selectedUser._id,
            });
        }
    });

    socket.on("messageStatusUpdated", (updatedMessage) => {
        dispatch(chatSlice.actions.updateMessageStatus(updatedMessage));
    });

    socket.on("messagesRead", ({ readerId }) => {
        const { selectedUser } = getState().chat;
        if (selectedUser && toIdString(readerId) === toIdString(selectedUser._id)) {
            dispatch(chatSlice.actions.markMessagesAsRead({ readerId, authUserId: getState().auth.authUser._id }));
        }
    });

    socket.on("messageUpdated", (updatedMessage) => {
        dispatch(chatSlice.actions.updateMessage(updatedMessage));
    });

    socket.on("messageDeleted", (deletedMessage) => {
        dispatch(chatSlice.actions.deleteMessageLocally(deletedMessage._id));
    });
};




const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setSelectedUser: (state, action) => {
            state.selectedUser = action.payload;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        updateMessageStatus: (state, action) => {
            const index = state.messages.findIndex((msg) => toIdString(msg._id) === toIdString(action.payload._id));
            if (index !== -1) {
                state.messages[index] = {
                    ...state.messages[index],
                    ...action.payload,
                };
            }
        },
        markMessagesAsRead: (state, action) => {
            const { readerId, authUserId } = action.payload;
            state.messages = state.messages.map((msg) => {
                if (
                    toIdString(msg.senderId) === toIdString(authUserId) &&
                    toIdString(msg.receiverId) === toIdString(readerId) &&
                    msg.status !== "read"
                ) {
                    return { ...msg, status: "read" };
                }
                return msg;
            });
        },
        updateMessage: (state, action) => {
            const index = state.messages.findIndex((msg) => toIdString(msg._id) === toIdString(action.payload._id));
            if (index !== -1) {
                state.messages[index] = {
                    ...state.messages[index],
                    ...action.payload,
                };
            }
        },
        deleteMessageLocally: (state, action) => {
            state.messages = state.messages.map((msg) =>
                toIdString(msg._id) === toIdString(action.payload) ? { ...msg, deleted: true, text: "" } : msg
            );
        },
    },
    extraReducers: (builder) => {
        builder

            .addCase(getUsers.pending, (state) => {
                state.isUsersLoading = true;
            })
            .addCase(getUsers.fulfilled, (state, action) => {
                state.isUsersLoading = false;
                state.users = action.payload;
            })
            .addCase(getUsers.rejected, (state, action) => {
                state.isUsersLoading = false;
                state.error = action.payload;
            })

            .addCase(getMessages.pending, (state) => {
                state.isMessagesLoading = true;
            })
            .addCase(getMessages.fulfilled, (state, action) => {
                state.isMessagesLoading = false;
                state.messages = action.payload;
            })
            .addCase(getMessages.rejected, (state) => {
                state.isMessagesLoading = false;
            })

            .addCase(sendMessage.fulfilled, (state, action) => {
                state.messages.push(action.payload);
            })

            .addCase(editMessage.fulfilled, (state, action) => {
                const index = state.messages.findIndex((msg) => toIdString(msg._id) === toIdString(action.payload._id));
                if (index !== -1) {
                    state.messages[index] = {
                        ...state.messages[index],
                        ...action.payload,
                    };
                }
            })

            .addCase(deleteMessage.fulfilled, (state, action) => {
                state.messages = state.messages.map((msg) =>
                    toIdString(msg._id) === toIdString(action.payload) ? { ...msg, deleted: true, text: "" } : msg
                );
            });
    },
});

export default chatSlice.reducer;
