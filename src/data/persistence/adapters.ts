import type { BackupMetadata, PersistenceAdapter, RepositoryDomain, StoredEnvelope } from './contracts'

const DATABASE_NAME='personal-workspace'
const DATABASE_VERSION=1
const RECORDS='records'
const BACKUPS='migration-backups'

export class MemoryPersistenceAdapter implements PersistenceAdapter{
  readonly kind='memory' as const
  private records=new Map<RepositoryDomain,StoredEnvelope<unknown>>()
  readonly backups:Array<{envelope:StoredEnvelope<unknown>;metadata:BackupMetadata}>=[]
  async read<T>(domain:RepositoryDomain){const value=this.records.get(domain);return value?structuredClone(value) as StoredEnvelope<T>:undefined}
  async write<T>(envelope:StoredEnvelope<T>){this.records.set(envelope.domain,structuredClone(envelope) as StoredEnvelope<unknown>)}
  async backup<T>(envelope:StoredEnvelope<T>,metadata:BackupMetadata){this.backups.push({envelope:structuredClone(envelope) as StoredEnvelope<unknown>,metadata:structuredClone(metadata)})}
  async remove(domain:RepositoryDomain){this.records.delete(domain)}
}

export class IndexedDbPersistenceAdapter implements PersistenceAdapter{
  readonly kind='indexeddb' as const
  private database?:Promise<IDBDatabase>
  private open(){
    if(this.database)return this.database
    this.database=new Promise((resolve,reject)=>{
      const request=indexedDB.open(DATABASE_NAME,DATABASE_VERSION)
      request.onupgradeneeded=()=>{
        const db=request.result
        if(!db.objectStoreNames.contains(RECORDS))db.createObjectStore(RECORDS,{keyPath:'domain'})
        if(!db.objectStoreNames.contains(BACKUPS))db.createObjectStore(BACKUPS,{keyPath:'id'})
      }
      request.onsuccess=()=>resolve(request.result)
      request.onerror=()=>reject(request.error??new Error('Unable to open IndexedDB'))
      request.onblocked=()=>reject(new Error('IndexedDB upgrade is blocked by another tab'))
    })
    return this.database
  }
  private async request<T>(mode:IDBTransactionMode,storeName:string,run:(store:IDBObjectStore)=>IDBRequest<T>){
    const db=await this.open()
    return new Promise<T>((resolve,reject)=>{
      const transaction=db.transaction(storeName,mode),request=run(transaction.objectStore(storeName))
      let result:T
      request.onsuccess=()=>{result=request.result}
      request.onerror=()=>reject(request.error??new Error('IndexedDB request failed'))
      transaction.onabort=()=>reject(transaction.error??new Error('IndexedDB transaction aborted'))
      transaction.oncomplete=()=>resolve(result)
    })
  }
  async read<T>(domain:RepositoryDomain){return this.request<StoredEnvelope<T>|undefined>('readonly',RECORDS,store=>store.get(domain))}
  async write<T>(envelope:StoredEnvelope<T>){await this.request<IDBValidKey>('readwrite',RECORDS,store=>store.put(envelope))}
  async backup<T>(envelope:StoredEnvelope<T>,metadata:BackupMetadata){await this.request<IDBValidKey>('readwrite',BACKUPS,store=>store.put({id:`${envelope.domain}:${Date.now()}:${crypto.randomUUID?.()??Math.random()}`,domain:envelope.domain,metadata,createdAt:metadata.createdAt,envelope}))}
  async remove(domain:RepositoryDomain){await this.request<undefined>('readwrite',RECORDS,store=>store.delete(domain))}
}

let activeAdapter:PersistenceAdapter=typeof indexedDB==='undefined'?new MemoryPersistenceAdapter():new IndexedDbPersistenceAdapter()
export const WorkspacePersistence={
  get adapter(){return activeAdapter},
  configure(adapter:PersistenceAdapter){activeAdapter=adapter},
  adapterKind(){return activeAdapter.kind},
}
