import { useEffect, useState } from 'react'
import { BookOpenCheck, Clock3, ExternalLink, FilePlus2, FileText, Link2Off, MonitorDown, NotebookPen, Plus, X } from 'lucide-react'
import type { Priority, ResearchTask } from '../../types'
import type { LiteraturePaper, ReadingStatus } from '../types'

type EditableStatus = Exclude<ReadingStatus,'not-tracked'>

export function PaperInspector({paper,projectId,onClose,onUpdate,onCreateTask,onCreateExperiment,onStartTimer,onUnlink}:{
  paper:LiteraturePaper; projectId?:string; onClose:()=>void;
  onUpdate:(values:{readingStatus?:EditableStatus;priority?:Priority;note?:string})=>Promise<void>;
  onCreateTask:()=>Promise<void>; onCreateExperiment?:()=>Promise<void>; onStartTimer:(label:string)=>void; onUnlink:()=>Promise<void>;
}) {
  const state=projectId?paper.projectStates[projectId]:undefined
  const [note,setNote]=useState(state?.note??'')
  const [noteOpen,setNoteOpen]=useState(false)
  const [saving,setSaving]=useState(false)
  const [taskCreated,setTaskCreated]=useState(false)
  const [confirmUnlink,setConfirmUnlink]=useState(false)
  useEffect(()=>{setNote(state?.note??'');setNoteOpen(false);setTaskCreated(false);setConfirmUnlink(false)},[paper.stableId,state?.note])
  const save=async(values:{readingStatus?:EditableStatus;priority?:Priority;note?:string})=>{setSaving(true);await onUpdate(values);setSaving(false)}
  const markdown=paper.resources.find(resource=>resource.kind==='markdown'&&resource.availability==='available')
  const pdf=paper.resources.find(resource=>resource.kind==='pdf')
  return <aside className="paper-inspector" aria-label="Paper inspector">
    <header className="paper-inspector-head"><div><span className="eyebrow">{paper.source} · {paper.syncState}</span><h2>{paper.title||'Untitled record'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close paper inspector"><X/></button></header>
    <section className="inspector-section"><h3>Bibliographic metadata</h3><dl className="paper-metadata"><dt>Authors</dt><dd>{paper.authors.length?paper.authors.join(', '):'Unavailable'}</dd><dt>Year</dt><dd>{paper.year??'Unavailable'}</dd><dt>Publication</dt><dd>{paper.publication??'Unavailable'}</dd><dt>DOI</dt><dd>{paper.doi??'Unavailable'}</dd><dt>arXiv</dt><dd>{paper.arxiv??'Unavailable'}</dd></dl>{paper.url&&<a className="inline-link" href={paper.url} target="_blank" rel="noreferrer">Open source URL <ExternalLink size={14}/></a>}<p className="readonly-note">Zotero bibliographic fields are read-only.</p></section>
    <section className="inspector-section"><h3>Project reading state</h3>{projectId?<div className="inspector-fields"><label className="field"><span>Reading status</span><select aria-label="Project reading status" value={state?.readingStatus??'to-read'} onChange={e=>save({readingStatus:e.target.value as EditableStatus})}><option value="to-read">To Read</option><option value="reading">Reading</option><option value="read">Read</option><option value="on-hold">On Hold</option></select></label><label className="field"><span>Priority</span><select aria-label="Project paper priority" value={state?.priority??'medium'} onChange={e=>save({priority:e.target.value as Priority})}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div>:<div className="empty-state compact"><h3>Not tracked</h3><p>Open this paper from a project to manage project-specific reading state.</p></div>}{saving&&<span className="save-state">Saving Workspace state…</span>}</section>
    <section className="inspector-section"><h3>Primary actions</h3><div className="paper-actions">
      <button className="secondary-button" disabled title="Zotero is not connected"><BookOpenCheck/> Zotero unavailable</button>
      <button className="secondary-button" disabled={!pdf?.url} title={paper.pdfAvailability==='windows-only'?'Available only on Research-PC':paper.pdfAvailability==='missing'?'No PDF attachment found':'No browser-accessible PDF'}><MonitorDown/> {paper.pdfAvailability==='windows-only'?'PDF on Windows':paper.pdfAvailability==='missing'?'PDF missing':'Open PDF'}</button>
      <button className="secondary-button" disabled={!markdown} onClick={()=>setNoteOpen(true)}><NotebookPen/> {markdown?'Open note':'No note'}</button>
      <button className="secondary-button" disabled={!projectId||taskCreated} onClick={async()=>{await onCreateTask();setTaskCreated(true)}}><Plus/> {taskCreated?'Task created':'Create task'}</button>
      <button className="secondary-button" disabled={!projectId||!onCreateExperiment} onClick={()=>void onCreateExperiment?.()}><FilePlus2/> Create experiment</button>
      <button className="primary-button" onClick={()=>onStartTimer(`Reading · ${paper.title}`)}><Clock3/> Start timer</button>
    </div></section>
    <section className="inspector-section" id="paper-note"><h3>Related notes</h3>{projectId?<><textarea className="paper-note" aria-label="Project research note" value={note} onChange={e=>setNote(e.target.value)} onBlur={()=>{if(note!==state?.note)save({note})}} placeholder="Add a note for this project…"/>{noteOpen&&markdown&&<div className="resource-callout"><FileText/><span><strong>{markdown.label}</strong><small>Workspace preview · source file unchanged</small></span></div>}</>:<p className="muted">Project notes require project context.</p>}</section>
    <section className="inspector-section"><h3>Related tasks</h3>{paper.relatedTasks.length?<div className="related-list">{paper.relatedTasks.map((task:ResearchTask)=><div key={task.id}><FilePlus2/><span><strong>{task.title}</strong><small>{task.status} · shared Task model</small></span></div>)}</div>:<p className="muted">No related tasks.</p>}</section>
    <section className="inspector-section"><h3>Related projects</h3><div className="related-list">{paper.relatedProjects.map(project=><div key={project.id}><BookOpenCheck/><span><strong>{project.name}</strong><small>{paper.projectStates[project.id]?.readingStatus??'Not tracked'} · independent state</small></span></div>)}</div>{projectId&&state&&(confirmUnlink?<div className="unlink-confirm"><p>Remove only this project link? The Zotero item, notes and tasks remain.</p><button className="secondary-button" onClick={()=>setConfirmUnlink(false)}>Cancel</button><button className="danger-button" onClick={onUnlink}>Remove link</button></div>:<button className="text-button danger-text" onClick={()=>setConfirmUnlink(true)}><Link2Off/> Remove from this project</button>)}</section>
    <section className="inspector-section"><h3>Resources</h3>{paper.resources.length?<div className="related-list">{paper.resources.map(resource=><div key={resource.id}><FileText/><span><strong>{resource.label}</strong><small>{resource.kind} · {resource.availability}{resource.device?` · ${resource.device}`:''}</small></span></div>)}</div>:<p className="muted">No attachments indexed.</p>}</section>
    <section className="inspector-section sync-info"><h3>Sync information</h3><dl><dt>Stable ID</dt><dd>{paper.libraryId} + {paper.itemKey}</dd><dt>Source</dt><dd>{paper.source}</dd><dt>Sync state</dt><dd>{paper.syncState}</dd><dt>Updated</dt><dd>{paper.updatedAt?new Date(paper.updatedAt).toLocaleString():'Unknown'}</dd><dt>PDF</dt><dd>{paper.pdfAvailability}</dd></dl></section>
  </aside>
}
