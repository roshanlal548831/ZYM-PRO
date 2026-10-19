import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

function readCookie(name) {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`))
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : ''
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
    credentials: 'include',
    prepareHeaders(headers, { type }) {
      if (type !== 'query') {
        const csrfToken = readCookie('csrfToken')
        if (csrfToken) headers.set('X-CSRF-Token', csrfToken)
      }
      return headers
    },
  }),
  tagTypes: ['Session', 'Plans', 'Trainers', 'Enquiries', 'Memberships', 'Payments', 'Workouts', 'Members', 'Dashboard', 'Reports', 'Notifications'],
  endpoints: () => ({}),
})