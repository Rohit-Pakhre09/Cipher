import axios from "axios";

const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY || "cipher_access_token";

export const getStoredAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const setStoredAccessToken = (token) => {
    if (!token) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
};
export const clearStoredAccessToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY);

export const API = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    withCredentials: true,
});

API.interceptors.request.use((config) => {
    const token = getStoredAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
