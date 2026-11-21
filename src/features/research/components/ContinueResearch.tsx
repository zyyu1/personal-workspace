import { BookOpenText, CheckCircle2, ExternalLink, FileText, Folder, GitBranch, Play } from 'lucide-react'
import type { ContinueContext } from '../types'
import type { InspectorItem } from '../../../components/Inspector'
import { SectionCard } from './SectionCard'

export function ContinueResearch({ context, onInspect, onResume }: { context: ContinueContext; onInspect: (item: InspectorItem) => void; onResume: () => void }) {
  const resources = [
    { icon: FileText, label: context.note?.title ?? 'No recent note', state: context.note?.available ? 'Available' : 'Device offline', onClick: () => context.note && onInspect({kind:'resource', data:{title:context.note.title, state:context.note.available ? 'Available' : 'Unavailable'}}) },
    { icon: BookOpenText, label: context.paper?.title ?? 'No recent paper', state: context.paper?.zoteroState ?? 'Not linked', onClick: () => context.paper && onInspect({kind:'paper', data:context.paper}) },
    { icon: GitBranch, label: context.repository?.label ?? 'No repository', state: context.repository?.state ?? 'Not connected', onClick: () => onInspect({kind:'resource', data:{title:context.repository?.label ?? 'GitHub repository', state:context.repository?.state ?? 'Not connected'}}) },
    { icon: Folder, label: context.localFolder?.label ?? 'No local folder', state: context.localFolder?.available ? 'Available' : 'Device offline', onClick: () => onInspect({kind:'resource', data:{title:context.localFolder?.label ?? 'Local folder', state:context.localFolder?.available ? 'Available' : 'Unavailable'}}) },
  ]
  return <SectionCard className="continue-card" eyebrow="Return to context" title="Continue research" action={<button className="primary-button" onClick={onResume} disabled={!context.lastTask}><Play size={16}/> Resume</button>}>
    {context.lastTask ? <div className="resume-focus"><div className="resume-icon"><CheckCircle2/></div><div><span className="eyebrow">Last active task</span><button className="text-button resume-title" onClick={() => onInspect({kind:'task', data:context.lastTask!})}>{context.lastTask.title}</button><p>{context.nextAction}</p></div></div> : <div className="empty-state"><h3>No resumable context yet</h3><p>{context.nextAction}</p></div>}
    <div className="context-grid">{resources.map(({icon:Icon,label,state,onClick}) => <button className="context-item" key={label} onClick={onClick} disabled={label.startsWith('No ')}><span className="context-icon"><Icon size={18}/></span><span><strong>{label}</strong><small>{state}</small></span>{state === 'Available' || state === 'connected' ? <ExternalLink size={15}/> : <span className="state-indicator"/>}</button>)}</div>
    <p className="context-note">Resume restores this Workspace context only. It does not recreate an editor cursor or external application runtime.</p>
  </SectionCard>
}
