import { create } from "zustand";

export const useTheme = create((set) => ({
    theme: localStorage.getItem("cipher-theme") || "dim",
    setTheme: (theme) => {
        localStorage.setItem("cipher-theme", theme);
        set({ theme });
    },
}));