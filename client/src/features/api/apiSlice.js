import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getCsrfToken, setCsrfToken } from './csrfToken.js'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  credentials: 'include',
  prepareHeaders(headers, { type }) {
    if (type !== 'query') {
      const csrfToken = getCsrfToken()
      if (csrfToken) headers.set('X-CSRF-Token', csrfToken)
    }
    return headers
  },
})

async function baseQueryWithCsrf(args, api, extraOptions) {
  const url = typeof args === 'string' ? args : args.url
  if (api.type === 'mutation' && url !== '/auth/csrf-token' && !getCsrfToken()) {
    const csrfResult = await rawBaseQuery('/auth/csrf-token', api, extraOptions)
    const token = csrfResult.data?.data?.csrfToken
    if (token) setCsrfToken(token)
  }

  const result = await rawBaseQuery(args, api, extraOptions)
  const token = result.data?.data?.csrfToken
  if (token) setCsrfToken(token)
  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithCsrf,
  tagTypes: ['Session', 'Plans', 'Trainers', 'Enquiries', 'Memberships', 'Payments', 'Workouts', 'Members', 'Dashboard', 'Reports', 'Notifications'],
  endpoints: () => ({}),
})
