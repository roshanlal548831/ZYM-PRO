import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetCurrentUserQuery } from '../../features/auth/authApi.js'
import { LoadingState } from '../common/UI.jsx'

export function ProtectedRoute({ role }) {
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const { isLoading, isFetching } = useGetCurrentUserQuery()
  if (!user && (isLoading || isFetching)) return <LoadingState label="Checking your session" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />
  return <Outlet />
}

export function GuestRoute() {
  const user = useSelector((state) => state.auth.user)
  const { isLoading, isFetching } = useGetCurrentUserQuery()
  if (isLoading || isFetching) return <LoadingState label="Checking your session" />
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />
  return <Outlet />
}