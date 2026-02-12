import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./chatSlice";
import authReducer from "./authSlice";
import themeReducer from "./themeSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['auth/setSocket'],
                ignoredPaths: ['auth.socket'],
            },
        }),
});
