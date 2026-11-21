export type RepositoryDomain='tasks'|'resources'|'literature'|'planning'|'experiments'|'submissions'

export interface StoredEnvelope<T>{
  domain:RepositoryDomain
  schemaVersion:number
  seedVersion:number
  updatedAt:string
  data:T
}

export type BackupStage='schema-migration'|'seed-merge'
export interface BackupMetadata{
  stage:BackupStage
  sourceSchemaVersion:number
  targetSchemaVersion:number
  sourceSeedVersion:number
  targetSeedVersion:number
  createdAt:string
}

export interface PersistenceAdapter{
  readonly kind:'indexeddb'|'memory'
  read<T>(domain:RepositoryDomain):Promise<StoredEnvelope<T>|undefined>
  write<T>(envelope:StoredEnvelope<T>):Promise<void>
  backup<T>(envelope:StoredEnvelope<T>,metadata:BackupMetadata):Promise<void>
  remove(domain:RepositoryDomain):Promise<void>
}

export interface RepositoryContract<T>{
  readonly domain:RepositoryDomain
  getState():Promise<T>
  mutate<R>(operation:(current:T)=>{state:T;value:R}|Promise<{state:T;value:R}>):Promise<MutationResult<R>>
  replace(state:T):Promise<MutationResult<T>>
  reset():Promise<void>
  invalidate():void
}

export interface TaskRepository<T> extends RepositoryContract<T>{readonly domain:'tasks'}
export interface ResourceRepository<T> extends RepositoryContract<T>{readonly domain:'resources'}
export interface LiteratureRepository<T> extends RepositoryContract<T>{readonly domain:'literature'}
export interface PlanningRepository<T> extends RepositoryContract<T>{readonly domain:'planning'}
export interface ExperimentRepositoryContract<T> extends RepositoryContract<T>{readonly domain:'experiments'}
export interface SubmissionRepository<T> extends RepositoryContract<T>{readonly domain:'submissions'}

export type MutationErrorCode='persistence-unavailable'|'migration-failed'|'validation-failed'|'not-found'|'unknown'
export interface MutationFailure{code:MutationErrorCode;message:string;cause?:unknown;retryable:boolean}
export type MutationResult<T>={ok:true;value:T}|{ok:false;error:MutationFailure}

export class WorkspaceMutationError extends Error{
  readonly failure:MutationFailure
  constructor(failure:MutationFailure){super(failure.message);this.name='WorkspaceMutationError';this.failure=failure}
}

export class RepositoryOperationError extends Error{
  readonly code:MutationErrorCode
  readonly retryable:boolean
  readonly cause?:unknown
  constructor(code:MutationErrorCode,message:string,options?:{cause?:unknown;retryable?:boolean}){
    super(message)
    this.name='RepositoryOperationError'
    this.code=code
    this.retryable=options?.retryable??code==='persistence-unavailable'
    this.cause=options?.cause
  }
}

export const validationFailure=(message:string,cause?:unknown)=>new RepositoryOperationError('validation-failed',message,{cause})
export const notFoundFailure=(message:string,cause?:unknown)=>new RepositoryOperationError('not-found',message,{cause})

export function unwrapMutation<T>(result:MutationResult<T>):T{
  if(!result.ok)throw new WorkspaceMutationError(result.error)
  return result.value
}
