import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Dumbbell, LogOut, Menu, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useLogoutMutation } from '../../features/auth/authApi.js'
import { Button } from '../common/UI.jsx'

const links = [['Plans', '/plans'], ['Coaches', '/trainers'], ['About', '/about'], ['Contact', '/contact']]

export default function PublicLayout() {
  const [open, setOpen] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const [logout, { isLoading }] = useLogoutMutation()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await logout().unwrap(); setOpen(false); navigate('/') } catch { /* Keep the session visible when logout fails. */ }
  }

  return <div className="min-h-screen bg-white text-neutral-950">
    <div className="border-b border-neutral-200 bg-neutral-950 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[.12em] text-white">Strong habits. Real progress. Your first visit is on us.</div>
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2" aria-label="Zym home"><span className="grid size-9 place-items-center bg-lime-300"><Dumbbell size={20} /></span><span className="display-font text-2xl font-bold uppercase">ZYM<span className="text-neutral-400">.</span></span></Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">{links.map(([label, path]) => <NavLink key={path} to={path} className={({ isActive }) => `text-sm font-semibold transition hover:text-neutral-500 ${isActive ? 'text-neutral-950' : 'text-neutral-600'}`}>{label}</NavLink>)}</nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? <><Link className="text-sm font-bold" to={user.role === 'admin' ? '/admin' : '/app'}>{user.role === 'admin' ? 'Admin' : 'My account'}</Link><Button variant="outline" onClick={handleLogout} disabled={isLoading}>Log out</Button></> : <><Link className="text-sm font-bold" to="/login">Log in</Link><Link to="/plans" className="inline-flex min-h-11 items-center gap-2 bg-lime-300 px-4 text-sm font-bold hover:bg-lime-200">Join Zym <ArrowUpRight size={16} /></Link></>}
        </div>
        <button className="grid size-11 place-items-center md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav className="grid gap-1 border-t border-neutral-200 bg-white p-4 md:hidden" aria-label="Mobile navigation">{links.map(([label, path]) => <NavLink onClick={() => setOpen(false)} key={path} to={path} className="p-3 text-sm font-semibold">{label}</NavLink>)}{user ? <><Link onClick={() => setOpen(false)} className="p-3 text-sm font-semibold" to={user.role === 'admin' ? '/admin' : '/app'}>Dashboard</Link><div className="mt-2 border-t border-neutral-200 pt-3"><Button variant="dark" className="w-full justify-center" onClick={handleLogout} disabled={isLoading}><LogOut size={16} />{isLoading ? 'Logging out…' : 'Log out'}</Button></div></> : <Link onClick={() => setOpen(false)} className="p-3 text-sm font-semibold" to="/login">Log in</Link>}</nav>}
    </header>
    <main><Outlet /></main>
    <footer className="bg-neutral-950 text-white">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div><Link to="/" className="display-font text-3xl font-bold">ZYM.</Link><p className="mt-3 max-w-sm text-sm leading-6 text-neutral-400">Training for the life you want to live. Thoughtful coaching, honest progress, no shortcuts.</p></div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Explore</p><div className="mt-4 grid gap-3 text-sm">{links.map(([label, path]) => <Link key={path} to={path} className="hover:text-lime-300">{label}</Link>)}</div></div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Visit</p><p className="mt-4 text-sm leading-6 text-neutral-300">Gym address placeholder<br />Mon-Sat, 6:00 AM-10:00 PM</p><a className="mt-3 inline-block text-sm underline decoration-lime-300 underline-offset-4" href="mailto:hello@zym.fit">hello@zym.fit</a></div>
      </div>
      <div className="border-t border-white/15 px-5 py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} Zym Fitness. Train well.</div>
    </footer>
  </div>
}
