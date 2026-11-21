import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../../App'
import { LiteratureService } from './services/literatureService'

describe('Literature Library and Paper Inspector',()=>{
  beforeEach(()=>{vi.restoreAllMocks();LiteratureService.reset()})
  afterEach(cleanup)

  it('deduplicates stable Zotero identities and keeps project reading state independent',async()=>{
    const snapshot=await LiteratureService.getSnapshot()
    expect(new Set(snapshot.papers.map(p=>p.stableId)).size).toBe(snapshot.papers.length)
    const aloha=snapshot.papers.find(p=>p.itemKey==='ALOHA1')!
    expect(aloha.projectStates['adaptive-agents'].readingStatus).toBe('reading')
    expect(aloha.projectStates['robotics-review'].readingStatus).toBe('to-read')
    await LiteratureService.updateProjectState(aloha.stableId,'adaptive-agents',{readingStatus:'read'})
    const updated=(await LiteratureService.getSnapshot()).papers.find(p=>p.itemKey==='ALOHA1')!
    expect(updated.projectStates['adaptive-agents'].readingStatus).toBe('read')
    expect(updated.projectStates['robotics-review'].readingStatus).toBe('to-read')
  })

  it('unlinks only one project and preserves original resources, notes, tasks and other projects',async()=>{
    const before=(await LiteratureService.getSnapshot()).papers.find(p=>p.itemKey==='ALOHA1')!
    const after=await LiteratureService.unlinkProject(before.stableId,'adaptive-agents')
    expect(after.projectStates['adaptive-agents']).toBeUndefined()
    expect(after.projectStates['robotics-review']).toBeDefined()
    expect(after.resources).toHaveLength(before.resources.length)
    expect(after.relatedTasks).toHaveLength(before.relatedTasks.length)
  })

  it('creates one shared reading task without duplicates',async()=>{
    const paper=(await LiteratureService.getSnapshot()).papers.find(p=>p.itemKey==='REFLEX2')!
    await LiteratureService.createReadingTask(paper.stableId,'adaptive-agents')
    await LiteratureService.createReadingTask(paper.stableId,'adaptive-agents')
    const updated=(await LiteratureService.getSnapshot()).papers.find(p=>p.itemKey==='REFLEX2')!
    expect(updated.relatedTasks.filter(task=>task.title.startsWith('Read:'))).toHaveLength(1)
  })

  it('preserves search state after closing the inspector and exposes disconnected states',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/literature']}><App/></MemoryRouter>)
    expect(await screen.findByText('Zotero not connected')).toBeInTheDocument()
    const search=screen.getByRole('textbox',{name:'Search papers'})
    fireEvent.change(search,{target:{value:'Reflexion'}})
    const title=await screen.findAllByText('Reflexion: Language Agents with Verbal Reinforcement Learning')
    fireEvent.click(title[0].closest('tr')!)
    expect(await screen.findByRole('complementary',{name:'Paper inspector'})).toBeInTheDocument()
    expect(screen.getByRole('button',{name:'Zotero unavailable'})).toBeDisabled()
    fireEvent.click(screen.getByRole('button',{name:'Close paper inspector'}))
    await waitFor(()=>expect(screen.queryByRole('complementary',{name:'Paper inspector'})).not.toBeInTheDocument())
    expect(search).toHaveValue('Reflexion')
  })

  it('handles empty collections and no-result searches',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/literature']}><App/></MemoryRouter>)
    await screen.findByText('Literature library')
    fireEvent.click(screen.getByRole('button',{name:/Empty collection/}))
    expect(await screen.findByText('This collection is empty')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:/All papers/}))
    fireEvent.change(screen.getByRole('textbox',{name:'Search papers'}),{target:{value:'no-such-paper'}})
    expect(await screen.findByText('No papers match')).toBeInTheDocument()
  })

  it('renders loading, offline and adapter error states',async()=>{
    const view=render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/literature']}><App/></MemoryRouter>)
    expect(await screen.findByLabelText('Loading literature library')).toBeInTheDocument()
    await screen.findByText('Literature library')
    fireEvent.click(screen.getByRole('button',{name:'Test offline'}))
    expect(screen.getByText(/Offline mode/)).toBeInTheDocument()
    view.unmount()
    vi.spyOn(LiteratureService,'getSnapshot').mockRejectedValueOnce(new Error('offline'))
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/literature']}><App/></MemoryRouter>)
    expect(await screen.findByText('Literature library unavailable')).toBeInTheDocument()
  })

  it('supports stable paper deep links and project-owned reading updates',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/literature?paper=demo-library%3AALOHA1']}><App/></MemoryRouter>)
    expect(await screen.findByRole('complementary',{name:'Paper inspector'})).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Project reading status'),{target:{value:'read'}})
    await waitFor(async()=>expect((await LiteratureService.getSnapshot()).papers.find(p=>p.itemKey==='ALOHA1')?.projectStates['adaptive-agents'].readingStatus).toBe('read'))
  })

  it('requires confirmation before switching an active global timer',async()=>{
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/overview']}><App/></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button',{name:'Focus'}))
    expect(screen.getAllByText('Refine the evaluation protocol').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('link',{name:'Literature'}))
    const aloha=await screen.findAllByText('Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware')
    const rowTitle=aloha.find(node=>node.closest('tr'))
    fireEvent.click(rowTitle!.closest('tr')!)
    await screen.findByRole('complementary',{name:'Paper inspector'})
    fireEvent.click(screen.getByRole('button',{name:'Start timer'}))
    expect(await screen.findByText('Switch active timer?')).toBeInTheDocument()
  })
})
