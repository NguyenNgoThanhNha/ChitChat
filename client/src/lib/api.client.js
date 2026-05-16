import { HOST } from "@/utils/constant";
import axios from "axios";
import { clearAuthToken, getAuthToken } from "@/lib/authToken";

export const apiClient = axios.create({
    baseURL: HOST,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

apiClient.interceptors.request.use((config) => {
    const t = getAuthToken();
    if (t) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) clearAuthToken();
        return Promise.reject(err);
    }
);