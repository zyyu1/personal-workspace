import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../../App'
import { GlobalResourceService } from '../../../services/globalResourceService'
import { GlobalTaskService } from '../../../services/globalTaskService'
import { LiteratureService } from '../literature/services/literatureService'
import { PlanningService } from '../planning/services/planningService'
import { ExperimentRepository } from './services/experimentRepository'
import { RunComparisonService } from './services/runComparisonService'

describe('Research Experiments',()=>{
  beforeEach(()=>{vi.restoreAllMocks();ExperimentRepository.reset();PlanningService.reset();LiteratureService.reset();sessionStorage.clear()})
  afterEach(cleanup)

  it('keeps stable experiment and run ownership inside one project',async()=>{
    const snapshot=await ExperimentRepository.snapshot('adaptive-agents')
    const experiment=snapshot.experiments[0],run=snapshot.runs.find(item=>item.experimentId===experiment.id)!
    expect((await ExperimentRepository.get('adaptive-agents',experiment.id))?.id).toBe(experiment.id)
    expect((await ExperimentRepository.getRun('adaptive-agents',experiment.id,run.id))?.experimentId).toBe(experiment.id)
    expect(await ExperimentRepository.getRun('other-project',experiment.id,run.id)).toBeUndefined()
    expect(await ExperimentRepository.getRun('adaptive-agents','exp-robotics-pilot',run.id)).toBeUndefined()
  })

  it('links an existing paper without copying bibliographic metadata or duplicating experiments',async()=>{
    const first=await ExperimentRepository.createFromPaper('adaptive-agents','demo-library:SURVEY4','A Survey on LLM Agents')
    const second=await ExperimentRepository.createFromPaper('adaptive-agents','demo-library:SURVEY4','Changed title')
    expect(second.id).toBe(first.id)
    expect(first.paperIds).toEqual(['demo-library:SURVEY4'])
    expect(first).not.toHaveProperty('authors')
  })

  it('creates follow-up tasks in the canonical global task service',async()=>{
    const task=await ExperimentRepository.createFollowUpTask('adaptive-agents','exp-evaluation','Investigate recovery failures','run-baseline')
    expect((await GlobalTaskService.get(task.id))?.id).toBe(task.id)
    expect((await ExperimentRepository.get('adaptive-agents','exp-evaluation'))?.taskIds).toContain(task.id)
    expect((await ExperimentRepository.getRun('adaptive-agents','exp-evaluation','run-baseline'))?.taskIds).toContain(task.id)
  })

  it('creates a manual Draft without launching work or changing human TimeEntry data',async()=>{
    const before=(await PlanningService.getSnapshot('adaptive-agents')).timeEntries
    const run=await ExperimentRepository.createRun('adaptive-agents','exp-evaluation','Manual metadata record')
    expect(run.status).toBe('draft');expect(run.startedAt).toBeUndefined();expect(run.endedAt).toBeUndefined()
    expect((await PlanningService.getSnapshot('adaptive-agents')).timeEntries).toEqual(before)
  })

  it('records missing metric values as undefined, never zero',async()=>{
    const run=await ExperimentRepository.createRun('adaptive-agents','exp-evaluation','Missing metric run')
    const updated=await ExperimentRepository.updateRun('adaptive-agents','exp-evaluation',run.id,{metrics:[{name:'success_rate',source:'workspace',unit:'ratio',direction:'higher'}]})
    expect(updated.metrics[0].numericValue).toBeUndefined()
  })

  it('validates comparable and incompatible run contexts without ranking',async()=>{
    const runs=await ExperimentRepository.listRuns('adaptive-agents','exp-evaluation')
    const comparable=RunComparisonService.compare('exp-evaluation',runs,['run-baseline','run-reflection'],'success_rate')
    expect(comparable.comparable).toBe(true);expect(comparable).not.toHaveProperty('bestRun')
    const incompatible=RunComparisonService.compare('exp-evaluation',runs,['run-baseline','run-legacy-cache'],'success_rate')
    expect(incompatible.comparable).toBe(false)
    expect(incompatible.issues.map(issue=>issue.field)).toEqual(expect.arrayContaining(['unit','split','protocol','dataset','sample-size']))
    expect(RunComparisonService.compare('exp-evaluation',runs,['run-baseline'],'success_rate').issues[0].field).toBe('selection')
  })

  it('keeps external source fields read-only while allowing Workspace observations',async()=>{
    await expect(ExperimentRepository.updateRun('adaptive-agents','exp-evaluation','run-legacy-cache',{status:'completed'})).rejects.toThrow('read-only')
    const updated=await ExperimentRepository.addObservation('adaptive-agents','exp-evaluation','run-legacy-cache','Review cached evidence')
    expect(updated.observations[0].authorNote).toBe('Review cached evidence')
  })

  it('unlinks artifacts without deleting the canonical resource',async()=>{
    const result=await ExperimentRepository.unlinkResource('adaptive-agents','exp-evaluation','resource-run-report')
    expect(result.sourcePreserved).toBe(true)
    expect(await GlobalResourceService.get('resource-run-report')).toBeDefined()
    expect(result.runs.flatMap(run=>run.artifacts).some(link=>link.resourceId==='resource-run-report')).toBe(false)
  })

  it('renders list/cards, search no-results and preserves list preferences',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/experiments']}><App/></MemoryRouter>)
    const search=await screen.findByRole('textbox',{name:'Search experiments'})
    fireEvent.click(screen.getByRole('button',{name:/Cards/}))
    fireEvent.change(search,{target:{value:'no-such-experiment'}})
    expect(await screen.findByText('No experiments match')).toBeInTheDocument()
    expect(sessionStorage.getItem('experiment-filters:adaptive-agents')).toContain('view=cards')
  })

  it('creates and edits an experiment through the approved form',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/experiments']}><App/></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button',{name:/New experiment/}))
    fireEvent.change(screen.getByLabelText('Experiment title'),{target:{value:'Recovery ablation'}})
    fireEvent.click(screen.getByRole('button',{name:'Save experiment'}))
    expect(await screen.findByText('Recovery ablation')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Edit'}))
    fireEvent.change(screen.getByLabelText('Experiment title'),{target:{value:'Recovery ablation study'}})
    fireEvent.click(screen.getByRole('button',{name:'Save experiment'}))
    expect(await screen.findByText('Recovery ablation study')).toBeInTheDocument()
  })

  it('creates a manual Draft in the UI and edits reproducibility metadata without execution',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/experiments/exp-evaluation']}><App/></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button',{name:/New manual run/}))
    fireEvent.change(screen.getByLabelText('Run label'),{target:{value:'Metadata-only run'}})
    fireEvent.click(screen.getByRole('button',{name:'Create Draft'}))
    expect(await screen.findByRole('complementary',{name:'Run inspector'})).toBeInTheDocument()
    expect(screen.getByLabelText('Run status')).toHaveValue('draft')
    fireEvent.change(screen.getByLabelText('Git commit SHA'),{target:{value:'0123456789abcdef0123456789abcdef01234567'}})
    await waitFor(async()=>expect((await ExperimentRepository.listRuns('adaptive-agents','exp-evaluation')).find(run=>run.label==='Metadata-only run')?.code.commitSha).toBe('0123456789abcdef0123456789abcdef01234567'))
  })

  it('creates experiments from Paper Inspector using a stable paper relation',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/literature?paper=demo-library%3ASURVEY4']}><App/></MemoryRouter>)
    expect(await screen.findByRole('complementary',{name:'Paper inspector'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Create experiment'}))
    expect(await screen.findByText('Experiment inspired by A Survey on Large Language Model based Autonomous Agents')).toBeInTheDocument()
  })

  it('opens run inspector by stable ID and closes with Escape',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/experiments/exp-evaluation?tab=runs&run=run-baseline']}><App/></MemoryRouter>)
    expect(await screen.findByRole('complementary',{name:'Run inspector'})).toBeInTheDocument()
    fireEvent.keyDown(window,{key:'Escape'})
    await waitFor(()=>expect(screen.queryByRole('complementary',{name:'Run inspector'})).not.toBeInTheDocument())
    expect(screen.getByText('Agent evaluation protocol')).toBeInTheDocument()
  })

  it('shows guarded compare warnings, offline state and invalid-ID errors',async()=>{
    const view=render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/experiments/exp-evaluation/compare?runs=run-baseline,run-legacy-cache&metric=success_rate']}><App/></MemoryRouter>)
    expect(await screen.findByText('Not directly comparable')).toBeInTheDocument()
    expect(screen.getByText(/no ranking/)).toBeInTheDocument()
    view.unmount()
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/experiments/missing-id']}><App/></MemoryRouter>)
    expect(await screen.findByText('Experiment not found')).toBeInTheDocument()
  })
})
