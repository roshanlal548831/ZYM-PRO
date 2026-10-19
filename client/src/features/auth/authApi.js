import { apiSlice } from '../api/apiSlice.js'
import { clearUser, setUser } from './authSlice.js'

function setAuthenticatedUser(dispatch, user) {
  dispatch(setUser(user))
  dispatch(apiSlice.util.upsertQueryData('getCurrentUser', undefined, user))
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query({
      query: () => '/auth/me',
      transformResponse: (response) => response.data.user,
      providesTags: ['Session'],
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        const sessionVersion = getState().auth.sessionVersion
        try {
          const { data } = await queryFulfilled
          dispatch(setUser(data))
        } catch {
          const auth = getState().auth
          if (auth.sessionVersion === sessionVersion && !auth.user) dispatch(clearUser())
        }
      },
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (response) => response.data.user,
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        const sessionVersion = getState().auth.sessionVersion
        try { setAuthenticatedUser(dispatch, (await queryFulfilled).data) }
        catch { if (getState().auth.sessionVersion === sessionVersion) dispatch(clearUser()) }
      },
    }),
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (response) => response.data,
    }),
    verifyEmail: builder.mutation({
      query: (body) => ({ url: '/auth/verify-email-otp', method: 'POST', body }),
      transformResponse: (response) => response.data.user,
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        const sessionVersion = getState().auth.sessionVersion
        try { setAuthenticatedUser(dispatch, (await queryFulfilled).data) }
        catch { if (getState().auth.sessionVersion === sessionVersion) dispatch(clearUser()) }
      },
    }),
    resendOtp: builder.mutation({ query: (body) => ({ url: '/auth/resend-otp', method: 'POST', body }) }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(clearUser())
          dispatch(apiSlice.util.resetApiState())
        } catch {
          dispatch(clearUser())
          dispatch(apiSlice.util.resetApiState())
        }
      },
    }),
    forgotPassword: builder.mutation({ query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }) }),
    verifyResetOtp: builder.mutation({ query: (body) => ({ url: '/auth/verify-reset-otp', method: 'POST', body }) }),
    resetPassword: builder.mutation({ query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }) }),
    changePassword: builder.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'PATCH', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(clearUser())
          dispatch(apiSlice.util.resetApiState())
        } catch { /* Keep the session when the server rejects the password change. */ }
      },
    }),
    resendPhoneOtp: builder.mutation({ query: () => ({ url: '/auth/resend-phone-otp', method: 'POST', body: {} }) }),
    verifyPhoneOtp: builder.mutation({ query: (body) => ({ url: '/auth/verify-phone-otp', method: 'POST', body }) }),
  }),
})

export const {
  useGetCurrentUserQuery, useLoginMutation, useRegisterMutation, useVerifyEmailMutation,
  useResendOtpMutation, useLogoutMutation, useForgotPasswordMutation, useVerifyResetOtpMutation,
  useResetPasswordMutation, useChangePasswordMutation, useResendPhoneOtpMutation, useVerifyPhoneOtpMutation,
} = authApi
