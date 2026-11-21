import type { ResearchProject } from '../types'
import { SubmissionService } from '../submissions/services/submissionService'
import { LiteratureService } from '../literature/services/literatureService'
import { PlanningService } from '../planning/services/planningService'

// Immutable project metadata only. Dynamic domain data is assembled from canonical services below.
const projectMetadata: Pick<ResearchProject,'id'|'name'|'summary'|'status'|'tags'|'pinned'|'continueContext'> = {
  id: 'adaptive-agents',
  name: 'Adaptive Research Agents',
  summary: 'Investigating reliable adaptation strategies for research-oriented language agents.',
  status: 'active',
  tags: ['Demo data', 'Agent systems', 'Evaluation', 'Primary: Research'],
  pinned: true,
  continueContext: {
    note: { title: 'method-notes.md', available: false },
    repository: { label: 'adaptive-research-agents', state: 'disconnected' },
    localFolder: { label: 'Research / Adaptive Agents', available: false },
    nextAction: 'Finalize the metrics table, then attach it to the pilot experiment.',
  },
}

const emptyProject: ResearchProject = {
  ...projectMetadata,
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
    const [submissionData,literatureData,planning]=await Promise.all([SubmissionService.getSnapshot(projectId),LiteratureService.getSnapshot(),PlanningService.getSnapshot(projectId)])
    const linkedOpportunityIds=new Set(submissionData.targets.map(target=>target.opportunityId))
    const nextDeadline=submissionData.deadlines.filter(deadline=>linkedOpportunityIds.has(deadline.opportunityId)&&deadline.utcInstant).sort((a,b)=>a.utcInstant!.localeCompare(b.utcInstant!))[0]
    const opportunity=nextDeadline&&submissionData.opportunities.find(item=>item.id===nextDeadline.opportunityId)
    const venue=opportunity&&submissionData.venues.find(item=>item.id===opportunity.venueId)
    const evidence=nextDeadline?.evidenceId?submissionData.evidence.find(item=>item.id===nextDeadline.evidenceId):undefined
    const milestones=nextDeadline?[...planning.milestones.filter(item=>item.kind!=='submission'),{id:nextDeadline.id,title:`${venue?.canonicalName} · ${nextDeadline.eventType} (Demo)`,kind:'submission' as const,date:nextDeadline.originalLocalDatetime?.slice(0,10),timezone:nextDeadline.originalTimezone,verification:nextDeadline.verificationStatus==='verified'?'verified' as const:'unverified' as const,sourceUrl:evidence?.url}]:planning.milestones
    const literature=literatureData.papers.filter(paper=>paper.projectStates[projectId]).map(paper=>{const state=paper.projectStates[projectId];return{id:paper.stableId,title:paper.title,authors:paper.authors.join(', '),year:paper.year??0,readingStatus:state.readingStatus==='read'?'reviewed' as const:state.readingStatus==='reading'?'reading' as const:'unread' as const,zoteroState:literatureData.library.syncState==='synced'?'connected' as const:literatureData.library.syncState==='disconnected'?'disconnected' as const:'unavailable' as const,zoteroUrl:paper.url}})
    const stages=planning.stages.map(stage=>({id:stage.id,label:stage.name,state:stage.status==='completed'?'complete' as const:stage.status==='active'?'current' as const:'upcoming' as const,milestone:planning.milestones.find(item=>item.stageId===stage.id)?.title}))
    const activeStage=planning.stages.find(stage=>stage.status==='active')?.name??'Not configured',continuePaper=literature.find(item=>item.id==='demo-library:GENAG3')??literature[0]
    return {...projectMetadata,currentStage:activeStage,stages,milestones,tasks:planning.tasks,literature,timeEntries:planning.timeEntries.map(({id,date,minutes})=>({id,date,minutes})),continueContext:{...projectMetadata.continueContext,lastTask:planning.tasks.find(task=>task.id==='t1')??planning.tasks[0],paper:continuePaper}}
  },
}
