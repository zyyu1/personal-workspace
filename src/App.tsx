import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppShell, MiniTimer } from './components/AppShell'
import { Inspector, type InspectorItem } from './components/Inspector'
import { ProjectHeader } from './features/research/components/ProjectHeader'
import { ResearchTabs } from './features/research/components/ResearchTabs'
import { ResearchOverview } from './features/research/pages/ResearchOverview'
import { ResearchProjectService } from './features/research/services/researchProjectService'
import type { ResearchProject, ResearchTask } from './features/research/types'

function ProjectPage() {
  const { projectId = 'adaptive-agents', section = 'overview' } = useParams()
  const [project, setProject] = useState<ResearchProject>()
  const [inspector, setInspector] = useState<InspectorItem>()
  const [activeTask, setActiveTask] = useState<ResearchTask>()
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => { setProject(undefined); ResearchProjectService.getProject(projectId).then(setProject) }, [projectId])
  useEffect(() => { if (!running) return; const id = window.setInterval(() => setSeconds(v => v+1), 1000); return () => clearInterval(id) }, [running])

  const startTask = (task?: ResearchTask) => { if (!task) return; setActiveTask(task); setRunning(true) }
  const stopTimer = () => { setRunning(false); setSeconds(0); setActiveTask(undefined) }
  if (!project) return <AppShell timer={<MiniTimer running={false} seconds={0} onToggle={() => {}} onStop={() => {}}/>}><div className="loading-page"><span className="loading-line wide"/><span className="loading-line"/><div className="loading-grid"><span/><span/><span/></div></div></AppShell>

  const inspectorPanel = inspector ? <Inspector item={inspector} onClose={() => setInspector(undefined)} onStartTimer={startTask}/> : undefined
  return <AppShell inspector={inspectorPanel} timer={<MiniTimer running={running} label={activeTask?.title} seconds={seconds} onToggle={() => activeTask ? setRunning(!running) : startTask(project.tasks[0])} onStop={stopTimer}/>}>
    <ProjectHeader project={project} onFocus={startTask}/>
    <ResearchTabs projectId={project.id}/>
    {section === 'overview' ? <ResearchOverview project={project} onInspect={setInspector} onResume={startTask}/> : <div className="placeholder-page"><span className="eyebrow">Planned module</span><h2>{section[0].toUpperCase()+section.slice(1)}</h2><p>This route is ready, but the module is intentionally outside Research Overview V1.0.</p><button className="secondary-button" disabled>Not implemented in this increment</button></div>}
  </AppShell>
}

export function App() {
  return <Routes><Route path="/research/projects/:projectId/:section" element={<ProjectPage/>}/><Route path="*" element={<Navigate to="/research/projects/adaptive-agents/overview" replace/>}/></Routes>
}
