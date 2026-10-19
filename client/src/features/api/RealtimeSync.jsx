import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import { apiSlice } from './apiSlice.js'
import { API_BASE_URL } from './apiBaseUrl.js'
import { clearUser } from '../auth/authSlice.js'

const PUBLIC_TAGS = ['Plans', 'Trainers']
const MEMBER_TAGS = [...PUBLIC_TAGS, 'Session', 'Memberships', 'Payments', 'Workouts']
const ADMIN_TAGS = [...MEMBER_TAGS, 'Enquiries', 'Members', 'Dashboard', 'Reports', 'Notifications']
const ALLOWED_TAGS = new Set(ADMIN_TAGS)

function tagsForUser(role) {
  if (role === 'admin') return ADMIN_TAGS
  if (role === 'member') return MEMBER_TAGS
  return PUBLIC_TAGS
}

export default function RealtimeSync() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const userId = user?.id || user?._id || null
  const role = user?.role || null

  useEffect(() => {
    const socket = io(new URL(API_BASE_URL, window.location.origin).origin, { withCredentials: true })
    let hasConnected = false

    function invalidate(tags) {
      if (!Array.isArray(tags)) return
      const safeTags = tags.filter((tag) => ALLOWED_TAGS.has(tag)).map((type) => ({ type }))
      if (safeTags.length) dispatch(apiSlice.util.invalidateTags(safeTags))
    }

    socket.on('connect', () => {
      if (hasConnected) invalidate(tagsForUser(role))
      hasConnected = true
    })
    socket.on('data:changed', ({ tags } = {}) => invalidate(tags))
    socket.on('session:revoked', () => {
      dispatch(clearUser())
      dispatch(apiSlice.util.resetApiState())
    })
    socket.on('connect_error', (error) => {
      if (userId && error.message === 'Authentication required') {
        dispatch(clearUser())
        dispatch(apiSlice.util.resetApiState())
      }
    })

    return () => socket.disconnect()
  }, [dispatch, userId, role])

  return null
}
