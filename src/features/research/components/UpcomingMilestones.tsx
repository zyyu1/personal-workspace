import { CalendarClock, ShieldCheck, ShieldQuestion } from 'lucide-react'
import type { ProjectMilestone } from '../types'
import { SectionCard } from './SectionCard'
export function UpcomingMilestones({ milestones }: { milestones: ProjectMilestone[] }) {
  return <SectionCard title="Upcoming milestones" eyebrow="Deadlines & checkpoints">
    {milestones.length ? <div className="milestone-list">{milestones.map(m => <div className="milestone-row" key={m.id}><span className="milestone-icon"><CalendarClock size={17}/></span><div><strong>{m.title}</strong><small>{m.date ?? 'Date not verified'}{m.timezone ? ` · ${m.timezone}` : ''} · {m.kind}</small></div><span className={`verification ${m.verification}`}>{m.verification === 'verified' ? <ShieldCheck size={14}/> : <ShieldQuestion size={14}/>} {m.verification}</span></div>)}</div> : <div className="empty-state compact"><h3>No upcoming milestones</h3><p>Add internal checkpoints or a source-verified venue deadline.</p></div>}
  </SectionCard>
}
