import { useState, type ReactNode } from 'react'
import { BookOpen, BriefcaseBusiness, CalendarDays, CheckSquare, Clock3, FolderKanban, LayoutDashboard, Menu, Search, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const navigation = [
  [LayoutDashboard, 'Dashboard'], [BookOpen, 'Study'], [FolderKanban, 'Research'],
  [BriefcaseBusiness, 'Work'], [CalendarDays, 'Calendar'], [CheckSquare, 'Tasks'], [FolderKanban, 'Resources'],
] as const

export function AppShell({ children, inspector, timer }: { children: ReactNode; inspector?: ReactNode; timer: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false)
  const location=useLocation(),navigate=useNavigate()
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`} aria-label="Global navigation">
      <div className="brand"><span className="brand-mark">P</span><span>Personal Workspace</span></div>
      <nav>{navigation.map(([Icon, label]) => {const enabled=['Study','Research','Resources','Calendar','Tasks'].includes(label),active=label==='Resources'?location.pathname==='/resources':label==='Calendar'?location.pathname==='/calendar':label==='Tasks'?location.pathname==='/tasks':label==='Study'?location.pathname.startsWith('/study'):label==='Research'?location.pathname.startsWith('/research'):false;return <button className={active?'nav-item active':'nav-item'} key={label} disabled={!enabled} title={!enabled?'Not implemented in this increment':label} aria-current={active?'page':undefined} onClick={()=>{navigate(label==='Resources'?'/resources':label==='Calendar'?'/calendar':label==='Tasks'?'/tasks':label==='Study'?'/study/courses':'/research/projects/adaptive-agents/overview');setMobileNav(false)}}><Icon size={18}/><span>{label}</span></button>})}</nav>
      {location.pathname.startsWith('/research')&&<div className="research-shortcuts"><span>Research</span><button className={location.pathname==='/research/venues'?'active':''} onClick={()=>{navigate('/research/venues');setMobileNav(false)}}>Venue Explorer</button><button className={location.pathname.includes('/submissions')?'active':''} onClick={()=>{navigate('/research/projects/adaptive-agents/submissions');setMobileNav(false)}}>Submissions</button></div>}
      <div className="sidebar-foot"><span className="status-dot"/>Demo data · local-first</div>
    </aside>
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>} 
    <div className="workspace">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label={mobileNav ? 'Close menu' : 'Open menu'} onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X/> : <Menu/>}</button>
        <div className="search"><Search size={17}/><span>Search projects, tasks, papers…</span><kbd>⌘ K</kbd></div>
        <button className="quick-add" disabled title="Quick Add is outside this increment">Add new</button>
      </header>
      <div className={`content-frame ${inspector ? 'with-inspector' : ''}`}>
        <main className="main-content">{children}</main>
        {inspector}
      </div>
    </div>
    {timer}
  </div>
}

export function MiniTimer({ running, label, seconds, busy, onToggle, onFinish, onDiscard }: { running?: boolean; label?: string; seconds: number; busy?:boolean; onToggle: () => void; onFinish: () => void; onDiscard:()=>void }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return <div className={`mini-timer ${running ? 'running' : ''}`}>
    <div><span className="eyebrow">Focus timer</span><strong>{label ?? 'No active task'}</strong></div>
    <time>{mm}:{ss}</time>
    <button className="timer-toggle" onClick={onToggle} disabled={!label||busy}><Clock3 size={16}/>{!label?'Start':running?'Pause':'Resume'}</button>
    {label&&<button className="timer-stop" onClick={onFinish} disabled={busy}>Finish & save</button>}
    {label&&<button className="timer-discard" onClick={onDiscard} disabled={busy}>Discard</button>}
  </div>
}
