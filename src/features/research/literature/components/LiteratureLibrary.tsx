import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CloudOff, Library, RefreshCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Priority } from '../../types'
import { LiteratureService } from '../services/literatureService'
import type { LiteratureFilters, LiteraturePaper, LiteratureSnapshot, ReadingStatus } from '../types'
import { CollectionNavigator, CollectionPicker } from './CollectionNavigator'
import { LiteratureToolbar } from './LiteratureToolbar'
import { PaperCards, PaperTable } from './PaperTable'
import { PaperInspector } from './PaperInspector'

const defaults:LiteratureFilters={query:'',collectionId:'all',readingStatus:'all',year:'all',priority:'all',pdfAvailability:'all',tag:'all'}

export function LiteratureLibrary({projectId,selectedPaperId,onSelectPaper,onStartTimer}:{projectId?:string;selectedPaperId?:string;onSelectPaper:(id?:string)=>void;onStartTimer:(label:string)=>void}) {
  const [snapshot,setSnapshot]=useState<LiteratureSnapshot>()
  const [filters,setFilters]=useState(defaults)
  const [collapsed,setCollapsed]=useState(false)
  const [error,setError]=useState<string>()
  const [offline,setOffline]=useState(false)
  const scrollRef=useRef<HTMLDivElement>(null)
  const listScroll=useRef(0)
  const load=()=>{setError(undefined);LiteratureService.getSnapshot().then(setSnapshot).catch(()=>setError('The literature adapter could not load this library.'))}
  useEffect(load,[])
  const papers=useMemo(()=>{
    if(!snapshot)return[]
    const q=filters.query.trim().toLowerCase()
    return snapshot.papers.filter(paper=>{
      const projectState=projectId?paper.projectStates[projectId]:undefined
      const reading=projectState?.readingStatus??'not-tracked'
      return (!projectId||Boolean(projectState)) && (filters.collectionId==='all'||paper.collectionIds.includes(filters.collectionId)) && (!q||[paper.title,paper.authors.join(' '),paper.doi??'',paper.arxiv??''].join(' ').toLowerCase().includes(q)) && (filters.readingStatus==='all'||reading===filters.readingStatus) && (filters.year==='all'||String(paper.year)===filters.year) && (filters.priority==='all'||projectState?.priority===filters.priority) && (filters.pdfAvailability==='all'||paper.pdfAvailability===filters.pdfAvailability) && (filters.tag==='all'||projectState?.tags.includes(filters.tag))
    })
  },[snapshot,filters,projectId])
  const selected=snapshot?.papers.find(paper=>paper.stableId===selectedPaperId)
  const refreshPaper=(paper:LiteraturePaper)=>setSnapshot(current=>current?{...current,papers:current.papers.map(item=>item.stableId===paper.stableId?paper:item)}:current)
  const closeInspector=()=>{onSelectPaper(undefined);requestAnimationFrame(()=>scrollRef.current?.scrollTo?.({top:listScroll.current}))}
  const selectPaper=(paper:LiteraturePaper)=>{listScroll.current=scrollRef.current?.scrollTop??window.scrollY;onSelectPaper(paper.stableId)}

  if(!snapshot&&!error)return <div className="literature-loading" aria-label="Loading literature library"><span/><span/><span/><span/></div>
  if(error)return <div className="library-state error"><AlertTriangle/><h2>Literature library unavailable</h2><p>{error}</p><button className="secondary-button" onClick={load}><RefreshCcw/> Retry</button></div>
  if(!snapshot)return null
  const years=[...new Set(snapshot.papers.flatMap(p=>p.year?[p.year]:[]))].sort((a,b)=>b-a)
  const tags=[...new Set(snapshot.papers.flatMap(p=>projectId?p.projectStates[projectId]?.tags??[]:[]))].sort()
  const emptyCollection=filters.collectionId!=='all'&&snapshot.collections.find(c=>c.id===filters.collectionId)?.itemCount===0
  return <div className={`literature-layout ${selected?'with-paper-inspector':''}`}>
    <CollectionNavigator collections={snapshot.collections} selectedId={filters.collectionId} collapsed={collapsed} onToggle={()=>setCollapsed(!collapsed)} onSelect={id=>setFilters({...filters,collectionId:id})}/>
    <div className="literature-main" ref={scrollRef}>
      <div className="library-summary"><div><span className="eyebrow">{projectId?'Project literature':'Global literature'}</span><h2>Literature library <span>{papers.length}</span></h2></div><div className="library-switch"><Link to={projectId?'/research/literature':'/research/projects/adaptive-agents/literature'}>{projectId?'Open global library':'Open project library'}</Link></div></div>
      <div className="connector-banner"><CloudOff/><div><strong>Zotero not connected</strong><span>Showing explicitly labeled demo metadata. Reading state and notes are stored by Workspace.</span></div><button className="secondary-button" disabled title="Connector setup is outside this increment">Connect Zotero</button></div>
      {offline&&<div className="offline-banner"><CloudOff/> Offline mode · cached metadata remains available.<button onClick={()=>setOffline(false)}>Dismiss</button></div>}
      <div className="mobile-collection-row"><CollectionPicker collections={snapshot.collections} selectedId={filters.collectionId} onSelect={id=>setFilters({...filters,collectionId:id})}/><button className="secondary-button" onClick={()=>setOffline(!offline)}>{offline?'Go online':'Test offline'}</button></div>
      <LiteratureToolbar filters={filters} onChange={setFilters} onClear={()=>setFilters({...defaults,collectionId:filters.collectionId})} availableYears={years} tags={tags}/>
      {papers.length?<><PaperTable papers={papers} projectId={projectId} selectedId={selectedPaperId} onSelect={selectPaper}/><PaperCards papers={papers} projectId={projectId} selectedId={selectedPaperId} onSelect={selectPaper}/></>:<div className="library-state empty"><Library/><h2>{emptyCollection?'This collection is empty':'No papers match'}</h2><p>{emptyCollection?'Items added to this Zotero collection will appear after a read-only sync.':'Adjust or clear search and filter criteria.'}</p>{!emptyCollection&&<button className="secondary-button" onClick={()=>setFilters({...defaults,collectionId:filters.collectionId})}>Clear filters</button>}</div>}
    </div>
    {selected&&<PaperInspector paper={selected} projectId={projectId} onClose={closeInspector} onStartTimer={onStartTimer} onUpdate={async values=>refreshPaper(await LiteratureService.updateProjectState(selected.stableId,projectId!,values))} onCreateTask={async()=>{await LiteratureService.createReadingTask(selected.stableId,projectId!);const fresh=await LiteratureService.getSnapshot();setSnapshot(fresh)}} onUnlink={async()=>{refreshPaper(await LiteratureService.unlinkProject(selected.stableId,projectId!));closeInspector()}}/>}
  </div>
}
