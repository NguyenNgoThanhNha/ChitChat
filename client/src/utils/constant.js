export const HOST = import.meta.env.VITE_SERVER_URL;

export const AUTH_ROUTES = "/api/auth"
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/sign-up`
export const SIGNIN_ROUTE = `${AUTH_ROUTES}/sign-in`
export const GET_USER_INFO_ROUTE = `${AUTH_ROUTES}/get-info`
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`