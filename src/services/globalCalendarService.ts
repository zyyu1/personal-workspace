import { GlobalTaskService } from './globalTaskService'
import { PlanningService } from '../features/research/planning/services/planningService'
import { SubmissionService } from '../features/research/submissions/services/submissionService'

export type CalendarItemKind='deadline'|'event'|'planned-session'|'daily-task-assignment'
export interface CalendarItem{
  id:string
  canonicalSourceId:string
  sourceType:'task-due-date'|'fixed-event'|'planned-session'|'daily-task-assignment'|'submission-deadline'
  kind:CalendarItemKind
  projectId:string
  title:string
  date:string
  start?:string
  end?:string
  taskId?:string
  route:string
  timezone?:string
  verification?:string
  sourceUrl?:string
  precision?:string
}

const dedupe=(items:CalendarItem[])=>[...new Map(items.map(item=>[`${item.sourceType}:${item.canonicalSourceId}`,item])).values()]

export const GlobalCalendarService={
  async query(filters?:{projectId?:string;sourceType?:CalendarItem['sourceType']|'all'}){
    const projectId=filters?.projectId??'adaptive-agents'
    const [tasks,planning,submissions]=await Promise.all([GlobalTaskService.list(projectId),PlanningService.getSnapshot(projectId),SubmissionService.getSnapshot(projectId)])
    const items:CalendarItem[]=[]
    for(const task of tasks){
      if(task.dueDate)items.push({id:`calendar-task-due:${task.id}`,canonicalSourceId:task.id,sourceType:'task-due-date',kind:'deadline',projectId,title:task.title,date:task.dueDate,taskId:task.id,route:`/research/projects/${projectId}/tasks?task=${encodeURIComponent(task.id)}`,precision:'date-only'})
      for(const session of task.plannedSessions??[])items.push({id:`calendar-session:${session.id}`,canonicalSourceId:session.id,sourceType:'planned-session',kind:'planned-session',projectId,title:task.title,date:session.start.slice(0,10),start:session.start,end:session.end,taskId:task.id,route:`/research/projects/${projectId}/tasks?task=${encodeURIComponent(task.id)}`,precision:'exact'})
      for(const assignment of task.dailyAssignments??[])items.push({id:`calendar-day:${assignment.id}`,canonicalSourceId:assignment.id,sourceType:'daily-task-assignment',kind:'daily-task-assignment',projectId,title:task.title,date:assignment.date,taskId:task.id,route:`/research/projects/${projectId}/tasks?task=${encodeURIComponent(task.id)}`,precision:'date-only'})
    }
    for(const event of planning.events.filter(row=>row.kind==='fixed-event'))items.push({id:`calendar-event:${event.id}`,canonicalSourceId:event.id,sourceType:'fixed-event',kind:'event',projectId,title:event.title,date:event.start.slice(0,10),start:event.start,end:event.end,route:`/research/projects/${projectId}/timeline`,timezone:event.timezone,verification:event.verification,sourceUrl:event.sourceUrl,precision:'exact'})
    const linkedOpportunityIds=new Set(submissions.targets.map(target=>target.opportunityId))
    for(const deadline of submissions.deadlines.filter(row=>linkedOpportunityIds.has(row.opportunityId))){
      const opportunity=submissions.opportunities.find(row=>row.id===deadline.opportunityId),venue=submissions.venues.find(row=>row.id===opportunity?.venueId),evidence=submissions.evidence.find(row=>row.id===deadline.evidenceId)
      items.push({id:`calendar-submission:${deadline.id}`,canonicalSourceId:deadline.id,sourceType:'submission-deadline',kind:'deadline',projectId,title:`${venue?.canonicalName??'Submission'} · ${deadline.eventType}`,date:deadline.originalLocalDatetime?.slice(0,10)??'',start:deadline.datePrecision==='exact'?deadline.utcInstant:undefined,end:deadline.datePrecision==='exact'?deadline.utcInstant:undefined,route:`/research/venues/${venue?.id}/opportunities/${deadline.opportunityId}`,timezone:deadline.originalTimezone,verification:deadline.verificationStatus,sourceUrl:evidence?.url,precision:deadline.datePrecision})
    }
    return dedupe(items).filter(item=>item.date&&(!filters?.sourceType||filters.sourceType==='all'||item.sourceType===filters.sourceType)).sort((a,b)=>(a.start??a.date).localeCompare(b.start??b.date))
  },
}
