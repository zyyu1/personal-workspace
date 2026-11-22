import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell, MiniTimer } from './components/AppShell'
import { Inspector, type InspectorItem } from './components/Inspector'
import { ProjectHeader } from './features/research/components/ProjectHeader'
import { ResearchTabs } from './features/research/components/ResearchTabs'
import { ResearchOverview } from './features/research/pages/ResearchOverview'
import { ResearchTasks } from './features/research/planning/components/ResearchTasks'
import { ResearchTimeline } from './features/research/planning/components/ResearchTimeline'
import { ExperimentRepository } from './features/research/experiments/services/experimentRepository'
import { SubmissionService } from './features/research/submissions/services/submissionService'
import type { SubmissionSnapshot } from './features/research/submissions/types'
import { ResearchProjectService } from './features/research/services/researchProjectService'
import type { ResearchProject, ResearchTask } from './features/research/types'
import { TimerSessionService, type TimerContext, type TimerSession } from './services/timerSessionService'
import { WorkspaceResumeService } from './services/workspaceResumeService'

const LiteratureLibrary=lazy(()=>import('./features/research/literature/components/LiteratureLibrary').then(module=>({default:module.LiteratureLibrary})))
const ExperimentsWorkspace=lazy(()=>import('./features/research/experiments/components/ExperimentsWorkspace').then(module=>({default:module.ExperimentsWorkspace})))
const ResourceCenter=lazy(()=>import('./features/research/resources/components/ResourceCenter').then(module=>({default:module.ResourceCenter})))
const ProjectSubmissions=lazy(()=>import('./features/research/submissions/components/ProjectSubmissions').then(module=>({default:module.ProjectSubmissions})))
const VenueExplorer=lazy(()=>import('./features/research/submissions/components/VenueExplorer').then(module=>({default:module.VenueExplorer})))
const SubmissionInspector=lazy(()=>import('./features/research/submissions/components/SubmissionInspector').then(module=>({default:module.SubmissionInspector})))
const GlobalCalendarPage=lazy(()=>import('./components/GlobalCalendarPage').then(module=>({default:module.GlobalCalendarPage})))
const GlobalTasksPage=lazy(()=>import('./components/GlobalTasksPage').then(module=>({default:module.GlobalTasksPage})))
const CourseLibrary=lazy(()=>import('./features/study/components/CourseLibrary').then(module=>({default:module.CourseLibrary})))
const CourseWorkspace=lazy(()=>import('./features/study/components/CourseWorkspace').then(module=>({default:module.CourseWorkspace})))
const LazyRoute=({children}:{children:ReactNode})=><Suspense fallback={<div className="route-loading" role="status"><span/><strong>Loading workspace…</strong></div>}>{children}</Suspense>

interface TimerControls { timer:ReactNode; start:(label:string,context?:Partial<Omit<TimerContext,'label'>>)=>void; revision:number }

function ProjectPage({timerControls}:{timerControls:TimerControls}) {
  const {projectId='adaptive-agents',section='overview'}=useParams()
  const experimentSubpath=useParams()['*']
  const [searchParams,setSearchParams]=useSearchParams()
  const navigate=useNavigate()
  const location=useLocation()
  const [project,setProject]=useState<ResearchProject>()
  const [projectError,setProjectError]=useState<string>()
  const [inspector,setInspector]=useState<InspectorItem>()
  const selectedPaperId=searchParams.get('paper')??undefined
  const selectedTaskId=searchParams.get('task')??undefined
  const serializedSearch=searchParams.toString()
  useEffect(()=>{let active=true;setProject(undefined);setProjectError(undefined);setInspector(undefined);ResearchProjectService.getProject(projectId).then(value=>{if(active)setProject(value)}).catch(error=>{if(active)setProjectError(error instanceof Error?error.message:'Project data is unavailable')});return()=>{active=false}},[projectId,section,timerControls.revision])
  useEffect(()=>{const experimentId=section==='experiments'?experimentSubpath?.split('/').filter(Boolean)[0]:undefined,entityType=selectedPaperId?'paper':selectedTaskId?'task':experimentId?'experiment':undefined,entityId=selectedPaperId??selectedTaskId??experimentId;if(!entityType||!entityId)return;const filters=Object.fromEntries(new URLSearchParams(serializedSearch).entries());void WorkspaceResumeService.record({area:'research',projectId,entityType,entityId,route:`${location.pathname}${location.search}`,inspectorSelection:{kind:entityType,id:entityId},filters})},[projectId,section,selectedPaperId,selectedTaskId,experimentSubpath,location.pathname,location.search,serializedSearch])
  if(projectError)return <AppShell timer={timerControls.timer}><div className="library-state error"><h2>Project data unavailable</h2><p>{projectError}</p><button className="secondary-button" onClick={()=>window.location.reload()}>Retry</button></div></AppShell>
  if(!project)return <AppShell timer={timerControls.timer}><div className="loading-page"><span className="loading-line wide"/><span className="loading-line"/><div className="loading-grid"><span/><span/><span/></div></div></AppShell>
  const startTask=(task?:ResearchTask)=>{if(task)timerControls.start(task.title,{area:'research',projectId,taskId:task.id})}
  const inspectorPanel=inspector?<Inspector item={inspector} onClose={()=>setInspector(undefined)} onStartTimer={startTask}/>:undefined
  const setSelectedPaper=(id?:string)=>{const next=new URLSearchParams(searchParams);id?next.set('paper',id):next.delete('paper');setSearchParams(next,{replace:true})}
  const setSelectedTask=(id?:string)=>{const next=new URLSearchParams(searchParams);id?next.set('task',id):next.delete('task');setSearchParams(next,{replace:true})}
  const resume=async()=>{const resolved=await WorkspaceResumeService.resolveLatest(projectId);navigate(resolved.route)}
  return <AppShell inspector={section==='overview'?inspectorPanel:undefined} timer={timerControls.timer}>
    <ProjectHeader project={project} onFocus={startTask}/><ResearchTabs projectId={project.id}/>
    {section==='overview'?<ResearchOverview project={project} onInspect={setInspector} onResume={resume}/>:section==='literature'?<LazyRoute><LiteratureLibrary key={timerControls.revision} projectId={project.id} selectedPaperId={selectedPaperId} onSelectPaper={setSelectedPaper} onStartTimer={label=>timerControls.start(label,{area:'research',projectId,paperId:selectedPaperId})} onCreateExperiment={async paper=>{const item=await ExperimentRepository.createFromPaper(project.id,paper.stableId,paper.title);navigate(`/research/projects/${project.id}/experiments/${item.id}`)}}/></LazyRoute>:section==='tasks'?<ResearchTasks key={timerControls.revision} projectId={project.id} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTask} onStartTimer={label=>timerControls.start(label,{area:'research',projectId,taskId:selectedTaskId})}/>:section==='timeline'?<ResearchTimeline key={timerControls.revision} projectId={project.id} onOpenTask={taskId=>navigate(`/research/projects/${project.id}/tasks?task=${encodeURIComponent(taskId)}`)}/>:section==='experiments'?<LazyRoute><ExperimentsWorkspace projectId={project.id} subpath={experimentSubpath}/></LazyRoute>:section==='files'?<LazyRoute><ResourceCenter projectId={project.id}/></LazyRoute>:section==='submissions'?<LazyRoute><ProjectSubmissions projectId={project.id}/></LazyRoute>:<div className="placeholder-page"><span className="eyebrow">Planned module</span><h2>{section[0].toUpperCase()+section.slice(1)}</h2><p>This route is ready, but the module is intentionally outside the current increments.</p><button className="secondary-button" disabled>Not implemented in this increment</button></div>}
  </AppShell>
}

function GlobalLiteraturePage({timerControls}:{timerControls:TimerControls}) {
  const [searchParams,setSearchParams]=useSearchParams()
  const selectedPaperId=searchParams.get('paper')??undefined
  const setSelectedPaper=(id?:string)=>{const next=new URLSearchParams(searchParams);id?next.set('paper',id):next.delete('paper');setSearchParams(next,{replace:true})}
  return <AppShell timer={timerControls.timer}><div className="breadcrumbs">Research <span>/</span> Global Literature</div><header className="global-library-header"><div><span className="eyebrow">All research projects</span><h1>Global literature</h1><p>One bibliographic record, with independent reading state in every linked project.</p></div><span className="tag">Demo data</span></header><LazyRoute><LiteratureLibrary selectedPaperId={selectedPaperId} onSelectPaper={setSelectedPaper} onStartTimer={timerControls.start}/></LazyRoute></AppShell>
}

function GlobalResourcesPage({timerControls}:{timerControls:TimerControls}){return <AppShell timer={timerControls.timer}><div className="breadcrumbs">Workspace <span>/</span> Resources</div><LazyRoute><ResourceCenter global/></LazyRoute></AppShell>}
function CalendarPage({timerControls}:{timerControls:TimerControls}){return <AppShell timer={timerControls.timer}><LazyRoute><GlobalCalendarPage/></LazyRoute></AppShell>}
function TasksPage({timerControls}:{timerControls:TimerControls}){return <AppShell timer={timerControls.timer}><LazyRoute><GlobalTasksPage onStartTimer={(label,task)=>timerControls.start(label,{area:task.area??'research',projectId:task.projectId??'adaptive-agents',taskId:task.id})}/></LazyRoute></AppShell>}
function StudyCoursesPage({timerControls}:{timerControls:TimerControls}){return <AppShell timer={timerControls.timer}><LazyRoute><CourseLibrary/></LazyRoute></AppShell>}
function StudyCoursePage({timerControls}:{timerControls:TimerControls}){const {courseOfferingId='',section='overview'}=useParams();const activeSection=section==='materials'||section==='progress'||section==='exercises'||section==='exams'?section:'overview';return <AppShell timer={timerControls.timer}><LazyRoute><CourseWorkspace offeringId={courseOfferingId} section={activeSection} onStartTimer={(label,taskId)=>timerControls.start(label,{area:'study',projectId:courseOfferingId,taskId})}/></LazyRoute></AppShell>}

function VenueExplorerPage({timerControls,initialOpportunityId}:{timerControls:TimerControls;initialOpportunityId?:string}){return <AppShell timer={timerControls.timer}><LazyRoute><VenueExplorer initialOpportunityId={initialOpportunityId}/></LazyRoute></AppShell>}
function VenueDeepLinkPage({timerControls}:{timerControls:TimerControls}){const {opportunityId}=useParams();return <VenueExplorerPage timerControls={timerControls} initialOpportunityId={opportunityId}/>}
function SubmissionDeepLinkPage({timerControls}:{timerControls:TimerControls}){const {submissionId}=useParams(),[data,setData]=useState<SubmissionSnapshot>();useEffect(()=>{void SubmissionService.getSnapshot().then(setData)},[]);return <AppShell timer={timerControls.timer}><div className="breadcrumbs">Research <span>/</span> Submission record</div>{data&&submissionId?<div className="deep-link-stage"><LazyRoute><SubmissionInspector selection={{kind:'submission',id:submissionId}} snapshot={data} onClose={()=>history.back()} onChanged={()=>void SubmissionService.getSnapshot().then(setData)}/></LazyRoute></div>:<div className="submission-loading"><span/><span/><span/></div>}</AppShell>}

export function App() {
  const [active,setActive]=useState<TimerSession>()
  const [seconds,setSeconds]=useState(0)
  const [pending,setPending]=useState<TimerContext>()
  const [confirmDiscard,setConfirmDiscard]=useState(false)
  const [timerBusy,setTimerBusy]=useState(false)
  const [revision,setRevision]=useState(0)
  const [workspaceError,setWorkspaceError]=useState<string>()
  useEffect(()=>{void TimerSessionService.getActive().then(session=>{setActive(session);if(session)setSeconds(TimerSessionService.elapsed(session,new Date()))}).catch(error=>setWorkspaceError(error instanceof Error?error.message:'Unable to restore the timer session'))},[])
  useEffect(()=>{if(!active)return;setSeconds(TimerSessionService.elapsed(active,new Date()));if(active.status!=='running')return;const id=window.setInterval(()=>setSeconds(TimerSessionService.elapsed(active,new Date())),1000);return()=>clearInterval(id)},[active])
  useEffect(()=>{const rejected=(event:PromiseRejectionEvent)=>{setWorkspaceError(event.reason instanceof Error?event.reason.message:'The change could not be saved.');event.preventDefault()};window.addEventListener('unhandledrejection',rejected);return()=>window.removeEventListener('unhandledrejection',rejected)},[])
  const run=async(action:()=>Promise<void>)=>{setTimerBusy(true);setWorkspaceError(undefined);try{await action()}catch(error){setWorkspaceError(error instanceof Error?error.message:'The timer change could not be saved.')}finally{setTimerBusy(false)}}
  const start=(label:string,context?:Partial<Omit<TimerContext,'label'>>)=>{const next:TimerContext={area:context?.area??'research',projectId:context?.projectId??'adaptive-agents',label,taskId:context?.taskId,paperId:context?.paperId,experimentId:context?.experimentId,stageId:context?.stageId};if(active){setPending(next);return}void run(async()=>{setActive(await TimerSessionService.start(next));setSeconds(0)})}
  const toggle=()=>void run(async()=>setActive(active?.status==='running'?await TimerSessionService.pause():await TimerSessionService.resume()))
  const finish=()=>void run(async()=>{await TimerSessionService.finish();setActive(undefined);setSeconds(0);setRevision(value=>value+1)})
  const discard=()=>void run(async()=>{await TimerSessionService.discard();setActive(undefined);setSeconds(0);setConfirmDiscard(false)})
  const switchTimer=()=>void run(async()=>{if(!pending)return;await TimerSessionService.finish();const next=await TimerSessionService.start(pending);setActive(next);setSeconds(0);setPending(undefined);setRevision(value=>value+1)})
  const timer=<><MiniTimer running={active?.status==='running'} label={active?.label} seconds={seconds} busy={timerBusy} onToggle={toggle} onFinish={finish} onDiscard={()=>setConfirmDiscard(true)}/>{workspaceError&&<div className="workspace-error" role="alert"><span><strong>Unable to save this change</strong>{workspaceError}</span><button onClick={()=>setWorkspaceError(undefined)}>Dismiss</button></div>}</>
  const timerControls={timer,start,revision}
  return <><Routes><Route path="/study/courses" element={<StudyCoursesPage timerControls={timerControls}/>}/><Route path="/study/courses/:courseOfferingId/:section" element={<StudyCoursePage timerControls={timerControls}/>}/><Route path="/research/projects/:projectId/:section/*" element={<ProjectPage timerControls={timerControls}/>}/><Route path="/research/literature" element={<GlobalLiteraturePage timerControls={timerControls}/>}/><Route path="/research/venues" element={<VenueExplorerPage timerControls={timerControls}/>}/><Route path="/research/venues/:venueId/opportunities/:opportunityId" element={<VenueDeepLinkPage timerControls={timerControls}/>}/><Route path="/research/submissions/:submissionId" element={<SubmissionDeepLinkPage timerControls={timerControls}/>}/><Route path="/resources" element={<GlobalResourcesPage timerControls={timerControls}/>}/><Route path="/calendar" element={<CalendarPage timerControls={timerControls}/>}/><Route path="/tasks" element={<TasksPage timerControls={timerControls}/>}/><Route path="*" element={<Navigate to="/research/projects/adaptive-agents/overview" replace/>}/></Routes>{pending&&<div className="modal-backdrop"><div className="switch-timer-dialog" role="dialog" aria-modal="true" aria-labelledby="switch-timer-title"><span className="eyebrow">One timer at a time</span><h2 id="switch-timer-title">Switch active timer?</h2><p>Finish and save <strong>{active?.label}</strong>, then start <strong>{pending.label}</strong>.</p><div><button className="secondary-button" onClick={()=>setPending(undefined)}>Keep current</button><button className="primary-button" disabled={timerBusy} onClick={switchTimer}>Finish & switch</button></div></div></div>}{confirmDiscard&&<div className="modal-backdrop"><div className="switch-timer-dialog" role="dialog" aria-modal="true" aria-labelledby="discard-timer-title"><span className="eyebrow">No TimeEntry will be created</span><h2 id="discard-timer-title">Discard this timer?</h2><p>The current timer session for <strong>{active?.label}</strong> will be removed from this device.</p><div><button className="secondary-button" onClick={()=>setConfirmDiscard(false)}>Cancel</button><button className="danger-button" disabled={timerBusy} onClick={discard}>Discard session</button></div></div></div>}</>
}
