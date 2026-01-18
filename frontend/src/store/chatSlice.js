import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "../lib/axios";
import toast from "react-hot-toast";

const initialState = {
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    error: null,
};



export const getUsers = createAsyncThunk("chat/getUsers", async (_, { rejectWithValue }) => {
    try {
        const res = await API.get("/messages/users");
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message);
        return rejectWithValue(error.response.data);
    }
});

export const getMessages = createAsyncThunk("chat/getMessages", async (userId, { getState }) => {
    try {
        const res = await API.get(`/messages/${userId}`);
        const messages = res.data;


        const { authUser, socket } = getState().auth;
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


export const initChatListeners = () => (dispatch, getState) => {
    const { socket } = getState().auth;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
        const { authUser } = getState().auth;
        socket.emit("messageDelivered", {
            messageId: newMessage._id,
            receiverId: authUser._id,
        });

        const { selectedUser } = getState().chat;
        if (selectedUser && String(newMessage.senderId) === String(selectedUser._id)) {
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
        if (selectedUser && String(readerId) === String(selectedUser._id)) {
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
            const index = state.messages.findIndex(msg => msg._id === action.payload._id);
            if (index !== -1) {
                state.messages[index] = action.payload;
            }
        },
        markMessagesAsRead: (state, action) => {
            const { readerId, authUserId } = action.payload;
            state.messages = state.messages.map(msg => {
                if (
                    String(msg.senderId) === String(authUserId) &&
                    String(msg.receiverId) === String(readerId) &&
                    msg.status !== 'read'
                ) {
                    return { ...msg, status: 'read' };
                }
                return msg;
            });
        },
        updateMessage: (state, action) => {
            const index = state.messages.findIndex(msg => msg._id === action.payload._id);
            if (index !== -1) {
                state.messages[index] = action.payload;
            }
        },
        deleteMessageLocally: (state, action) => {
            state.messages = state.messages.map(msg =>
                msg._id === action.payload ? { ...msg, deleted: true, text: "" } : msg
            );
        },
        clearError: (state) => {
            state.error = null;
        }
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
                const index = state.messages.findIndex(msg => msg._id === action.payload._id);
                if (index !== -1) {
                    state.messages[index] = action.payload;
                }
            })

            .addCase(deleteMessage.fulfilled, (state, action) => {
                state.messages = state.messages.map(msg =>
                    msg._id === action.payload ? { ...msg, deleted: true, text: "" } : msg
                );
            });
    },
});

export const { clearError, updateMessage, deleteMessageLocally } = chatSlice.actions;
export default chatSlice.reducer;

