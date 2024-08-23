export const createAuthSlice = (set) => (
    {
        userInfo: undefined,
        setUserInfo: (userInfo) => set({ userInfo }) // set xong return state
    }
)