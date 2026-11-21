import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../../App'
import { GlobalTaskService } from '../../../services/globalTaskService'
import { LiteratureService } from '../literature/services/literatureService'
import { ResearchProjectService } from '../services/researchProjectService'
import { PlanningService } from './services/planningService'

describe('Research Tasks and Timeline',()=>{
  beforeEach(()=>{vi.restoreAllMocks();PlanningService.reset();LiteratureService.reset()})
  afterEach(cleanup)

  it('uses the same stable task IDs in project and global task views',async()=>{
    const project=await ResearchProjectService.getProject('adaptive-agents')
    const global=await GlobalTaskService.list()
    expect(project.tasks.map(task=>task.id)).toEqual(global.filter(task=>task.projectId==='adaptive-agents').map(task=>task.id))
  })

  it('creates a globally linked reading task from a paper without duplicates',async()=>{
    const task=await LiteratureService.createReadingTask('demo-library:SURVEY4','adaptive-agents')
    const again=await LiteratureService.createReadingTask('demo-library:SURVEY4','adaptive-agents')
    expect(task.id).toBe(again.id)
    expect((await GlobalTaskService.get(task.id))?.paperIds).toContain('demo-library:SURVEY4')
  })

  it('keeps day-only assignments separate from concrete sessions',async()=>{
    const before=(await GlobalTaskService.get('t3'))!
    expect(before.plannedSessions).toHaveLength(0)
    const after=await PlanningService.planDay('t3','2026-11-26')
    expect(after.dailyAssignments?.[0].date).toBe('2026-11-26')
    expect(after.plannedSessions).toHaveLength(0)
  })

  it('supports multiple sessions and reschedules without changing due date',async()=>{
    const due=(await GlobalTaskService.get('t2'))!.dueDate
    await PlanningService.addSession('t2','2026-11-25T09:00','2026-11-25T10:00')
    const withSessions=(await PlanningService.getSnapshot('adaptive-agents')).tasks.find(task=>task.id==='t2')!
    expect(withSessions.plannedSessions?.length).toBe(2)
    const moved=await PlanningService.rescheduleSession('t2',withSessions.plannedSessions![0].id,'2026-11-23T14:00','2026-11-23T15:30')
    expect(moved.dueDate).toBe(due)
  })

  it('changes task status without completing a stage or milestone',async()=>{
    const before=await PlanningService.getSnapshot('adaptive-agents')
    await PlanningService.updateTask('t1',{status:'done'})
    const after=await PlanningService.getSnapshot('adaptive-agents')
    expect(after.stages).toEqual(before.stages)
    expect(after.milestones).toEqual(before.milestones)
  })

  it('manages stages and milestones independently and preserves deadline provenance',async()=>{
    const stage=await PlanningService.createStage('adaptive-agents','Replication study')
    const milestone=await PlanningService.createMilestone('adaptive-agents','Replication review','2027-03-12',stage.id)
    await PlanningService.updateStage(stage.id,{status:'active'})
    expect(milestone.stageId).toBe(stage.id)
    expect(milestone.verification).toBe('internal')
    const deadline=(await PlanningService.getSnapshot('adaptive-agents')).milestones.find(item=>item.kind==='submission')!
    expect(deadline.sourceUrl).toBeTruthy();expect(deadline.timezone).toBe('America/Los_Angeles');expect(deadline.verification).toBe('unverified')
  })

  it('deduplicates actual time and never treats plan variance as completion',async()=>{
    const snapshot=await PlanningService.getSnapshot('adaptive-agents')
    snapshot.timeEntries.push({...snapshot.timeEntries[0]})
    const rows=PlanningService.reviewByTask(snapshot)
    expect(rows.find(row=>row.key==='t1')?.actualMinutes).toBe(160)
    expect(rows.every(row=>!('completion' in row))).toBe(true)
  })

  it('keeps task search state when inspector closes with Escape',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/tasks']}><App/></MemoryRouter>)
    const search=await screen.findByRole('textbox',{name:'Search tasks'})
    fireEvent.change(search,{target:{value:'memory baselines'}})
    const matches=await screen.findAllByText('Compare memory baselines')
    fireEvent.click(matches.find(node=>node.closest('tr'))!.closest('tr')!)
    expect(await screen.findByRole('complementary',{name:'Task inspector'})).toBeInTheDocument()
    fireEvent.keyDown(window,{key:'Escape'})
    await waitFor(()=>expect(screen.queryByRole('complementary',{name:'Task inspector'})).not.toBeInTheDocument())
    expect(search).toHaveValue('memory baselines')
  })

  it('renders board and timeline views with demo, offline and no-fake-progress states',async()=>{
    const view=render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/tasks']}><App/></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button',{name:/Board/}))
    expect(screen.getAllByText('Blocked').length).toBeGreaterThan(0)
    view.unmount()
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/timeline']}><App/></MemoryRouter>)
    expect(await screen.findByText('No percentage is inferred from task completion.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Test offline'}))
    expect(screen.getByText(/offline cache/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Review'}))
    expect(screen.getByText('Variance, not completion')).toBeInTheDocument()
  })
})
