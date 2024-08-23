import { HOST } from "@/utils/constant";
import axios from "axios";


export const apiClient = axios.create({
    baseURL: HOST,
    headers: {
        "Content-Type": "application/json"
    }
})