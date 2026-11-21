import { GlobalTaskService } from '../../../../services/globalTaskService'
import type { ResearchTask, TimeEntry } from '../../types'
import type { FixedCalendarEvent, PlanningSnapshot, ResearchMilestone, ResearchStage, ReviewRow } from '../types'
import { SubmissionService } from '../../submissions/services/submissionService'

const initialStages:ResearchStage[]=[
  {id:'s1',projectId:'adaptive-agents',name:'Literature review',order:1,status:'completed',startDate:'2026-10-01',endDate:'2026-11-10'},
  {id:'s2',projectId:'adaptive-agents',name:'Method design',order:2,status:'active',startDate:'2026-11-01',endDate:'2026-12-05'},
  {id:'s3',projectId:'adaptive-agents',name:'Experiments',order:3,status:'not-started',startDate:'2026-11-25',endDate:'2027-01-18'},
  {id:'s4',projectId:'adaptive-agents',name:'Paper writing',order:4,status:'not-started',startDate:'2027-01-04',endDate:'2027-02-20'},
]
const initialMilestones:ResearchMilestone[]=[
  {id:'m1',projectId:'adaptive-agents',stageId:'s2',title:'Evaluation protocol review',kind:'stage',date:'2026-11-24',verification:'internal'},
  {id:'m2',projectId:'adaptive-agents',stageId:'s3',title:'Pilot run checkpoint',kind:'experiment',date:'2026-12-02',verification:'internal'},
  {id:'m3',projectId:'adaptive-agents',stageId:'s4',title:'Internal methods draft',kind:'writing',date:'2027-01-22',verification:'internal'},
  {id:'m4',projectId:'adaptive-agents',title:'Target venue submission',kind:'submission',date:'2027-02-28',timezone:'America/Los_Angeles',verification:'unverified',sourceUrl:'https://example.org/official-deadline-pending-verification'},
]
const events:FixedCalendarEvent[]=[
  {id:'event-review',projectId:'adaptive-agents',title:'Methods review meeting',start:'2026-11-24T11:00',end:'2026-11-24T11:45',kind:'fixed-event'},
]
const entries:TimeEntry[]=[
  {id:'e1',projectId:'adaptive-agents',taskId:'t1',stageId:'s2',date:'2026-11-17',minutes:72},
  {id:'e2',projectId:'adaptive-agents',taskId:'t2',stageId:'s2',date:'2026-11-18',minutes:45},
  {id:'e3',projectId:'adaptive-agents',taskId:'t1',stageId:'s2',date:'2026-11-20',minutes:88},
  {id:'e4',projectId:'adaptive-agents',taskId:'t3',stageId:'s1',date:'2026-11-21',minutes:34},
]
let stages=structuredClone(initialStages)
let milestones=structuredClone(initialMilestones)
const copy=<T>(value:T):T=>structuredClone(value)
const duration=(start:string,end:string)=>Math.max(0,(new Date(end).getTime()-new Date(start).getTime())/60000)

export const PlanningService={
  async getSnapshot(projectId:string):Promise<PlanningSnapshot>{
    await new Promise(resolve=>setTimeout(resolve,100))
    const submissionData=await SubmissionService.getSnapshot(projectId),opportunityIds=new Set(submissionData.targets.map(target=>target.opportunityId))
    const canonicalDeadlines:FixedCalendarEvent[]=submissionData.deadlines.filter(deadline=>opportunityIds.has(deadline.opportunityId)&&deadline.utcInstant&&deadline.calendarItemId).map(deadline=>{const opportunity=submissionData.opportunities.find(item=>item.id===deadline.opportunityId),venue=submissionData.venues.find(item=>item.id===opportunity?.venueId),source=submissionData.evidence.find(item=>item.id===deadline.evidenceId);return{id:deadline.calendarItemId!,projectId,title:`${venue?.canonicalName} · ${deadline.eventType} (Demo)`,start:deadline.utcInstant!,end:deadline.utcInstant!,kind:'submission-deadline',timezone:deadline.originalTimezone,verification:deadline.verificationStatus==='verified'?'verified':'unverified',sourceUrl:source?.url}})
    return {demoData:true,offline:false,tasks:await GlobalTaskService.list(projectId),stages:copy(stages.filter(stage=>stage.projectId===projectId).sort((a,b)=>a.order-b.order)),milestones:copy(milestones.filter(item=>item.projectId===projectId)),events:copy([...events.filter(item=>item.projectId===projectId),...canonicalDeadlines]),timeEntries:copy(entries.filter(item=>item.projectId===projectId))}
  },
  createTask:GlobalTaskService.create.bind(GlobalTaskService),
  updateTask:GlobalTaskService.update.bind(GlobalTaskService),
  planDay:GlobalTaskService.planDay.bind(GlobalTaskService),
  addSession:GlobalTaskService.addSession.bind(GlobalTaskService),
  rescheduleSession:GlobalTaskService.rescheduleSession.bind(GlobalTaskService),
  async createStage(projectId:string,name:string,startDate?:string,endDate?:string){const stage:ResearchStage={id:`stage-${Date.now()}`,projectId,name,order:stages.filter(item=>item.projectId===projectId).length+1,status:'not-started',startDate,endDate};stages=[...stages,stage];return copy(stage)},
  async updateStage(id:string,values:Partial<Pick<ResearchStage,'name'|'order'|'status'|'startDate'|'endDate'>>){stages=stages.map(stage=>stage.id===id?{...stage,...values}:stage);return copy(stages.find(stage=>stage.id===id)!)},
  async createMilestone(projectId:string,title:string,date?:string,stageId?:string){const item:ResearchMilestone={id:`milestone-${Date.now()}`,projectId,title,kind:'stage',date,stageId,verification:'internal'};milestones=[...milestones,item];return copy(item)},
  async updateMilestone(id:string,values:Partial<Pick<ResearchMilestone,'title'|'date'|'stageId'>>){milestones=milestones.map(item=>item.id===id?{...item,...values}:item);return copy(milestones.find(item=>item.id===id)!)},
  reviewByTask(snapshot:PlanningSnapshot):ReviewRow[]{
    const uniqueEntries=[...new Map(snapshot.timeEntries.map(entry=>[entry.id,entry])).values()]
    return snapshot.tasks.map(task=>({key:task.id,label:task.title,plannedMinutes:(task.plannedSessions??[]).reduce((sum,item)=>sum+duration(item.start,item.end),0),actualMinutes:uniqueEntries.filter(entry=>entry.taskId===task.id).reduce((sum,item)=>sum+item.minutes,0)})).filter(row=>row.plannedMinutes||row.actualMinutes)
  },
  reviewByStage(snapshot:PlanningSnapshot):ReviewRow[]{
    const taskStage=new Map(snapshot.tasks.map(task=>[task.id,task.stage]));const uniqueEntries=[...new Map(snapshot.timeEntries.map(entry=>[entry.id,entry])).values()]
    return snapshot.stages.map(stage=>({key:stage.id,label:stage.name,plannedMinutes:snapshot.tasks.filter(task=>task.stage===stage.name).flatMap(task=>task.plannedSessions??[]).reduce((sum,item)=>sum+duration(item.start,item.end),0),actualMinutes:uniqueEntries.filter(entry=>entry.stageId===stage.id||taskStage.get(entry.taskId??'')===stage.name).reduce((sum,item)=>sum+item.minutes,0)}))
  },
  reviewByDate(snapshot:PlanningSnapshot):ReviewRow[]{
    const rows=new Map<string,ReviewRow>();for(const task of snapshot.tasks)for(const item of task.plannedSessions??[]){const date=item.start.slice(0,10);const row=rows.get(date)??{key:date,label:date,plannedMinutes:0,actualMinutes:0};row.plannedMinutes+=duration(item.start,item.end);rows.set(date,row)}for(const item of new Map(snapshot.timeEntries.map(entry=>[entry.id,entry])).values()){const row=rows.get(item.date)??{key:item.date,label:item.date,plannedMinutes:0,actualMinutes:0};row.actualMinutes+=item.minutes;rows.set(item.date,row)}return[...rows.values()].sort((a,b)=>a.key.localeCompare(b.key))
  },
  reset(){stages=structuredClone(initialStages);milestones=structuredClone(initialMilestones);GlobalTaskService.reset()},
}
