export type IntegrationState = 'connected' | 'disconnected' | 'unavailable'
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type StageState = 'complete' | 'current' | 'upcoming'

export interface ResearchTask {
  id: string
  title: string
  status: TaskStatus
  stage: string
  dueDate?: string
  priority?: Priority
}

export interface LiteratureItem {
  id: string
  title: string
  authors: string
  year: number
  readingStatus: 'unread' | 'reading' | 'reviewed'
  zoteroState: IntegrationState
  zoteroUrl?: string
}

export interface ProjectStage {
  id: string
  label: string
  state: StageState
  milestone?: string
}

export interface ProjectMilestone {
  id: string
  title: string
  kind: 'stage' | 'experiment' | 'writing' | 'submission'
  date?: string
  timezone?: string
  verification?: 'verified' | 'unverified' | 'internal'
  sourceUrl?: string
}

export interface ContinueContext {
  lastTask?: ResearchTask
  note?: { title: string; available: boolean; url?: string }
  paper?: LiteratureItem
  repository?: { label: string; state: IntegrationState; url?: string }
  localFolder?: { label: string; available: boolean; url?: string }
  nextAction: string
}

export interface ResearchProject {
  id: string
  name: string
  summary: string
  status: 'active' | 'paused' | 'archived'
  tags: string[]
  pinned: boolean
  currentStage: string
  stages: ProjectStage[]
  tasks: ResearchTask[]
  literature: LiteratureItem[]
  milestones: ProjectMilestone[]
  continueContext: ContinueContext
  timeEntries: Array<{ id: string; date: string; minutes: number }>
}
