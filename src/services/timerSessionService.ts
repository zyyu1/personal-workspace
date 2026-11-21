import { createVersionedRepository, stableId, unwrapMutation, validationFailure } from '../data/persistence'
import { TimeEntryService } from './timeEntryService'

export interface TimerContext{area:'research'|'study'|'work';projectId:string;label:string;taskId?:string;paperId?:string;experimentId?:string;stageId?:string}
export interface TimerSession extends TimerContext{id:string;status:'running'|'paused';startedAt:string;lastResumedAt:string;accumulatedSeconds:number}
interface TimerState{active?:TimerSession}
const repository=createVersionedRepository<TimerState>({domain:'timer-sessions',schemaVersion:1,seedVersion:1,seed:()=>({})})
const copy=<T>(value:T):T=>structuredClone(value)
const elapsed=(session:TimerSession,now:Date)=>session.accumulatedSeconds+(session.status==='running'?Math.max(0,Math.floor((now.getTime()-new Date(session.lastResumedAt).getTime())/1000)):0)

export const TimerSessionService={
  elapsed,
  async getActive(){const active=(await repository.getState()).active;return active?copy(active):undefined},
  async start(context:TimerContext,now=new Date()){
    return unwrapMutation(await repository.mutate(state=>{
      if(state.active)throw validationFailure('A global timer is already active')
      const instant=now.toISOString(),active:TimerSession={...context,id:stableId('timer'),status:'running',startedAt:instant,lastResumedAt:instant,accumulatedSeconds:0}
      return{state:{active},value:active}
    }))
  },
  async pause(now=new Date()){return unwrapMutation(await repository.mutate(state=>{if(!state.active)throw validationFailure('No active timer');const active={...state.active,status:'paused' as const,accumulatedSeconds:elapsed(state.active,now)};return{state:{active},value:active}}))},
  async resume(now=new Date()){return unwrapMutation(await repository.mutate(state=>{if(!state.active)throw validationFailure('No active timer');const active={...state.active,status:'running' as const,lastResumedAt:now.toISOString()};return{state:{active},value:active}}))},
  async finish(now=new Date()){
    const session=(await repository.getState()).active
    if(!session)throw validationFailure('No active timer to finish')
    const durationSeconds=elapsed(session,now)
    const entry=await TimeEntryService.record({projectId:session.projectId,taskId:session.taskId,paperId:session.paperId,experimentId:session.experimentId,stageId:session.stageId,timerSessionId:session.id,startedAt:session.startedAt,endedAt:now.toISOString(),durationSeconds})
    unwrapMutation(await repository.mutate(state=>({state:state.active?.id===session.id?{}:state,value:entry})))
    return entry
  },
  async discard(){return unwrapMutation(await repository.mutate(state=>({state:{},value:state.active})))},
  reset(){return repository.reset()},
  invalidate(){repository.invalidate()},
}
