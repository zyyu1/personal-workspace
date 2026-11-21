import { BarChart3 } from 'lucide-react'
import { SectionCard } from './SectionCard'
import type { TimeEntry } from '../types'
import { formatDurationSeconds, timeEntrySeconds } from '../../../utils/timeDuration'
export function TimeInvestment({ entries }: { entries: TimeEntry[] }) {
  const total = entries.reduce((sum, entry) => sum + timeEntrySeconds(entry), 0)
  const max = Math.max(...entries.map(timeEntrySeconds), 1)
  return <SectionCard title="Time investment" eyebrow="Actual time entries" action={<button className="icon-button" aria-label="Open time tracking" disabled title="Time Tracking module is outside this increment"><BarChart3/></button>}>
    {entries.length ? <><div className="time-total"><strong>{formatDurationSeconds(total)}</strong><span>This week</span></div><div className="time-bars" aria-label="Recent time distribution">{entries.map(e => <div key={e.id} className="time-column"><span className="bar" style={{height:`${Math.max(18,(timeEntrySeconds(e)/max)*100)}%`}} title={formatDurationSeconds(timeEntrySeconds(e),{includeSeconds:true})}/><small>{new Date(e.date+'T12:00:00').toLocaleDateString('en',{weekday:'short'})}</small></div>)}</div></> : <div className="empty-state compact"><h3>No tracked time</h3><p>Start the global timer or add a TimeEntry to build this view.</p></div>}
  </SectionCard>
}
