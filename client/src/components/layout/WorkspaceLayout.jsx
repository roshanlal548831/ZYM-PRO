import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Activity, Bell, CreditCard, Dumbbell, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useLogoutMutation } from '../../features/auth/authApi.js'
import { Button } from '../common/UI.jsx'

const memberLinks = [
  { label: 'Overview', to: '/app', icon: LayoutDashboard },
  { label: 'My profile', to: '/app/profile', icon: Users },
  { label: 'Memberships', to: '/app/memberships', icon: Activity },
  { label: 'Payments', to: '/app/payments', icon: CreditCard },
  { label: 'Workout plans', to: '/app/workouts', icon: Dumbbell },
  { label: 'Security', to: '/app/security', icon: Bell },
]
const adminLinks = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard },
  { label: 'Members', to: '/admin/members', icon: Users },
  { label: 'Memberships', to: '/admin/memberships', icon: Activity },
  { label: 'Plans', to: '/admin/plans', icon: CreditCard },
  { label: 'Payments', to: '/admin/payments', icon: CreditCard },
  { label: 'Trainers', to: '/admin/trainers', icon: Users },
  { label: 'Enquiries', to: '/admin/enquiries', icon: Bell },
  { label: 'Workouts', to: '/admin/workouts', icon: Dumbbell },
  { label: 'Expiring soon', to: '/admin/expiring', icon: Activity },
  { label: 'Payment reports', to: '/admin/reports', icon: CreditCard },
  { label: 'Notifications', to: '/admin/notifications', icon: Bell },
  { label: 'Profile & security', to: '/admin/profile', icon: Users },
]

export default function WorkspaceLayout({ admin = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const [logout, { isLoading }] = useLogoutMutation()
  const navigate = useNavigate()
  const links = admin ? adminLinks : memberLinks
  async function handleLogout() {
    try { await logout().unwrap() } catch { /* The client session is cleared even when the server session is unavailable. */ }
    navigate('/login')
  }

  return <div className="min-h-screen bg-neutral-100 text-neutral-950 md:flex">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[278px] flex-col overflow-y-auto border-r border-neutral-800 bg-neutral-950 text-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-6"><Link to={admin ? '/admin' : '/app'} className="display-font text-2xl font-bold">ZYM<span className="text-lime-300">.</span></Link><button className="md:hidden" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X /></button></div>
      <p className="px-6 pb-3 pt-7 text-[10px] font-bold uppercase tracking-[.16em] text-neutral-500">{admin ? 'Management' : 'Your training'}</p>
      <nav className="grid gap-1 px-3 pb-4" aria-label={admin ? 'Admin navigation' : 'Member navigation'}>{links.map(({ label, to, icon: Icon }) => <NavLink end={to === '/app' || to === '/admin'} onClick={() => setMenuOpen(false)} key={to} to={to} className={({ isActive }) => `flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm font-medium transition ${isActive ? 'border-lime-300 bg-white/10 text-white' : 'border-transparent text-neutral-400 hover:bg-white/5 hover:text-white'}`}><Icon size={17} />{label}</NavLink>)}{admin && <Button variant="lime" className="mt-2 w-full justify-center md:hidden" onClick={handleLogout} disabled={isLoading}><LogOut size={16} />{isLoading ? 'Signing out…' : 'Sign out'}</Button>}</nav>
      <div className="mt-auto border-t border-white/10 p-4"><div className="mb-3 px-2"><p className="truncate text-sm font-semibold">{user?.name || 'Zym member'}</p><p className="truncate text-xs text-neutral-500">{user?.email}</p></div><Button variant="quiet" className="hidden w-full justify-start text-neutral-300 hover:bg-white/10 hover:text-white md:inline-flex" onClick={handleLogout} disabled={isLoading}><LogOut size={16} />Sign out</Button></div>
    </aside>
    {menuOpen && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMenuOpen(false)} />}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
        <div className="flex h-[72px] items-center justify-between px-4 md:px-8"><button aria-label="Open navigation" className="grid size-10 place-items-center md:hidden" onClick={() => setMenuOpen(true)}><Menu /></button><p className="text-xs font-bold uppercase tracking-[.12em] text-neutral-500">{admin ? 'Zym operations' : 'Member area'}</p><Link to="/" className="text-sm font-bold">Public site <span aria-hidden="true">↗</span></Link></div>
      </header>
      <main className="mx-auto max-w-[1440px] p-4 md:p-8"><Outlet /></main>
    </div>
  </div>
}
