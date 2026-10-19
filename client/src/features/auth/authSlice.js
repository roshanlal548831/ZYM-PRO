import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, sessionVersion: 0 },
  reducers: {
    setUser(state, action) {
      state.user = action.payload ?? null
      state.sessionVersion += 1
    },
    clearUser(state) {
      state.user = null
      state.sessionVersion += 1
    },
  },
})

export const { setUser, clearUser } = authSlice.actions
export default authSlice.reducer