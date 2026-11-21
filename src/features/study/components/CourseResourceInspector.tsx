import { useState } from 'react'
import { BookCheck, Clock3, ExternalLink, ListPlus } from 'lucide-react'
import { InspectorShell } from '../../../components/InspectorShell'
import type { CourseMaterialEntry, CourseMaterialSource } from '../types'
import type { WorkspaceResource } from '../../../services/globalResourceService'

export function CourseResourceInspector({resource,entry,source,onClose,onMark,onCreateTask,onStartTimer,onOpen}:{resource:WorkspaceResource;entry?:CourseMaterialEntry;source?:CourseMaterialSource;onClose:()=>void;onMark:(state:'studied'|'reviewed')=>void;onCreateTask:()=>void;onStartTimer:()=>void;onOpen:()=>Promise<void>}){
  const canOpen=resource.byteAvailability==='available-provider'&&Boolean(resource.url)
  const [opening,setOpening]=useState(false),[openError,setOpenError]=useState('')
  const open=async()=>{setOpening(true);setOpenError('');try{await onOpen()}catch(reason){setOpenError(reason instanceof Error?reason.message:'Unable to open the original')}finally{setOpening(false)}}
  return <InspectorShell title={resource.title} eyebrow="Course resource" label="Course resource inspector" onClose={onClose}>
    <div className="study-inspector-status"><span className="tag">Metadata: {resource.metadataSync}</span><span className="tag">Bytes: {resource.byteAvailability}</span></div>
    <dl className="study-inspector-facts"><div><dt>Source</dt><dd>{source?.label??resource.originKind}</dd></div><div><dt>Relative path</dt><dd>{entry?.relativePath??'Existing global resource'}</dd></div><div><dt>Classification</dt><dd>{entry?.classification??resource.resourceKind}</dd></div><div><dt>Size</dt><dd>{resource.size??'Unknown'}</dd></div></dl>
    <div className="inspector-actions"><button className="primary-button" disabled={!canOpen||opening} onClick={()=>void open()} title={canOpen?'Open verified provider URL':'Re-select the source on this device before opening'}><ExternalLink size={15}/>{opening?'Opening…':'Open original'}</button><button className="secondary-button" onClick={onCreateTask}><ListPlus size={15}/>Create study task</button><button className="secondary-button" onClick={onStartTimer}><Clock3 size={15}/>Start timer</button></div>{openError&&<p className="field-error" role="alert">{openError}</p>}
    <section className="inspector-section"><span className="eyebrow">Learning progress</span><div className="inspector-actions"><button className="secondary-button" onClick={()=>onMark('studied')}><BookCheck size={15}/>Mark studied</button><button className="secondary-button" onClick={()=>onMark('reviewed')}>Mark reviewed</button></div><p className="helper">Manual progress only. Opening a file never marks it learned.</p></section>
    <section className="inspector-section"><span className="eyebrow">Device capability</span><p>{canOpen?'A verified browser provider URL is available.':'The index is preserved, but this browser has no persistent byte permission. Re-select the folder or ZIP to access content.'}</p><button className="secondary-button" disabled>Make available on other devices · Managed storage unavailable</button></section>
  </InspectorShell>
}
