import { BarChart3 } from 'lucide-react'
import { SectionCard } from './SectionCard'
export function TimeInvestment({ entries }: { entries: Array<{id:string;date:string;minutes:number}> }) {
  const total = entries.reduce((sum, entry) => sum + entry.minutes, 0)
  const max = Math.max(...entries.map(e => e.minutes), 1)
  return <SectionCard title="Time investment" eyebrow="Actual time entries" action={<button className="icon-button" aria-label="Open time tracking" disabled title="Time Tracking module is outside this increment"><BarChart3/></button>}>
    {entries.length ? <><div className="time-total"><strong>{Math.floor(total/60)}h {total%60}m</strong><span>This week</span></div><div className="time-bars" aria-label="Recent time distribution">{entries.map(e => <div key={e.id} className="time-column"><span className="bar" style={{height:`${Math.max(18,(e.minutes/max)*100)}%`}} title={`${e.minutes} minutes`}/><small>{new Date(e.date+'T12:00:00').toLocaleDateString('en',{weekday:'short'})}</small></div>)}</div></> : <div className="empty-state compact"><h3>No tracked time</h3><p>Start the global timer or add a TimeEntry to build this view.</p></div>}
  </SectionCard>
}
