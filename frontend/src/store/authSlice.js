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

// --- Async Thunks ---

export const checkAuth = createAsyncThunk("auth/checkAuth", async (_, { dispatch, rejectWithValue }) => {
    try {
        const res = await API.get("/auth/check");
        dispatch(connectSocket(res.data)); // Connect socket after getting user
        return res.data;
    } catch (error) {
        console.log("Error in checkAuth: ", error);
        return rejectWithValue(error.response?.data);
    }
});

export const signup = createAsyncThunk("auth/signup", async (data, { dispatch, rejectWithValue }) => {
    try {
        const res = await API.post("/auth/signup", data);
        toast.success("Account created successfully");
        dispatch(connectSocket(res.data));
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

export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (email) => {
    const res = await API.post("/auth/forgot-password", { email });
    toast.success(res.data.message || "Reset link sent");
    return res.data;
});

export const resetPassword = createAsyncThunk("auth/resetPassword", async ({ token, password }) => {
    const res = await API.post(`/auth/reset-password/${token}`, { password });
    toast.success(res.data.message || "Password reset successful");
    return true;
});

export const logout = createAsyncThunk("auth/logout", async (_, { dispatch, getState }) => {
    try {
        await API.post("/auth/logout");
        const { socket } = getState().auth;
        if (socket) {
            socket.disconnect();
        }
        toast.success("Logged out successfully");
        return null; // This will be the new authUser
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

// --- Socket Thunk ---

let socketInstance = null;

export const connectSocket = (authUser) => (dispatch, getState) => {
    if (!authUser || socketInstance?.connected) return;

    socketInstance = io(BASE_URL, {
        query: { userId: authUser._id },
    });

    dispatch(authSlice.actions.setSocket(socketInstance));

    socketInstance.on("getOnlineUsers", (userIds) => {
        dispatch(authSlice.actions.setOnlineUsers(userIds));
    });
};


// --- Auth Slice Definition ---

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setSocket: (state, action) => {
            // Redux can't store non-serializable data like a socket object directly.
            // This is a common workaround, but be mindful of SSR and time-travel debugging.
            state.socket = action.payload;
        },
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Check Auth
            .addCase(checkAuth.pending, (state) => {
                state.isCheckingAuth = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.authUser = action.payload;
                state.isCheckingAuth = false;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.authUser = null;
                state.isCheckingAuth = false;
            })
            // Signup
            .addCase(signup.pending, (state) => {
                state.isSigningUp = true;
            })
            .addCase(signup.fulfilled, (state, action) => {
                state.authUser = action.payload;
                state.isSigningUp = false;
            })
            .addCase(signup.rejected, (state) => {
                state.isSigningUp = false;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.isLoggingIn = true;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.authUser = action.payload;
                state.isLoggingIn = false;
            })
            .addCase(login.rejected, (state) => {
                state.isLoggingIn = false;
            })
            // Logout
            .addCase(logout.fulfilled, (state, action) => {
                state.authUser = action.payload; // null
                state.socket = null;
                state.onlineUsers = [];
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isUpdatingProfile = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.authUser = action.payload;
                state.isUpdatingProfile = false;
            })
            .addCase(updateProfile.rejected, (state) => {
                state.isUpdatingProfile = false;
            });
    },
});

export const { setSocket, setOnlineUsers } = authSlice.actions;
export default authSlice.reducer;
