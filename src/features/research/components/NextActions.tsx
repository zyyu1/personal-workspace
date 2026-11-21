import type { ResearchTask } from '../types'
import { SectionCard } from './SectionCard'
export function NextActions({ tasks, onOpen }: { tasks: ResearchTask[]; onOpen: (task: ResearchTask) => void }) {
  return <SectionCard title="Next actions" eyebrow="Shared task model" action={<button className="text-button">View all</button>}>
    {tasks.length ? <div className="action-list">{tasks.slice(0,5).map(task => <button className="action-row" key={task.id} onClick={() => onOpen(task)}><span className={`task-check ${task.status}`}/><span className="action-main"><strong>{task.title}</strong><small>{task.stage}{task.dueDate ? ` · Due ${task.dueDate}` : ''}</small></span>{task.priority && <span className={`priority ${task.priority}`}>{task.priority}</span>}</button>)}</div> : <div className="empty-state compact"><h3>No next actions</h3><p>Create a shared task and assign this project as its primary context.</p><button className="secondary-button" disabled>Add task · coming soon</button></div>}
  </SectionCard>
}
