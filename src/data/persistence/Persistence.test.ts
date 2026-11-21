import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryPersistenceAdapter, WorkspacePersistence } from './adapters'
import { createVersionedRepository } from './repository'
import { notFoundFailure, validationFailure } from './contracts'
import { GlobalTaskService } from '../../services/globalTaskService'
import { LiteratureService } from '../../features/research/literature/services/literatureService'
import { PlanningService } from '../../features/research/planning/services/planningService'
import { ResearchProjectService } from '../../features/research/services/researchProjectService'

describe('versioned workspace persistence',()=>{
  let adapter:MemoryPersistenceAdapter
  beforeEach(async()=>{
    adapter=new MemoryPersistenceAdapter()
    WorkspacePersistence.configure(adapter)
    await Promise.all([GlobalTaskService.reset(),LiteratureService.reset(),PlanningService.reset()])
  })

  it('survives repository recreation without inserting Demo seed twice',async()=>{
    const first=createVersionedRepository({domain:'submissions' as const,schemaVersion:1,seedVersion:1,seed:()=>[{id:'seed'}]})
    const initial=await first.getState()
    expect(initial).toEqual([{id:'seed'}])
    expect((await first.mutate(rows=>({state:[...rows,{id:'user'}],value:true}))).ok).toBe(true)
    const afterRefresh=createVersionedRepository({domain:'submissions' as const,schemaVersion:1,seedVersion:1,seed:()=>[{id:'seed'}]})
    expect(await afterRefresh.getState()).toEqual([{id:'seed'},{id:'user'}])
  })

  it('backs up data before a schema migration and keeps existing records',async()=>{
    const v1=createVersionedRepository({domain:'experiments' as const,schemaVersion:1,seedVersion:1,seed:()=>({records:[{id:'existing'}]})})
    await v1.getState()
    const v2=createVersionedRepository({domain:'experiments' as const,schemaVersion:2,seedVersion:1,seed:()=>({records:[] as Array<{id:string}>,migrated:false}),migrate:(data)=>({...data as {records:Array<{id:string}>},migrated:true})})
    expect(await v2.getState()).toEqual({records:[{id:'existing'}],migrated:true})
    expect(adapter.backups).toHaveLength(1)
  })

  it('returns a typed failure and does not commit memory when durable write fails',async()=>{
    const failing=new MemoryPersistenceAdapter(),repo=createVersionedRepository({domain:'resources' as const,schemaVersion:1,seedVersion:1,seed:()=>[{id:'seed'}]})
    WorkspacePersistence.configure(failing)
    await repo.getState()
    failing.write=async()=>{throw new Error('quota exceeded')}
    const result=await repo.mutate(rows=>({state:[...rows,{id:'unsafe'}],value:true}))
    expect(result).toMatchObject({ok:false,error:{code:'persistence-unavailable',retryable:true}})
    if(!result.ok)expect(result.error.message).toContain('quota exceeded')
    expect(await repo.getState()).toEqual([{id:'seed'}])
  })

  it('does not cache a Seed whose first durable write fails',async()=>{
    const failing=new MemoryPersistenceAdapter(),originalWrite=failing.write.bind(failing)
    let attempts=0
    failing.write=async envelope=>{attempts++;if(attempts===1)throw new Error('seed write failed');await originalWrite(envelope)}
    WorkspacePersistence.configure(failing)
    const repo=createVersionedRepository({domain:'submissions' as const,schemaVersion:1,seedVersion:1,seed:()=>[{id:'seed'}]})
    await expect(repo.getState()).rejects.toMatchObject({code:'persistence-unavailable'})
    expect(await failing.read('submissions')).toBeUndefined()
    expect(await repo.getState()).toEqual([{id:'seed'}])
    expect(attempts).toBe(2)
  })

  it('does not cache a migration whose write-back fails',async()=>{
    const v1=createVersionedRepository({domain:'experiments' as const,schemaVersion:1,seedVersion:1,seed:()=>({value:'stored'})})
    await v1.getState()
    const originalWrite=adapter.write.bind(adapter)
    let fail=true
    adapter.write=async envelope=>{if(fail&&envelope.domain==='experiments'&&envelope.schemaVersion===2)throw new Error('migration commit failed');await originalWrite(envelope)}
    const v2=createVersionedRepository({domain:'experiments' as const,schemaVersion:2,seedVersion:1,seed:()=>({value:'seed',migrated:true}),migrate:data=>({...data as {value:string},migrated:true})})
    await expect(v2.getState()).rejects.toMatchObject({code:'persistence-unavailable'})
    expect((await adapter.read('experiments'))?.schemaVersion).toBe(1)
    fail=false
    expect(await v2.getState()).toEqual({value:'stored',migrated:true})
  })

  it('keeps the last committed Cache when reset fails',async()=>{
    const repo=createVersionedRepository({domain:'resources' as const,schemaVersion:1,seedVersion:1,seed:()=>[{id:'seed'}]})
    await repo.getState()
    await repo.mutate(rows=>({state:[...rows,{id:'user'}],value:true}))
    adapter.write=async()=>{throw new Error('reset failed')}
    await expect(repo.reset()).rejects.toMatchObject({code:'persistence-unavailable'})
    expect(await repo.getState()).toEqual([{id:'seed'},{id:'user'}])
  })

  it('backs up the original and schema-migrated envelopes at their actual stages',async()=>{
    const v1=createVersionedRepository({domain:'experiments' as const,schemaVersion:1,seedVersion:1,seed:()=>({records:['original'],schema:false,seed:false})})
    await v1.getState()
    const v2=createVersionedRepository({domain:'experiments' as const,schemaVersion:2,seedVersion:2,seed:()=>({records:['demo'],schema:true,seed:true}),migrate:data=>({...data as {records:string[];seed:boolean},schema:true}),mergeSeed:stored=>({...stored,seed:true})})
    expect(await v2.getState()).toEqual({records:['original'],schema:true,seed:true})
    const recent=adapter.backups.slice(-2)
    expect(recent.map(item=>item.metadata.stage)).toEqual(['schema-migration','seed-merge'])
    expect(recent[0].envelope).toMatchObject({schemaVersion:1,seedVersion:1,data:{schema:false,seed:false}})
    expect(recent[1].envelope).toMatchObject({schemaVersion:2,seedVersion:1,data:{schema:true,seed:false}})
  })

  it('maps explicit business failures without treating them as retryable storage faults',async()=>{
    const repo=createVersionedRepository({domain:'resources' as const,schemaVersion:1,seedVersion:1,seed:()=>[] as string[]})
    const validation=await repo.mutate(()=>{throw validationFailure('Bad input')})
    const missing=await repo.mutate(()=>{throw notFoundFailure('Missing record')})
    const unknown=await repo.mutate(()=>{throw new Error('Unexpected business failure')})
    expect(validation).toMatchObject({ok:false,error:{code:'validation-failed',retryable:false}})
    expect(missing).toMatchObject({ok:false,error:{code:'not-found',retryable:false}})
    expect(unknown).toMatchObject({ok:false,error:{code:'unknown',retryable:false}})
    await expect(GlobalTaskService.update('missing-task',{})).rejects.toMatchObject({failure:{code:'not-found',retryable:false}})
  })

  it('classifies missing migration support without message matching',async()=>{
    const old=createVersionedRepository({domain:'experiments' as const,schemaVersion:1,seedVersion:1,seed:()=>({id:'old'})})
    await old.getState()
    const current=createVersionedRepository({domain:'experiments' as const,schemaVersion:2,seedVersion:1,seed:()=>({id:'new'})})
    await expect(current.getState()).rejects.toMatchObject({code:'migration-failed',retryable:false})
  })

  it('serializes concurrent mutations so one write cannot erase another',async()=>{
    const repo=createVersionedRepository({domain:'resources' as const,schemaVersion:1,seedVersion:1,seed:()=>[] as Array<{id:string}>})
    await Promise.all([
      repo.mutate(rows=>({state:[...rows,{id:'first'}],value:true})),
      repo.mutate(rows=>({state:[...rows,{id:'second'}],value:true})),
    ])
    expect((await repo.getState()).map(item=>item.id)).toEqual(['first','second'])
  })

  it('keeps persisted task and paper state after service cache invalidation',async()=>{
    const task=await GlobalTaskService.create({projectId:'adaptive-agents',title:'Persistent reading review',stage:'Literature review',taskType:'reading',paperIds:['demo-library:SURVEY4']})
    await LiteratureService.updateProjectState('demo-library:SURVEY4','adaptive-agents',{readingStatus:'reading',note:'Persist this note'})
    GlobalTaskService.invalidate();LiteratureService.invalidate()
    expect((await GlobalTaskService.get(task.id))?.title).toBe('Persistent reading review')
    const paper=(await LiteratureService.getSnapshot()).papers.find(item=>item.stableId==='demo-library:SURVEY4')!
    expect(paper.projectStates['adaptive-agents']).toMatchObject({readingStatus:'reading',note:'Persist this note'})
  })

  it('builds Overview from canonical Literature and Planning records',async()=>{
    await LiteratureService.updateProjectState('demo-library:SURVEY4','adaptive-agents',{readingStatus:'read'})
    await PlanningService.updateStage('s2',{name:'Canonical method design'})
    const project=await ResearchProjectService.getProject('adaptive-agents')
    expect(project.literature.find(item=>item.id==='demo-library:SURVEY4')?.readingStatus).toBe('reviewed')
    expect(project.stages.find(item=>item.id==='s2')?.label).toBe('Canonical method design')
    expect(project.timeEntries.map(item=>item.id)).toContain('e1')
  })

  it('uses the same canonical stage across every Research route reload',async()=>{
    await PlanningService.updateStage('s2',{name:'Cross-route canonical stage'})
    for(const section of ['overview','literature','tasks','experiments','files','timeline','submissions']){
      const project=await ResearchProjectService.getProject('adaptive-agents')
      expect(project.stages.find(item=>item.id==='s2')?.label,section).toBe('Cross-route canonical stage')
      expect(project.currentStage,section).toBe('Cross-route canonical stage')
    }
  })
})
