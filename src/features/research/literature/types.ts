import type { Priority, ResearchTask } from '../types'

export type ReadingStatus = 'to-read' | 'reading' | 'read' | 'on-hold' | 'not-tracked'
export type PdfAvailability = 'available' | 'windows-only' | 'missing'
export type SyncState = 'synced' | 'pending' | 'offline' | 'error' | 'disconnected'

export interface ZoteroLibrary {
  id: string
  name: string
  type: 'user' | 'group'
  syncState: SyncState
  lastSyncedAt?: string
}

export interface ZoteroCollection {
  id: string
  libraryId: string
  name: string
  parentId?: string
  itemCount: number
}

export interface ProjectPaperState {
  projectId: string
  readingStatus: Exclude<ReadingStatus, 'not-tracked'>
  priority?: Priority
  note?: string
  tags: string[]
  lastReadAt?: string
}

export interface PaperResource {
  id: string
  kind: 'pdf' | 'markdown' | 'url'
  label: string
  availability: PdfAvailability | 'available' | 'missing'
  device?: string
  url?: string
}

export interface LiteraturePaper {
  stableId: string
  libraryId: string
  itemKey: string
  title: string
  authors: string[]
  year?: number
  publication?: string
  doi?: string
  arxiv?: string
  url?: string
  abstract?: string
  collectionIds: string[]
  projectStates: Record<string, ProjectPaperState>
  pdfAvailability: PdfAvailability
  updatedAt?: string
  resources: PaperResource[]
  relatedTasks: ResearchTask[]
  relatedProjects: Array<{ id: string; name: string }>
  source: 'zotero' | 'manual'
  syncState: SyncState
}

export interface LiteratureSnapshot {
  library: ZoteroLibrary
  collections: ZoteroCollection[]
  papers: LiteraturePaper[]
  demoData: boolean
}

export interface LiteratureFilters {
  query: string
  collectionId: string
  readingStatus: ReadingStatus | 'all'
  year: string
  priority: Priority | 'all'
  pdfAvailability: PdfAvailability | 'all'
  tag: string
}

export const paperStableId = (libraryId: string, itemKey: string) => `${libraryId}:${itemKey}`
