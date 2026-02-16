import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const initialState = {
    authUser: null,
    socket: null,
    onlineUsers: [],
    isCheckingAuth: true,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    error: null,
};

export const checkAuth = createAsyncThunk("auth/checkAuth", async (_, { dispatch, rejectWithValue }) => {
    try {
        const res = await API.get("/auth/check");
        dispatch(connectSocket(res.data));
        return res.data;
    } catch (error) {
        if (error.response?.status === 401) {
            return rejectWithValue(null);
        }
        console.log("Error in checkAuth: ", error);
        return rejectWithValue(error.response?.data);
    }
});

export const signup = createAsyncThunk("auth/signup", async (data, { rejectWithValue }) => {
    try {
        const res = await API.post("/auth/signup", data);
        toast.success("Account created successfully");
        return res.data;
    } catch (error) {
        toast.error(error.response?.data?.message || error.message);
        return rejectWithValue(error.response.data);
    }
});

export const login = createAsyncThunk("auth/login", async (data, { dispatch, rejectWithValue }) => {
    try {
        const res = await API.post("/auth/login", data);
        toast.success("Logged in successfully");
        dispatch(connectSocket(res.data));
        return res.data;
    } catch (error) {
        toast.error(error.response?.data?.message || error.message);
        return rejectWithValue(error.response.data);
    }
});

export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (email, { rejectWithValue }) => {
    try {
        const res = await API.post("/auth/forgot-password", { email });
        toast.success(res.data.message || "Reset link sent");
        return res.data;
    } catch (error) {
        toast.error(error.response?.data?.message || error.message);
        return rejectWithValue(error.response?.data);
    }
});

export const resetPassword = createAsyncThunk("auth/resetPassword", async ({ token, password }, { rejectWithValue }) => {
    try {
        const res = await API.post(`/auth/reset-password/${token}`, { password });
        toast.success(res.data.message || "Password reset successful");
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || error.message);
        return rejectWithValue(error.response?.data);
    }
});

export const logout = createAsyncThunk("auth/logout", async (_, { getState }) => {
    try {
        await API.post("/auth/logout");
        const { socket } = getState().auth;
        if (socket) {
            socket.disconnect();
        }
        toast.success("Logged out successfully");
        return null;
    } catch (error) {
        toast.error(error.message);
        throw error;
    }
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (data) => {
    const res = await API.put("/auth/update-profile", data);
    toast.success("Profile updated successfully");
    return res.data;
});

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setSocket: (state, action) => {
            state.socket = action.payload;
        },
        setOnlineUsers: (state, action) => {
            state.onlineUsers = (action.payload || []).map((id) => String(id));
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkAuth.pending, (state) => {
                state.isCheckingAuth = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.authUser = action.payload;
                state.isCheckingAuth = false;
            })
            .addCase(checkAuth.rejected, (state, action) => {
                state.authUser = null;
                state.isCheckingAuth = false;
                state.error = action.payload || null;
            })
            .addCase(signup.pending, (state) => {
                state.isSigningUp = true;
            })
            .addCase(signup.fulfilled, (state) => {
                state.authUser = null;
                state.isSigningUp = false;
            })
            .addCase(signup.rejected, (state, action) => {
                state.isSigningUp = false;
                state.error = action.payload;
            })
            .addCase(login.pending, (state) => {
                state.isLoggingIn = true;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.authUser = action.payload;
                state.isLoggingIn = false;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoggingIn = false;
                state.error = action.payload;
            })
            .addCase(logout.fulfilled, (state, action) => {
                state.authUser = action.payload;
                state.socket = null;
                state.onlineUsers = [];
            })
            .addCase(logout.rejected, (state, action) => {
                state.error = action.error.message;
            })
            .addCase(updateProfile.pending, (state) => {
                state.isUpdatingProfile = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.authUser = action.payload;
                state.isUpdatingProfile = false;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isUpdatingProfile = false;
                state.error = action.payload;
            });
    },
});

let socketInstance = null;

export const connectSocket = (authUser) => (dispatch) => {
    if (!authUser || socketInstance?.connected) return;

    socketInstance = io(BASE_URL, {
        query: { userId: authUser._id },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        pingTimeout: 60000,
        pingInterval: 25000,
        forceNew: false,
    });

    dispatch(authSlice.actions.setSocket(socketInstance));

    socketInstance.on("getOnlineUsers", (userIds) => {
        dispatch(authSlice.actions.setOnlineUsers(userIds));
    });

    // Handle reconnection events
    socketInstance.on("reconnect", (attempt) => {
        console.log(`Socket reconnected after ${attempt} attempts`);
    });

    socketInstance.on("reconnect_attempt", (attempt) => {
        console.log(`Socket reconnection attempt ${attempt}`);
    });

    socketInstance.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
        console.error("Socket reconnection failed");
    });
};

export default authSlice.reducer;
