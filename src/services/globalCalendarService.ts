import { GlobalTaskService } from './globalTaskService'
import { PlanningService } from '../features/research/planning/services/planningService'
import { SubmissionService } from '../features/research/submissions/services/submissionService'
import { StudyCourseService } from '../features/study/services/studyCourseService'
import { StudyExamService, isCalendarEligible } from '../features/study/services/studyExamService'
import type { ExamMilestone } from '../features/study/types'
import { parseSafeExternalUrl } from './safeExternalUrl'

export type CalendarItemKind='deadline'|'event'|'planned-session'|'daily-task-assignment'
export interface CalendarItem{
  id:string
  canonicalSourceId:string
  sourceType:'task-due-date'|'fixed-event'|'planned-session'|'daily-task-assignment'|'submission-deadline'|'assessment-deadline'|'exam-milestone'
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
  /** Original civil date/time as recorded (e.g. `2027-02-10 09:00`), shown alongside the viewer-local rendering. */
  originalLocal?:string
}

const dedupe=(items:CalendarItem[])=>[...new Map(items.map(item=>[`${item.sourceType}:${item.canonicalSourceId}`,item])).values()]
const safeSourceUrl=(value?:string)=>{if(!value)return undefined;try{return parseSafeExternalUrl(value).toString()}catch{return undefined}}

export const GlobalCalendarService={
  async query(filters?:{projectId?:string;sourceType?:CalendarItem['sourceType']|'all'}){
    const projectId=filters?.projectId??'adaptive-agents'
    const offerings=await StudyCourseService.listOfferings(),isStudy=offerings.some(row=>row.offering.id===projectId)
    const tasks=await GlobalTaskService.list(projectId)
    const planning=isStudy?{events:[]}:await PlanningService.getSnapshot(projectId)
    const submissions=isStudy?{targets:[],opportunities:[],venues:[],evidence:[],deadlines:[]}:await SubmissionService.getSnapshot(projectId)
    const assessments=isStudy?await StudyCourseService.listVerifiedAssessments(projectId):[]
    const exams=isStudy?await StudyExamService.calendarSources(projectId):{assessments:[],milestones:[]}
    const items:CalendarItem[]=[]
    for(const task of tasks){
      const taskRoute=task.area==='study'?`/tasks?task=${encodeURIComponent(task.id)}`:`/research/projects/${projectId}/tasks?task=${encodeURIComponent(task.id)}`
      if(task.dueDate)items.push({id:`calendar-task-due:${task.id}`,canonicalSourceId:task.id,sourceType:'task-due-date',kind:'deadline',projectId,title:task.title,date:task.dueDate,taskId:task.id,route:taskRoute,precision:'date-only'})
      for(const session of task.plannedSessions??[])items.push({id:`calendar-session:${session.id}`,canonicalSourceId:session.id,sourceType:'planned-session',kind:'planned-session',projectId,title:task.title,date:session.start.slice(0,10),start:session.start,end:session.end,taskId:task.id,route:taskRoute,precision:'exact'})
      for(const assignment of task.dailyAssignments??[])items.push({id:`calendar-day:${assignment.id}`,canonicalSourceId:assignment.id,sourceType:'daily-task-assignment',kind:'daily-task-assignment',projectId,title:task.title,date:assignment.date,taskId:task.id,route:taskRoute,precision:'date-only'})
    }
    for(const event of planning.events.filter(row=>row.kind==='fixed-event'))items.push({id:`calendar-event:${event.id}`,canonicalSourceId:event.id,sourceType:'fixed-event',kind:'event',projectId,title:event.title,date:event.start.slice(0,10),start:event.start,end:event.end,route:`/research/projects/${projectId}/timeline`,timezone:event.timezone,verification:event.verification,sourceUrl:event.sourceUrl,precision:'exact'})
    const linkedOpportunityIds=new Set(submissions.targets.map(target=>target.opportunityId))
    for(const deadline of submissions.deadlines.filter(row=>linkedOpportunityIds.has(row.opportunityId))){
      const opportunity=submissions.opportunities.find(row=>row.id===deadline.opportunityId),venue=submissions.venues.find(row=>row.id===opportunity?.venueId),evidence=submissions.evidence.find(row=>row.id===deadline.evidenceId)
      items.push({id:`calendar-submission:${deadline.id}`,canonicalSourceId:deadline.id,sourceType:'submission-deadline',kind:'deadline',projectId,title:`${venue?.canonicalName??'Submission'} · ${deadline.eventType}`,date:deadline.originalLocalDatetime?.slice(0,10)??'',start:deadline.datePrecision==='exact'?deadline.utcInstant:undefined,end:deadline.datePrecision==='exact'?deadline.utcInstant:undefined,route:`/research/venues/${venue?.id}/opportunities/${deadline.opportunityId}`,timezone:deadline.originalTimezone,verification:deadline.verificationStatus,sourceUrl:evidence?.url,precision:deadline.datePrecision})
    }
    // Module 009: one canonical event per real exam. An eligible active `exam` milestone REPLACES the legacy
    // 007 projection for the same assessment (same id/canonicalSourceId), never adding a second event.
    const examAssessmentIds=new Set<string>()
    const milestoneLabel:Record<ExamMilestone['kind'],string>={'registration-open':'Registration opens','registration-close':'Registration closes','withdrawal-close':'Withdrawal deadline',exam:'Exam','grade-release':'Grade release'}
    for(const milestone of exams.milestones){
      const assessment=exams.assessments.find(row=>row.id===milestone.assessmentId)
      if(!assessment)continue
      if(milestone.kind==='exam'&&milestone.status==='active')examAssessmentIds.add(assessment.id)
      if(!isCalendarEligible(milestone,assessment))continue
      const exact=milestone.datePrecision==='exact',base={kind:'deadline' as const,projectId:assessment.offeringId,date:milestone.localDate!,start:exact?milestone.instant:undefined,end:exact?milestone.instant:undefined,route:`/study/courses/${assessment.offeringId}/exams?assessment=${encodeURIComponent(assessment.id)}`,timezone:milestone.timezone,verification:milestone.verificationStatus,sourceUrl:safeSourceUrl(milestone.sourceUrl),precision:milestone.datePrecision,originalLocal:exact?`${milestone.localDate} ${milestone.localTime}`:milestone.localDate}
      if(milestone.kind==='exam')items.push({...base,id:`calendar-assessment:${assessment.id}`,canonicalSourceId:assessment.id,sourceType:'assessment-deadline',title:assessment.title})
      else items.push({...base,id:`calendar-exam-milestone:${milestone.id}`,canonicalSourceId:milestone.id,sourceType:'exam-milestone',title:`${milestoneLabel[milestone.kind]} · ${assessment.title}`})
    }
    const inactive=new Set(exams.assessments.filter(row=>row.lifecycle&&row.lifecycle!=='active').map(row=>row.id))
    for(const assessment of assessments.filter(row=>!examAssessmentIds.has(row.id)&&!inactive.has(row.id)))items.push({id:`calendar-assessment:${assessment.id}`,canonicalSourceId:assessment.id,sourceType:'assessment-deadline',kind:'deadline',projectId:assessment.offeringId,title:assessment.title,date:assessment.officialDateTime!.slice(0,10),start:assessment.officialDateTime,end:assessment.officialDateTime,route:`/study/courses/${assessment.offeringId}/overview`,timezone:assessment.originalTimezone,verification:'verified',sourceUrl:safeSourceUrl(assessment.provenance),precision:'exact'})
    return dedupe(items).filter(item=>item.date&&(!filters?.sourceType||filters.sourceType==='all'||item.sourceType===filters.sourceType)).sort((a,b)=>(a.start??a.date).localeCompare(b.start??b.date))
  },
}
