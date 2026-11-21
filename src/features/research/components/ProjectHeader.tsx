import { Focus, MoreHorizontal, Pin } from 'lucide-react'
import type { ResearchProject, ResearchTask } from '../types'

export function ProjectHeader({ project, onFocus }: { project: ResearchProject; onFocus: (task?: ResearchTask) => void }) {
  return <>
    <div className="breadcrumbs">Research <span>/</span> Projects <span>/</span> {project.name}</div>
    <header className="project-header">
      <div className="project-title-block"><div className="project-kicker"><span className="status-pill">{project.status}</span>{project.pinned && <span className="pinned"><Pin size={13}/> Pinned</span>}</div><h1>{project.name}</h1><p>{project.summary}</p><div className="tag-row">{project.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div></div>
      <div className="project-actions"><button className="secondary-button"><MoreHorizontal size={17}/> Settings</button><button className="primary-button" onClick={() => onFocus(project.tasks[0])}><Focus size={17}/> Focus</button></div>
    </header>
  </>
}
