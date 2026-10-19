import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../features/api/apiSlice.js'
import authReducer from '../features/auth/authSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
})