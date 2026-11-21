import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('Research Overview', () => {
  it('renders the overview from the project service', async () => {
    render(<MemoryRouter initialEntries={['/research/projects/adaptive-agents/overview']}><App/></MemoryRouter>)
    expect(await screen.findByText('Adaptive Research Agents')).toBeInTheDocument()
    expect(screen.getByText('Continue research')).toBeInTheDocument()
    expect(screen.getByText('Zotero disconnected')).toBeInTheDocument()
  })

  it('renders empty states without fabricated metrics', async () => {
    render(<MemoryRouter initialEntries={['/research/projects/empty-project/overview']}><App/></MemoryRouter>)
    expect(await screen.findByText('New Research Project')).toBeInTheDocument()
    expect(screen.getByText('No next actions')).toBeInTheDocument()
    expect(screen.getByText('No tracked time')).toBeInTheDocument()
  })
})
