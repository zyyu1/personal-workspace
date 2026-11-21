import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { MemoryPersistenceAdapter, WorkspacePersistence } from '../data/persistence'
import { ExperimentRepository } from '../features/research/experiments/services/experimentRepository'
import { PlanningService } from '../features/research/planning/services/planningService'
import { ResearchProjectService } from '../features/research/services/researchProjectService'
import { SubmissionService } from '../features/research/submissions/services/submissionService'
import { GlobalCalendarService } from '../services/globalCalendarService'
import { GlobalTaskService } from '../services/globalTaskService'
import { TimeEntryService } from '../services/timeEntryService'
import { TimerSessionService } from '../services/timerSessionService'
import { WorkspaceResumeService } from '../services/workspaceResumeService'

function LocationProbe(){const location=useLocation();return <output data-testid="location-probe">{location.pathname}{location.search}</output>}

describe('A01-2 shared Calendar, Timer and Resume integration',()=>{
  beforeEach(async()=>{
    vi.restoreAllMocks()
    WorkspacePersistence.configure(new MemoryPersistenceAdapter())
    await Promise.all([GlobalTaskService.reset(),SubmissionService.reset(),ExperimentRepository.reset(),TimeEntryService.reset(),TimerSessionService.reset(),WorkspaceResumeService.reset()])
    await PlanningService.reset()
  })
  afterEach(cleanup)

  it('projects each PlannedSession once and reschedules it without changing Task due date',async()=>{
    const before=(await GlobalTaskService.get('t2'))!,session=before.plannedSessions![0],due=before.dueDate
    let items=await GlobalCalendarService.query({projectId:'adaptive-agents'})
    expect(items.filter(item=>item.canonicalSourceId===session.id&&item.sourceType==='planned-session')).toHaveLength(1)
    await PlanningService.rescheduleSession('t2',session.id,'2026-11-23T15:00','2026-11-23T16:30')
    expect((await GlobalTaskService.get('t2'))?.dueDate).toBe(due)
    items=await GlobalCalendarService.query({projectId:'adaptive-agents'})
    expect(items.find(item=>item.canonicalSourceId===session.id)?.start).toBe('2026-11-23T15:00')
  })

  it('keeps DailyTaskAssignment day-only and deduplicates canonical source records',async()=>{
    const items=await GlobalCalendarService.query({projectId:'adaptive-agents'}),daily=items.find(item=>item.sourceType==='daily-task-assignment')!
    expect(daily.date).toBeTruthy();expect(daily.start).toBeUndefined();expect(daily.end).toBeUndefined()
    expect(new Set(items.map(item=>`${item.sourceType}:${item.canonicalSourceId}`)).size).toBe(items.length)
  })

  it('preserves Submission deadline provenance, timezone, verification and precision',async()=>{
    const items=await GlobalCalendarService.query({projectId:'adaptive-agents'}),deadline=items.find(item=>item.canonicalSourceId==='deadline-atlas-paper')!
    expect(deadline).toMatchObject({sourceType:'submission-deadline',timezone:'AoE',verification:'changed',precision:'exact'})
    expect(deadline.sourceUrl).toMatch(/^https:/)
    const uncertain=items.find(item=>item.canonicalSourceId==='deadline-atlas-supplementary')!
    expect(uncertain.start).toBeUndefined();expect(uncertain.precision).toBe('date-only')
  })

  it('finishes one global TimerSession into one persistent canonical TimeEntry',async()=>{
    const started=new Date('2026-11-21T10:00:00Z'),session=await TimerSessionService.start({area:'research',projectId:'adaptive-agents',taskId:'t1',label:'Protocol'},started)
    const entry=await TimerSessionService.finish(new Date('2026-11-21T10:02:05Z'))
    expect(entry).toMatchObject({timerSessionId:session.id,taskId:'t1',durationSeconds:125,minutes:2})
    TimeEntryService.invalidate()
    expect((await TimeEntryService.list('adaptive-agents')).filter(row=>row.timerSessionId===session.id)).toHaveLength(1)
  })

  it('restores an active TimerSession from persistence after repository invalidation',async()=>{
    const session=await TimerSessionService.start({area:'research',projectId:'adaptive-agents',taskId:'t1',label:'Protocol'},new Date('2026-11-21T10:00:00Z'))
    TimerSessionService.invalidate()
    expect(await TimerSessionService.getActive()).toEqual(session)
  })

  it('makes concurrent duplicate Finish calls idempotent',async()=>{
    const started=new Date('2026-11-21T10:00:00Z'),session=await TimerSessionService.start({area:'research',projectId:'adaptive-agents',taskId:'t2',label:'Compare'},started)
    const [first,second]=await Promise.all([TimerSessionService.finish(new Date('2026-11-21T10:01:00Z')),TimerSessionService.finish(new Date('2026-11-21T10:01:00Z'))])
    expect(first.id).toBe(second.id)
    expect((await TimeEntryService.list()).filter(row=>row.timerSessionId===session.id)).toHaveLength(1)
  })

  it('keeps the TimerSession active when TimeEntry persistence fails',async()=>{
    const session=await TimerSessionService.start({area:'research',projectId:'adaptive-agents',taskId:'t1',label:'Protocol'},new Date('2026-11-21T10:00:00Z'))
    vi.spyOn(TimeEntryService,'record').mockRejectedValueOnce(new Error('time entry storage failed'))
    await expect(TimerSessionService.finish(new Date('2026-11-21T10:01:00Z'))).rejects.toThrow('storage failed')
    expect((await TimerSessionService.getActive())?.id).toBe(session.id)
    expect((await TimeEntryService.list()).some(row=>row.timerSessionId===session.id)).toBe(false)
  })

  it('feeds the same canonical TimeEntry to Overview, Timeline Review and Task Inspector data',async()=>{
    await PlanningService.getSnapshot('adaptive-agents')
    const entry=await TimeEntryService.record({projectId:'adaptive-agents',taskId:'t1',stageId:'s2',timerSessionId:'timer-shared',startedAt:'2026-11-21T10:00:00Z',endedAt:'2026-11-21T10:03:00Z',durationSeconds:180})
    const [project,planning]=await Promise.all([ResearchProjectService.getProject('adaptive-agents'),PlanningService.getSnapshot('adaptive-agents')])
    expect(project.timeEntries.some(row=>row.id===entry.id)).toBe(true)
    expect(planning.timeEntries.some(row=>row.id===entry.id)).toBe(true)
    expect(PlanningService.reviewByTask(planning).find(row=>row.key==='t1')?.actualMinutes).toBe(planning.timeEntries.filter(row=>row.taskId==='t1').reduce((sum,row)=>sum+row.minutes,0))
  })

  it('never converts ExperimentRun measured duration into personal TimeEntry',async()=>{
    await PlanningService.getSnapshot('adaptive-agents')
    const before=await TimeEntryService.list(),runs=await ExperimentRepository.listRuns('adaptive-agents','exp-evaluation')
    expect(runs.some(run=>Boolean(run.measuredDurationSeconds))).toBe(true)
    expect(await TimeEntryService.list()).toEqual(before)
  })

  it.each([
    ['paper','demo-library:ALOHA1','/research/projects/adaptive-agents/literature?paper=demo-library%3AALOHA1'],
    ['task','t1','/research/projects/adaptive-agents/tasks?task=t1'],
    ['experiment','exp-evaluation','/research/projects/adaptive-agents/experiments/exp-evaluation'],
  ] as const)('resolves a persisted %s Resume Context',async(entityType,entityId,route)=>{
    await WorkspaceResumeService.record({area:'research',projectId:'adaptive-agents',entityType,entityId,route})
    expect(await WorkspaceResumeService.resolveLatest('adaptive-agents')).toMatchObject({valid:true,route})
    WorkspaceResumeService.invalidate()
    expect((await WorkspaceResumeService.resolveLatest('adaptive-agents')).route).toBe(route)
  })

  it('falls back safely when a persisted Resume entity is missing',async()=>{
    await WorkspaceResumeService.record({area:'research',projectId:'adaptive-agents',entityType:'task',entityId:'deleted-task',route:'/research/projects/adaptive-agents/tasks?task=deleted-task'})
    expect(await WorkspaceResumeService.resolveLatest('adaptive-agents')).toMatchObject({valid:false,route:'/research/projects/adaptive-agents/overview'})
  })

  it('Continue Research restores position without starting the Global Timer',async()=>{
    await WorkspaceResumeService.record({area:'research',projectId:'adaptive-agents',entityType:'task',entityId:'t2',route:'/research/projects/adaptive-agents/tasks?task=t2'})
    expect(await WorkspaceResumeService.resolveLatest('adaptive-agents')).toMatchObject({valid:true,route:'/research/projects/adaptive-agents/tasks?task=t2'})
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/overview']}><App/><LocationProbe/></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button',{name:'Resume'}))
    await waitFor(()=>expect(screen.getByTestId('location-probe')).toHaveTextContent('/research/projects/adaptive-agents/tasks?task=t2'))
    expect((await TimerSessionService.getActive())).toBeUndefined()
  })

  it('renders the minimal Calendar page with filters and day-only truth state',async()=>{
    render(<MemoryRouter initialEntries={['/calendar']}><App/></MemoryRouter>)
    expect(await screen.findByRole('heading',{name:'Global calendar'})).toBeInTheDocument()
    expect(screen.getByLabelText('Calendar source')).toBeInTheDocument()
    expect(screen.getByLabelText('Calendar project')).toHaveValue('adaptive-agents')
  })

  it('shows a Timer persistence failure and does not claim success in the UI',async()=>{
    vi.spyOn(TimeEntryService,'record').mockRejectedValueOnce(new Error('TimeEntry write rejected'))
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/overview']}><App/></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button',{name:'Focus'}))
    fireEvent.click(await screen.findByRole('button',{name:'Finish & save'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('TimeEntry write rejected')
    expect(screen.getByRole('button',{name:'Finish & save'})).toBeInTheDocument()
  })
})
