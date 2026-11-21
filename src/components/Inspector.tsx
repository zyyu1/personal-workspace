import { ExternalLink, X } from 'lucide-react'
import type { LiteratureItem, ResearchTask } from '../features/research/types'
import { safeExternalUrl } from '../services/safeExternalUrl'

export type InspectorItem = { kind: 'task'; data: ResearchTask } | { kind: 'paper'; data: LiteratureItem } | { kind: 'resource'; data: { title: string; state: string } }

export function Inspector({ item, onClose, onStartTimer }: { item: InspectorItem; onClose: () => void; onStartTimer: (task: ResearchTask) => void }) {
  const safeZoteroUrl=item.kind==='paper'?safeExternalUrl(item.data.zoteroUrl):undefined
  return <aside className="inspector" aria-label="Context inspector">
    <div className="inspector-head"><span className="eyebrow">{item.kind} inspector</span><button className="icon-button" onClick={onClose} aria-label="Close inspector"><X/></button></div>
    {item.kind === 'task' && <>
      <h2>{item.data.title}</h2>
      <dl><dt>Status</dt><dd>{item.data.status}</dd><dt>Research stage</dt><dd>{item.data.stage}</dd><dt>Due date</dt><dd>{item.data.dueDate ?? 'No due date'}</dd><dt>Priority</dt><dd>{item.data.priority ?? 'Not set'}</dd></dl>
      <button className="primary-button full" onClick={() => onStartTimer(item.data)}>Start focus timer</button>
      <p className="helper">This task uses the shared Workspace Task model. Opening it here does not create a Research-only copy.</p>
    </>}
    {item.kind === 'paper' && <>
      <h2>{item.data.title}</h2><p>{item.data.authors} · {item.data.year}</p>
      <dl><dt>Reading status</dt><dd>{item.data.readingStatus}</dd><dt>Zotero</dt><dd>{item.data.zoteroState}</dd></dl>
      {safeZoteroUrl ? <a className="primary-button full" href={safeZoteroUrl} target="_blank" rel="noreferrer">Open in Zotero <ExternalLink size={16}/></a> : <button className="primary-button full" disabled>Zotero link unavailable</button>}
      <p className="helper">Bibliographic metadata can remain visible while the source PDF is unavailable.</p>
    </>}
    {item.kind === 'resource' && <><h2>{item.data.title}</h2><dl><dt>Availability</dt><dd>{item.data.state}</dd></dl><button className="primary-button full" disabled>Resource unavailable</button><p className="helper">Connect the authorized device or integration before opening this resource.</p></>}
  </aside>
}
