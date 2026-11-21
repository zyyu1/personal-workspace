import { WorkspacePersistence } from './adapters'
import { RepositoryOperationError } from './contracts'
import type { BackupMetadata, MutationFailure, RepositoryContract, RepositoryDomain, StoredEnvelope } from './contracts'

interface RepositoryOptions<T>{
  domain:RepositoryDomain
  schemaVersion:number
  seedVersion:number
  seed:()=>T
  migrate?:(data:unknown,fromVersion:number)=>T
  mergeSeed?:(stored:T,seed:T,fromSeedVersion:number)=>T
}

const clone=<T>(value:T):T=>structuredClone(value)
const persistenceError=(cause:unknown,action:string)=>cause instanceof RepositoryOperationError?cause:new RepositoryOperationError('persistence-unavailable',`${action}: ${cause instanceof Error?cause.message:'workspace persistence failed'}`,{cause,retryable:true})
const failure=(cause:unknown):MutationFailure=>cause instanceof RepositoryOperationError
  ?{code:cause.code,message:cause.message,cause:cause.cause??cause,retryable:cause.retryable}
  :{code:'unknown',message:cause instanceof Error?cause.message:'Workspace operation failed',cause,retryable:false}

export function createVersionedRepository<T>(options:RepositoryOptions<T>):RepositoryContract<T>{
  let cache:T|undefined
  let mutationQueue:Promise<unknown>=Promise.resolve()
  const envelope=(data:T):StoredEnvelope<T>=>({domain:options.domain,schemaVersion:options.schemaVersion,seedVersion:options.seedVersion,updatedAt:new Date().toISOString(),data:clone(data)})
  const backupMetadata=(stage:BackupMetadata['stage'],source:StoredEnvelope<T>):BackupMetadata=>({stage,sourceSchemaVersion:source.schemaVersion,targetSchemaVersion:options.schemaVersion,sourceSeedVersion:source.seedVersion,targetSeedVersion:options.seedVersion,createdAt:new Date().toISOString()})
  const load=async()=>{
    if(cache!==undefined)return clone(cache)
    let stored:StoredEnvelope<T>|undefined
    try{stored=await WorkspacePersistence.adapter.read<T>(options.domain)}catch(cause){throw persistenceError(cause,`Unable to read ${options.domain}`)}
    if(!stored){
      const next=options.seed(),nextEnvelope=envelope(next)
      try{await WorkspacePersistence.adapter.write(nextEnvelope)}catch(cause){throw persistenceError(cause,`Unable to initialize ${options.domain}`)}
      cache=clone(next)
      return clone(cache)
    }
    if(stored.schemaVersion>options.schemaVersion)throw new RepositoryOperationError('migration-failed',`${options.domain} data uses unsupported schema version ${stored.schemaVersion}`)
    if(stored.seedVersion>options.seedVersion)throw new RepositoryOperationError('migration-failed',`${options.domain} data uses unsupported seed version ${stored.seedVersion}`)
    let data=stored.data
    let intermediate=clone(stored)
    if(stored.schemaVersion<options.schemaVersion){
      if(!options.migrate)throw new RepositoryOperationError('migration-failed',`No migration registered for ${options.domain} schema ${stored.schemaVersion}`)
      try{await WorkspacePersistence.adapter.backup(stored,backupMetadata('schema-migration',stored))}catch(cause){throw persistenceError(cause,`Unable to back up ${options.domain} before schema migration`)}
      try{data=options.migrate(stored.data,stored.schemaVersion)}catch(cause){throw new RepositoryOperationError('migration-failed',`Unable to migrate ${options.domain} schema`,{cause})}
      intermediate={...stored,schemaVersion:options.schemaVersion,updatedAt:new Date().toISOString(),data:clone(data)}
    }
    if(stored.seedVersion<options.seedVersion){
      if(!options.mergeSeed)throw new RepositoryOperationError('migration-failed',`No non-destructive seed merge registered for ${options.domain} seed ${stored.seedVersion}`)
      try{await WorkspacePersistence.adapter.backup(intermediate,backupMetadata('seed-merge',intermediate))}catch(cause){throw persistenceError(cause,`Unable to back up ${options.domain} before seed merge`)}
      try{data=options.mergeSeed(data,options.seed(),stored.seedVersion)}catch(cause){throw new RepositoryOperationError('migration-failed',`Unable to merge ${options.domain} seed`,{cause})}
      intermediate={...intermediate,seedVersion:options.seedVersion,updatedAt:new Date().toISOString(),data:clone(data)}
    }
    if(stored.schemaVersion!==options.schemaVersion||stored.seedVersion!==options.seedVersion){
      try{await WorkspacePersistence.adapter.write(envelope(data))}catch(cause){throw persistenceError(cause,`Unable to commit ${options.domain} migration`)}
    }
    cache=clone(data)
    return clone(cache)
  }
  return{
    domain:options.domain,
    getState:load,
    mutate(operation){
      const run=async()=>{
      try{
        const current=await load(),next=await operation(clone(current))
        try{await WorkspacePersistence.adapter.write(envelope(next.state))}catch(cause){throw persistenceError(cause,`Unable to save ${options.domain}`)}
        cache=clone(next.state)
        return{ok:true as const,value:clone(next.value)}
      }catch(cause){return{ok:false as const,error:failure(cause)}}
      }
      const result=mutationQueue.then(run,run)
      mutationQueue=result.then(()=>undefined,()=>undefined)
      return result
    },
    replace(state){
      const run=async()=>{try{try{await WorkspacePersistence.adapter.write(envelope(state))}catch(cause){throw persistenceError(cause,`Unable to replace ${options.domain}`)}cache=clone(state);return{ok:true as const,value:clone(state)}}catch(cause){return{ok:false as const,error:failure(cause)}}}
      const result=mutationQueue.then(run,run)
      mutationQueue=result.then(()=>undefined,()=>undefined)
      return result
    },
    async reset(){
      const next=options.seed()
      const write=mutationQueue.then(async()=>{try{await WorkspacePersistence.adapter.write(envelope(next))}catch(cause){throw persistenceError(cause,`Unable to reset ${options.domain}`)}cache=clone(next)})
      mutationQueue=write.then(()=>undefined,()=>undefined)
      await write
    },
    invalidate(){cache=undefined},
  }
}

export const stableId=(prefix:string)=>`${prefix}-${typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`}`
