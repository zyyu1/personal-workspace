import { NavLink } from 'react-router-dom'
const tabs = ['Overview', 'Literature', 'Tasks', 'Experiments', 'Files', 'Timeline', 'Submissions']
export function ResearchTabs({ projectId }: { projectId: string }) {
  return <nav className="research-tabs" aria-label="Research project sections">{tabs.map(tab => <NavLink key={tab} to={`/research/projects/${projectId}/${tab.toLowerCase()}`} className={({isActive}) => isActive ? 'active' : ''}>{tab}</NavLink>)}</nav>
}
