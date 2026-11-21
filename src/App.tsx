import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell, MiniTimer } from './components/AppShell'
import { Inspector, type InspectorItem } from './components/Inspector'
import { ProjectHeader } from './features/research/components/ProjectHeader'
import { ResearchTabs } from './features/research/components/ResearchTabs'
import { LiteratureLibrary } from './features/research/literature/components/LiteratureLibrary'
import { ResearchOverview } from './features/research/pages/ResearchOverview'
import { ResearchTasks } from './features/research/planning/components/ResearchTasks'
import { ResearchTimeline } from './features/research/planning/components/ResearchTimeline'
import { ResearchProjectService } from './features/research/services/researchProjectService'
import type { ResearchProject, ResearchTask } from './features/research/types'

interface TimerControls { timer:ReactNode; start:(label:string)=>void }

function ProjectPage({timerControls}:{timerControls:TimerControls}) {
  const {projectId='adaptive-agents',section='overview'}=useParams()
  const [searchParams,setSearchParams]=useSearchParams()
  const navigate=useNavigate()
  const [project,setProject]=useState<ResearchProject>()
  const [inspector,setInspector]=useState<InspectorItem>()
  useEffect(()=>{setProject(undefined);setInspector(undefined);ResearchProjectService.getProject(projectId).then(setProject)},[projectId,section])
  if(!project)return <AppShell timer={timerControls.timer}><div className="loading-page"><span className="loading-line wide"/><span className="loading-line"/><div className="loading-grid"><span/><span/><span/></div></div></AppShell>
  const startTask=(task?:ResearchTask)=>{if(task)timerControls.start(task.title)}
  const inspectorPanel=inspector?<Inspector item={inspector} onClose={()=>setInspector(undefined)} onStartTimer={startTask}/>:undefined
  const selectedPaperId=searchParams.get('paper')??undefined
  const selectedTaskId=searchParams.get('task')??undefined
  const setSelectedPaper=(id?:string)=>{const next=new URLSearchParams(searchParams);id?next.set('paper',id):next.delete('paper');setSearchParams(next,{replace:true})}
  const setSelectedTask=(id?:string)=>{const next=new URLSearchParams(searchParams);id?next.set('task',id):next.delete('task');setSearchParams(next,{replace:true})}
  return <AppShell inspector={section==='overview'?inspectorPanel:undefined} timer={timerControls.timer}>
    <ProjectHeader project={project} onFocus={startTask}/><ResearchTabs projectId={project.id}/>
    {section==='overview'?<ResearchOverview project={project} onInspect={setInspector} onResume={startTask}/>:section==='literature'?<LiteratureLibrary projectId={project.id} selectedPaperId={selectedPaperId} onSelectPaper={setSelectedPaper} onStartTimer={timerControls.start}/>:section==='tasks'?<ResearchTasks projectId={project.id} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTask} onStartTimer={timerControls.start}/>:section==='timeline'?<ResearchTimeline projectId={project.id} onOpenTask={taskId=>navigate(`/research/projects/${project.id}/tasks?task=${encodeURIComponent(taskId)}`)}/>:<div className="placeholder-page"><span className="eyebrow">Planned module</span><h2>{section[0].toUpperCase()+section.slice(1)}</h2><p>This route is ready, but the module is intentionally outside the current increments.</p><button className="secondary-button" disabled>Not implemented in this increment</button></div>}
  </AppShell>
}

function GlobalLiteraturePage({timerControls}:{timerControls:TimerControls}) {
  const [searchParams,setSearchParams]=useSearchParams()
  const selectedPaperId=searchParams.get('paper')??undefined
  const setSelectedPaper=(id?:string)=>{const next=new URLSearchParams(searchParams);id?next.set('paper',id):next.delete('paper');setSearchParams(next,{replace:true})}
  return <AppShell timer={timerControls.timer}><div className="breadcrumbs">Research <span>/</span> Global Literature</div><header className="global-library-header"><div><span className="eyebrow">All research projects</span><h1>Global literature</h1><p>One bibliographic record, with independent reading state in every linked project.</p></div><span className="tag">Demo data</span></header><LiteratureLibrary selectedPaperId={selectedPaperId} onSelectPaper={setSelectedPaper} onStartTimer={timerControls.start}/></AppShell>
}

export function App() {
  const [activeLabel,setActiveLabel]=useState<string>()
  const [running,setRunning]=useState(false)
  const [seconds,setSeconds]=useState(0)
  const [pendingLabel,setPendingLabel]=useState<string>()
  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(value=>value+1),1000);return()=>clearInterval(id)},[running])
  const start=(label:string)=>{if(activeLabel&&activeLabel!==label){setPendingLabel(label);return}setActiveLabel(label);setRunning(true)}
  const stop=()=>{setActiveLabel(undefined);setRunning(false);setSeconds(0)}
  const timer=<MiniTimer running={running} label={activeLabel} seconds={seconds} onToggle={()=>activeLabel&&setRunning(!running)} onStop={stop}/>
  const timerControls={timer,start}
  return <><Routes><Route path="/research/projects/:projectId/:section" element={<ProjectPage timerControls={timerControls}/>}/><Route path="/research/literature" element={<GlobalLiteraturePage timerControls={timerControls}/>}/><Route path="*" element={<Navigate to="/research/projects/adaptive-agents/overview" replace/>}/></Routes>{pendingLabel&&<div className="modal-backdrop"><div className="switch-timer-dialog" role="dialog" aria-modal="true" aria-labelledby="switch-timer-title"><span className="eyebrow">One timer at a time</span><h2 id="switch-timer-title">Switch active timer?</h2><p>Finish the current entry for <strong>{activeLabel}</strong> and start <strong>{pendingLabel}</strong>.</p><div><button className="secondary-button" onClick={()=>setPendingLabel(undefined)}>Keep current</button><button className="primary-button" onClick={()=>{setActiveLabel(pendingLabel);setSeconds(0);setRunning(true);setPendingLabel(undefined)}}>Switch timer</button></div></div></div>}</>
}
