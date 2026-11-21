import type { ProjectMilestone, ResearchTask, TimeEntry } from '../types'

export type ResearchStageStatus='not-started'|'active'|'completed'|'on-hold'
export type TimelineView='roadmap'|'schedule'|'review'
export type RoadmapScale='month'|'quarter'|'project'

export interface ResearchStage {
  id:string
  projectId:string
  name:string
  order:number
  status:ResearchStageStatus
  startDate?:string
  endDate?:string
}

export interface ResearchMilestone extends ProjectMilestone { projectId:string; stageId?:string }
export interface FixedCalendarEvent { id:string; projectId:string; title:string; start:string; end:string; kind:'fixed-event'|'submission-deadline'; timezone?:string; verification?:'verified'|'unverified'|'internal'; sourceUrl?:string }
export interface PlanningSnapshot { demoData:boolean; offline:boolean; tasks:ResearchTask[]; stages:ResearchStage[]; milestones:ResearchMilestone[]; events:FixedCalendarEvent[]; timeEntries:TimeEntry[] }
export interface ReviewRow { key:string; label:string; plannedMinutes:number; actualMinutes:number }
