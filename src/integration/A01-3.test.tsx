import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useState } from 'react'
import { App } from '../App'
import { InspectorShell } from '../components/InspectorShell'
import { MemoryPersistenceAdapter, WorkspacePersistence } from '../data/persistence'
import { GlobalTaskService } from '../services/globalTaskService'
import { TimeEntryService } from '../services/timeEntryService'
import { TimerSessionService } from '../services/timerSessionService'
import { formatDurationSeconds, formatTimeEntry } from '../utils/timeDuration'

function LocationProbe(){const location=useLocation();return <output data-testid="location">{location.pathname}{location.search}</output>}

describe('A01-3 shared UI, Global Tasks and duration precision',()=>{
  beforeEach(async()=>{WorkspacePersistence.configure(new MemoryPersistenceAdapter());await Promise.all([GlobalTaskService.reset(),TimeEntryService.reset(),TimerSessionService.reset()])})
  afterEach(cleanup)

  it('formats zero, sub-minute and detailed durations without mutating stored seconds',()=>{
    const entry={minutes:1,durationSeconds:37}
    expect(formatDurationSeconds(0)).toBe('0 min')
    expect(formatDurationSeconds(37)).toBe('<1 min')
    expect(formatTimeEntry(entry,true)).toBe('37 sec')
    expect(formatDurationSeconds(3661,{includeSeconds:true})).toBe('1h 1 min 1 sec')
    expect(entry.durationSeconds).toBe(37)
  })

  it('uses one InspectorShell for Escape close and restores the prior focus',async()=>{
    function Harness(){const [open,setOpen]=useState(false);return <><button onClick={()=>setOpen(true)}>Open details</button>{open&&<InspectorShell title="Details" label="Test inspector" onClose={()=>setOpen(false)}><button>Action</button></InspectorShell>}</>}
    render(<Harness/>)
    const opener=screen.getByRole('button',{name:'Open details'});opener.focus();fireEvent.click(opener)
    fireEvent.keyDown(window,{key:'Escape'})
    await waitFor(()=>expect(screen.queryByRole('complementary',{name:'Test inspector'})).not.toBeInTheDocument())
    expect(opener).toHaveFocus()
  })

  it('loads canonical Research tasks at /tasks without duplicate Task IDs',async()=>{
    render(<MemoryRouter initialEntries={['/tasks']}><App/></MemoryRouter>)
    expect(await screen.findByRole('heading',{name:'Global tasks'})).toBeInTheDocument()
    const ids=(await GlobalTaskService.list()).map(task=>task.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(screen.getAllByText('Refine the evaluation protocol')).not.toHaveLength(0)
  })

  it('updates a canonical status globally and exposes the same value to Research Tasks',async()=>{
    render(<MemoryRouter initialEntries={['/tasks']}><App/></MemoryRouter>)
    const select=await screen.findByLabelText('Global status for Refine the evaluation protocol')
    fireEvent.change(select,{target:{value:'done'}})
    await waitFor(()=>expect(select).toHaveValue('done'))
    expect((await GlobalTaskService.list('adaptive-agents')).find(task=>task.id==='t1')?.status).toBe('done')
  })

  it('filters by Area and does not invent Study or Work tasks',async()=>{
    render(<MemoryRouter initialEntries={['/tasks']}><App/></MemoryRouter>)
    const area=await screen.findByLabelText('Filter task area')
    fireEvent.change(area,{target:{value:'study'}})
    expect(await screen.findByRole('heading',{name:'No matching tasks'})).toBeInTheDocument()
  })

  it('supports a lazy-loaded stable Task deep link and Escape close',async()=>{
    render(<MemoryRouter initialEntries={['/tasks?task=t1']}><App/><LocationProbe/></MemoryRouter>)
    expect(await screen.findByRole('complementary',{name:'Task inspector'})).toBeInTheDocument()
    fireEvent.keyDown(window,{key:'Escape'})
    await waitFor(()=>expect(screen.getByTestId('location')).toHaveTextContent('/tasks'))
  })
})
