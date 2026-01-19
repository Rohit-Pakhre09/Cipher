import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./chatSlice";
import authReducer from "./authSlice";
import themeReducer from "./themeSlice";
import callReducer from "./callSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        theme: themeReducer,
        call: callReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['auth/setSocket'],
                ignoredPaths: ['auth.socket'],
            },
        }),
});
