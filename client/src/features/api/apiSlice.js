import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getCsrfToken, setCsrfToken } from './csrfToken.js'
import { API_BASE_URL } from './apiBaseUrl.js'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
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
