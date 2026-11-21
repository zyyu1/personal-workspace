import { createVersionedRepository, stableId, unwrapMutation, validationFailure } from '../data/persistence'
import type { TimeEntry } from '../features/research/types'

const copy=<T>(value:T):T=>structuredClone(value)
const repository=createVersionedRepository<TimeEntry[]>({domain:'time-entries',schemaVersion:1,seedVersion:1,seed:()=>[]})

export interface TimeEntryInput extends Omit<TimeEntry,'id'|'date'|'minutes'>{date?:string;minutes?:number}

export const TimeEntryService={
  async list(projectId?:string){const rows=await repository.getState();return copy(projectId?rows.filter(row=>row.projectId===projectId):rows)},
  async record(input:TimeEntryInput){
    if(!input.projectId)throw validationFailure('TimeEntry requires a project context')
    if(input.durationSeconds!==undefined&&input.durationSeconds<0)throw validationFailure('Actual duration cannot be negative')
    return unwrapMutation(await repository.mutate(rows=>{
      const existing=input.timerSessionId?rows.find(row=>row.timerSessionId===input.timerSessionId):undefined
      if(existing)return{state:rows,value:existing}
      const date=input.date??(input.endedAt??input.startedAt??new Date().toISOString()).slice(0,10)
      const minutes=input.minutes??Math.max(0,Math.round((input.durationSeconds??0)/60))
      const item:TimeEntry={...input,id:stableId('time-entry'),date,minutes}
      return{state:[...rows,item],value:item}
    }))
  },
  async importLegacy(entries:TimeEntry[]){return unwrapMutation(await repository.mutate(rows=>{const ids=new Set(rows.map(row=>row.id)),sessions=new Set(rows.map(row=>row.timerSessionId).filter(Boolean));const additions=entries.filter(row=>!ids.has(row.id)&&(!row.timerSessionId||!sessions.has(row.timerSessionId)));return{state:[...rows,...copy(additions)],value:additions.length}}))},
  reset(){return repository.reset()},
  invalidate(){repository.invalidate()},
}
