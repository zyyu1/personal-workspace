import type { ResearchProject } from '../types'
import { GlobalTaskService } from '../../../services/globalTaskService'

// Isolated adapter: replace this implementation with API calls without changing UI contracts.
const demoProject: ResearchProject = {
  id: 'adaptive-agents',
  name: 'Adaptive Research Agents',
  summary: 'Investigating reliable adaptation strategies for research-oriented language agents.',
  status: 'active',
  tags: ['Demo data', 'Agent systems', 'Evaluation', 'Primary: Research'],
  pinned: true,
  currentStage: 'Method design',
  stages: [
    { id: 's1', label: 'Literature review', state: 'complete', milestone: 'Research landscape mapped' },
    { id: 's2', label: 'Method design', state: 'current', milestone: 'Evaluation protocol approved' },
    { id: 's3', label: 'Experiments', state: 'upcoming', milestone: 'Baseline runs complete' },
    { id: 's4', label: 'Paper writing', state: 'upcoming', milestone: 'Internal draft ready' },
  ],
  tasks: [
    { id: 't1', title: 'Refine the evaluation protocol', status: 'in-progress', stage: 'Method design', dueDate: '2026-11-24', priority: 'high' },
    { id: 't2', title: 'Compare memory baselines', status: 'todo', stage: 'Method design', dueDate: '2026-11-27', priority: 'medium' },
    { id: 't3', title: 'Annotate failure-mode examples', status: 'todo', stage: 'Literature review', priority: 'medium' },
    { id: 't4', title: 'Prepare pilot experiment config', status: 'blocked', stage: 'Experiments', priority: 'low' },
  ],
  literature: [
    { id: 'p1', title: 'Reflexion: Language Agents with Verbal Reinforcement Learning', authors: 'Shinn et al.', year: 2023, readingStatus: 'reviewed', zoteroState: 'disconnected' },
    { id: 'p2', title: 'Generative Agents: Interactive Simulacra of Human Behavior', authors: 'Park et al.', year: 2023, readingStatus: 'reading', zoteroState: 'disconnected' },
    { id: 'p3', title: 'A Survey on Large Language Model based Autonomous Agents', authors: 'Wang et al.', year: 2024, readingStatus: 'unread', zoteroState: 'disconnected' },
  ],
  milestones: [
    { id: 'm1', title: 'Evaluation protocol review', kind: 'stage', date: '2026-11-24', verification: 'internal' },
    { id: 'm2', title: 'Pilot run checkpoint', kind: 'experiment', date: '2026-12-02', verification: 'internal' },
    { id: 'm3', title: 'Internal methods draft', kind: 'writing', date: '2026-12-12', verification: 'internal' },
    { id: 'm4', title: 'Target venue deadline', kind: 'submission', verification: 'unverified' },
  ],
  continueContext: {
    lastTask: { id: 't1', title: 'Refine the evaluation protocol', status: 'in-progress', stage: 'Method design', dueDate: '2026-11-24', priority: 'high' },
    note: { title: 'method-notes.md', available: false },
    paper: { id: 'p2', title: 'Generative Agents: Interactive Simulacra of Human Behavior', authors: 'Park et al.', year: 2023, readingStatus: 'reading', zoteroState: 'disconnected' },
    repository: { label: 'adaptive-research-agents', state: 'disconnected' },
    localFolder: { label: 'Research / Adaptive Agents', available: false },
    nextAction: 'Finalize the metrics table, then attach it to the pilot experiment.',
  },
  timeEntries: [
    { id: 'e1', date: '2026-11-17', minutes: 72 },
    { id: 'e2', date: '2026-11-18', minutes: 45 },
    { id: 'e3', date: '2026-11-20', minutes: 88 },
    { id: 'e4', date: '2026-11-21', minutes: 34 },
  ],
}

const emptyProject: ResearchProject = {
  ...demoProject,
  id: 'empty-project',
  name: 'New Research Project',
  summary: 'A clean project state for validating empty and disconnected experiences.',
  pinned: false,
  currentStage: 'Not configured',
  stages: [], tasks: [], literature: [], milestones: [], timeEntries: [],
  continueContext: { nextAction: 'Add a first task or connect a resource to create a resumable context.' },
}

export const ResearchProjectService = {
  async getProject(projectId: string): Promise<ResearchProject> {
    await new Promise((resolve) => setTimeout(resolve, 160))
    if (projectId === 'empty-project') return emptyProject
    return {...demoProject,tasks:await GlobalTaskService.list(projectId)}
  },
}
