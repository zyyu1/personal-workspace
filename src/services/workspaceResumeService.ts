import { createVersionedRepository, stableId, unwrapMutation, validationFailure } from '../data/persistence'
import { GlobalTaskService } from './globalTaskService'
import { LiteratureService } from '../features/research/literature/services/literatureService'
import { ExperimentRepository } from '../features/research/experiments/services/experimentRepository'
import { GlobalResourceService } from './globalResourceService'

export type ResumeEntityType='paper'|'task'|'experiment'|'project'|'resource'|'section'
export interface WorkspaceResumeContext{id:string;area:'research'|'study'|'work';projectId:string;entityType:ResumeEntityType;entityId:string;route:string;inspectorSelection?:{kind:string;id:string};filters?:Record<string,string>;lastActiveAt:string}
interface ResumeState{contexts:WorkspaceResumeContext[]}
const repository=createVersionedRepository<ResumeState>({domain:'resume-contexts',schemaVersion:1,seedVersion:1,seed:()=>({contexts:[]})})
const safeRoute=(route:string)=>/^\/(research|study)\//.test(route)&&!route.startsWith('//')

export const WorkspaceResumeService={
  async record(input:Omit<WorkspaceResumeContext,'id'|'lastActiveAt'>,now=new Date()){
    if(!safeRoute(input.route))throw validationFailure('Resume route must stay inside the Research Workspace')
    const filters=input.filters?Object.fromEntries(Object.entries(input.filters).filter(([key,value])=>key.length<=80&&value.length<=500)):undefined
    return unwrapMutation(await repository.mutate(state=>{const item:WorkspaceResumeContext={...input,filters,id:stableId('resume'),lastActiveAt:now.toISOString()};const contexts=[...state.contexts.filter(row=>!(row.projectId===item.projectId&&row.entityType===item.entityType&&row.entityId===item.entityId)),item].sort((a,b)=>b.lastActiveAt.localeCompare(a.lastActiveAt)).slice(0,50);return{state:{contexts},value:item}}))
  },
  async latest(projectId:string){const item=(await repository.getState()).contexts.filter(row=>row.projectId===projectId).sort((a,b)=>b.lastActiveAt.localeCompare(a.lastActiveAt))[0];return item?structuredClone(item):undefined},
  async resolveLatest(projectId:string,area:'research'|'study'|'work'='research'){
    const context=await this.latest(projectId),fallback=area==='study'?`/study/courses/${projectId}/overview`:`/research/projects/${projectId}/overview`
    if(!context||!safeRoute(context.route))return{valid:false,route:fallback,reason:'No safe recent context is available'}
    let exists=false
    if(context.entityType==='task')exists=Boolean(await GlobalTaskService.get(context.entityId))
    else if(context.entityType==='paper')exists=Boolean((await LiteratureService.getSnapshot()).papers.some(row=>row.stableId===context.entityId&&row.projectStates[projectId]))
    else if(context.entityType==='experiment')exists=Boolean(await ExperimentRepository.get(projectId,context.entityId))
    else if(context.entityType==='resource')exists=Boolean(await GlobalResourceService.get(context.entityId))
    else if(context.entityType==='section')exists=context.area==='study'&&context.projectId===projectId
    else exists=context.entityId===projectId
    return exists?{valid:true,route:context.route,context}:{valid:false,route:fallback,context,reason:'The recent item no longer exists or is inaccessible'}
  },
  reset(){return repository.reset()},
  invalidate(){repository.invalidate()},
}
