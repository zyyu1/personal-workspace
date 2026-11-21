export type IntegrationState = 'connected' | 'disconnected' | 'unavailable'
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type StageState = 'complete' | 'current' | 'upcoming'
export type TaskType = 'reading' | 'experiment' | 'writing' | 'analysis' | 'general'

export interface DailyTaskAssignment { id:string; taskId:string; projectId:string; date:string }
export interface PlannedSession { id:string; taskId:string; projectId:string; start:string; end:string }
export interface TaskDependency { id:string; taskId:string; dependsOnTaskId:string }
export interface TaskResourceLink { id:string; resourceId?:string; label:string; kind:'file'|'note'|'repository'; available:boolean }

export interface ResearchTask {
  id: string
  title: string
  status: TaskStatus
  stage: string
  dueDate?: string
  priority?: Priority
  projectId?: string
  taskType?: TaskType
  paperIds?: string[]
  resourceLinks?: TaskResourceLink[]
  dependencies?: TaskDependency[]
  dailyAssignments?: DailyTaskAssignment[]
  plannedSessions?: PlannedSession[]
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
  stageId?: string
}

export interface TimeEntry { id:string; projectId:string; taskId?:string; stageId?:string; date:string; minutes:number }

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
