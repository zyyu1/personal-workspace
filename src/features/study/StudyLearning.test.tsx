import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MemoryPersistenceAdapter, WorkspacePersistence } from '../../data/persistence'
import { GlobalResourceService } from '../../services/globalResourceService'
import { GlobalTaskService } from '../../services/globalTaskService'
import { TimeEntryService } from '../../services/timeEntryService'
import { WorkspaceResumeService } from '../../services/workspaceResumeService'
import { StudyCourseService, StudyRepository } from './services/studyCourseService'
import { StudyLearningService } from './services/studyLearningService'
import { CourseWorkspace } from './components/CourseWorkspace'
import type { StudyState } from './types'

const offeringId='offering-system-theory-ws26'
const manifest={sourceLabel:'sheet.zip',sourceFingerprint:'sheet:1',sourceKind:'archive' as const,entries:[{relativePath:'Exercises/Sheet_01.pdf',entryType:'file' as const,size:100,compressedSize:80,classification:'exercises' as const,classificationConfidence:'medium' as const,safe:true}],failures:[],totals:{discovered:1,accepted:1,rejected:0,uncompressedBytes:100},canConfirm:true}

beforeEach(async()=>{
  cleanup()
  WorkspacePersistence.configure(new MemoryPersistenceAdapter())
  await Promise.all([StudyCourseService.reset(),GlobalResourceService.reset(),GlobalTaskService.reset(),TimeEntryService.reset(),WorkspaceResumeService.reset()])
  StudyLearningService.invalidate()
})

describe('Module 008 schema and canonical identities',()=>{
  it('migrates v1 progress without dropping ids, manual classification, or legacy fields',async()=>{
    const adapter=WorkspacePersistence.adapter as MemoryPersistenceAdapter,envelope=await adapter.read<StudyState>('study-courses')
    const legacy={...envelope!.data,entries:[{id:'entry-old',sourceId:'source-old',resourceId:'resource-old',relativePath:'Notes.md',entryType:'file' as const,classification:'notes' as const,classificationConfidence:'low' as const,safe:true,status:'available' as const,manualClassification:true}],progress:[{id:'progress-old',offeringId,resourceId:'resource-old',sectionId:'section-old',state:'reviewed' as const,updatedAt:'2026-01-01T00:00:00.000Z',noteId:'note-old'}]}
    const v1={...envelope!,schemaVersion:1,data:legacy} as typeof envelope
    await adapter.write(v1!);StudyCourseService.invalidate()
    const migrated=await StudyRepository.getState(),progress=migrated.progress[0]
    expect(progress).toMatchObject({id:'progress-old',offeringId,targetType:'resource',targetId:'resource-old',resourceId:'resource-old',sectionId:'section-old',state:'reviewed',studyState:'studied',noteId:'note-old'})
    expect(migrated.entries[0]).toMatchObject({id:'entry-old',manualClassification:true,classification:'notes'})
    expect(migrated).toMatchObject({learningUnits:[],exerciseSets:[],exerciseItems:[],attempts:[],evidenceLinks:[]})
    expect(adapter.backups.some(row=>row.metadata.stage==='schema-migration'&&row.metadata.sourceSchemaVersion===1&&row.metadata.targetSchemaVersion===3)).toBe(true)
  })

  it('isolates all learning records by CourseOffering',async()=>{
    const second=await StudyCourseService.createTermOffering('course-system-theory',{term:'Summer 2027',enrollmentStatus:'active'})
    const firstUnit=await StudyLearningService.createUnit(offeringId,{title:'Signals'}),secondUnit=await StudyLearningService.createUnit(second.id,{title:'Signals'})
    await StudyLearningService.setUnitProgress(offeringId,firstUnit.id,{studyState:'studied'})
    expect((await StudyLearningService.getSnapshot(second.id))?.progress).toEqual([])
    expect((await StudyLearningService.getSnapshot(offeringId))?.units.map(row=>row.id)).toEqual([firstUnit.id])
    expect(secondUnit.id).not.toBe(firstUnit.id)
  })

  it('persists Module 008 entities across repository invalidation',async()=>{
    const unit=await StudyLearningService.createUnit(offeringId,{title:'State space'}),set=await StudyLearningService.createSet(offeringId,{title:'Sheet 1',kind:'exercise',learningUnitId:unit.id}),item=await StudyLearningService.createItem(offeringId,set.id,{itemCode:'A2(a)',learningUnitId:unit.id})
    await StudyLearningService.setUnitProgress(offeringId,unit.id,{studyState:'in_progress',masteryState:'practicing'});await StudyLearningService.logAttempt(offeringId,item.id,{outcome:'partial'})
    StudyLearningService.invalidate()
    expect(await StudyLearningService.getSnapshot(offeringId)).toMatchObject({units:[{id:unit.id}],sets:[{id:set.id}],items:[{id:item.id}],attempts:[{exerciseItemId:item.id,outcome:'partial'}],progress:[{targetId:unit.id}]})
  })

  it('preserves omitted patch metadata, persists it, and only clears explicit optional fields',async()=>{
    const unit=await StudyLearningService.createUnit(offeringId,{title:'State space',code:'ST-1',description:'Saved description'}),set=await StudyLearningService.createSet(offeringId,{title:'Sheet 1',setCode:'S-1',kind:'exercise'}),item=await StudyLearningService.createItem(offeringId,set.id,{itemCode:'A1',title:'Saved title',sourcePointer:'p. 4'}),attempt=await StudyLearningService.logAttempt(offeringId,item.id,{outcome:'partial',notes:'Saved note',difficulty:'hard'})
    await StudyLearningService.updateUnit(offeringId,unit.id,{includeInCoverage:false});await StudyLearningService.updateSet(offeringId,set.id,{kind:'tutorial'});await StudyLearningService.updateItem(offeringId,item.id,{includeInCoverage:false});await StudyLearningService.reviseAttempt(offeringId,attempt.id,{outcome:'correct'})
    StudyLearningService.invalidate()
    const saved=await StudyLearningService.getSnapshot(offeringId)
    expect(saved?.units[0]).toMatchObject({code:'ST-1',description:'Saved description',includeInCoverage:false})
    expect(saved?.sets[0]).toMatchObject({setCode:'S-1',kind:'tutorial'})
    expect(saved?.items[0]).toMatchObject({title:'Saved title',sourcePointer:'p. 4',includeInCoverage:false})
    expect(saved?.attempts[0]).toMatchObject({notes:'Saved note',difficulty:'hard',outcome:'correct'})
    await StudyLearningService.updateUnit(offeringId,unit.id,{code:' '});await StudyLearningService.updateSet(offeringId,set.id,{setCode:''});await StudyLearningService.updateItem(offeringId,item.id,{title:'',sourcePointer:' '});await StudyLearningService.reviseAttempt(offeringId,attempt.id,{notes:''})
    StudyLearningService.invalidate()
    const cleared=await StudyLearningService.getSnapshot(offeringId)
    expect(cleared?.units[0].code).toBeUndefined();expect(cleared?.sets[0].setCode).toBeUndefined();expect(cleared?.items[0]).toMatchObject({title:undefined,sourcePointer:undefined});expect(cleared?.attempts[0].notes).toBeUndefined()
  })
})

describe('learning structure and derived progress',()=>{
  it('supports nesting and rejects hierarchy cycles',async()=>{
    const parent=await StudyLearningService.createUnit(offeringId,{title:'Chapter'}),child=await StudyLearningService.createUnit(offeringId,{title:'Topic',parentUnitId:parent.id})
    await expect(StudyLearningService.updateUnit(offeringId,parent.id,{parentUnitId:child.id})).rejects.toThrow(/cycle/i)
  })

  it('uses eligible leaf units only and never invents an empty percentage',async()=>{
    expect((await StudyLearningService.queryProgress(offeringId)).unit).toMatchObject({tracked:0,percentage:undefined})
    const parent=await StudyLearningService.createUnit(offeringId,{title:'Chapter'}),child=await StudyLearningService.createUnit(offeringId,{title:'Topic',parentUnitId:parent.id}),excluded=await StudyLearningService.createUnit(offeringId,{title:'Appendix',includeInCoverage:false})
    await StudyLearningService.setUnitProgress(offeringId,parent.id,{studyState:'studied'});await StudyLearningService.setUnitProgress(offeringId,child.id,{studyState:'studied',masteryState:'confident'});await StudyLearningService.setUnitProgress(offeringId,excluded.id,{studyState:'studied'})
    expect((await StudyLearningService.queryProgress(offeringId)).unit).toMatchObject({tracked:1,studied:1,confident:1,percentage:100})
  })

  it('keeps study state, mastery, and review metadata independent',async()=>{
    const unit=await StudyLearningService.createUnit(offeringId,{title:'Observers'})
    await StudyLearningService.setUnitProgress(offeringId,unit.id,{studyState:'studied',masteryState:'needs_review',needsReview:true,reviewOn:'2026-12-01'})
    await StudyLearningService.setUnitProgress(offeringId,unit.id,{markReviewed:true})
    expect((await StudyLearningService.getSnapshot(offeringId))?.progress[0]).toMatchObject({studyState:'studied',masteryState:'needs_review',needsReview:false,reviewOn:'2026-12-01'})
  })

  it('orders siblings and archives without deleting evidence',async()=>{
    const first=await StudyLearningService.createUnit(offeringId,{title:'First'}),second=await StudyLearningService.createUnit(offeringId,{title:'Second'})
    await StudyLearningService.moveUnit(offeringId,second.id,-1);await StudyLearningService.setUnitProgress(offeringId,first.id,{studyState:'studied'});await StudyLearningService.archiveUnit(offeringId,first.id)
    const snapshot=await StudyLearningService.getSnapshot(offeringId)
    expect(snapshot?.units.find(row=>row.id===second.id)?.order).toBe(0)
    expect(snapshot?.units.find(row=>row.id===first.id)?.archivedAt).toBeTruthy()
    expect(snapshot?.progress.find(row=>row.targetId===first.id)).toBeTruthy()
    expect((await StudyLearningService.queryProgress(offeringId)).unit.tracked).toBe(1)
  })
})

describe('exercise identity, attempts, and integrations',()=>{
  it('keeps A2(a) and A2(c) distinct while concurrent duplicate imports are idempotent',async()=>{
    const set=await StudyLearningService.createSet(offeringId,{title:'Sheet A',kind:'exercise'}),[a,duplicate]=await Promise.all([StudyLearningService.createItem(offeringId,set.id,{itemCode:' A2(a) '}),StudyLearningService.createItem(offeringId,set.id,{itemCode:'A2(a)'})]),c=await StudyLearningService.createItem(offeringId,set.id,{itemCode:'A2(c)'})
    expect(duplicate.id).toBe(a.id);expect(c.id).not.toBe(a.id)
    expect((await StudyLearningService.getSnapshot(offeringId))?.items).toHaveLength(2)
  })

  it('preserves multiple attempts without using them as solved truth',async()=>{
    const set=await StudyLearningService.createSet(offeringId,{title:'KGU',kind:'kgu'}),item=await StudyLearningService.createItem(offeringId,set.id,{itemCode:'K1'})
    await Promise.all([StudyLearningService.logAttempt(offeringId,item.id,{outcome:'incorrect'}),StudyLearningService.logAttempt(offeringId,item.id,{outcome:'correct'})])
    expect((await StudyLearningService.getSnapshot(offeringId))?.attempts).toHaveLength(2)
    expect((await StudyLearningService.queryProgress(offeringId)).exercise).toMatchObject({tracked:1,attempted:1,solved:0})
    await StudyLearningService.setItemProgress(offeringId,item.id,{solveState:'solved'})
    expect((await StudyLearningService.queryProgress(offeringId)).exercise).toMatchObject({solved:1,solvedPercentage:100})
  })

  it('links canonical Resources without changing file availability',async()=>{
    const unit=await StudyLearningService.createUnit(offeringId,{title:'Evidence'}),before=await GlobalResourceService.get('r-survey-url')
    await StudyLearningService.linkUnitResource(offeringId,unit.id,'r-survey-url')
    const after=await GlobalResourceService.get('r-survey-url')
    expect(after?.byteAvailability).toBe(before?.byteAvailability)
    expect(after?.links.some(row=>row.entityType==='learning-unit'&&row.entityId===unit.id)).toBe(true)
    expect((await StudyLearningService.getSnapshot(offeringId))?.evidenceLinks).toMatchObject([{targetId:unit.id,resourceId:'r-survey-url'}])
  })

  it('links a real Resource to a Set and Item through canonical ResourceLinks',async()=>{
    const set=await StudyLearningService.createSet(offeringId,{title:'Resource sheet',kind:'exercise',sourceResourceIds:['r-survey-url']}),item=await StudyLearningService.createItem(offeringId,set.id,{itemCode:'R1'})
    const resource=await GlobalResourceService.get('r-survey-url')
    expect(set.sourceResourceIds).toEqual(['r-survey-url']);expect(item.sourceResourceIds).toEqual(['r-survey-url'])
    expect(resource?.links).toEqual(expect.arrayContaining([expect.objectContaining({entityType:'exercise-set',entityId:set.id}),expect.objectContaining({entityType:'exercise-item',entityId:item.id})]))
  })

  it('keeps learning history when Resource access is detached or unavailable',async()=>{
    const unit=await StudyLearningService.createUnit(offeringId,{title:'Offline evidence'});await StudyLearningService.setUnitProgress(offeringId,unit.id,{studyState:'studied',needsReview:true});await StudyLearningService.linkUnitResource(offeringId,unit.id,'r-survey-url');await GlobalResourceService.unlinkResource('r-survey-url',{type:'learning-unit',id:unit.id})
    expect((await StudyLearningService.getSnapshot(offeringId))?.progress).toMatchObject([{targetId:unit.id,studyState:'studied',needsReview:true}])
    expect((await StudyLearningService.getSnapshot(offeringId))?.units[0].resourceIds).toContain('r-survey-url')
  })

  it('does not let Resource progress or actual time implicitly complete a Unit',async()=>{
    await StudyCourseService.confirmManifest(offeringId,manifest);const resource=(await StudyCourseService.getOffering(offeringId))!.resources[0],unit=await StudyLearningService.createUnit(offeringId,{title:'Manual state only'});await StudyCourseService.markProgress(offeringId,resource.id,'studied');await TimeEntryService.record({projectId:offeringId,durationSeconds:600})
    expect((await StudyLearningService.getSnapshot(offeringId))?.progress.find(row=>row.targetId===unit.id)).toBeUndefined()
  })

  it('keeps solved and review flags together and excludes archived items from rates',async()=>{
    const set=await StudyLearningService.createSet(offeringId,{title:'Rates',kind:'exercise'}),first=await StudyLearningService.createItem(offeringId,set.id,{itemCode:'R1'}),second=await StudyLearningService.createItem(offeringId,set.id,{itemCode:'R2'});await StudyLearningService.setItemProgress(offeringId,first.id,{solveState:'solved',needsReview:true});await StudyLearningService.archiveItem(offeringId,second.id)
    expect((await StudyLearningService.getSnapshot(offeringId))?.progress[0]).toMatchObject({solveState:'solved',needsReview:true})
    expect((await StudyLearningService.queryProgress(offeringId)).exercise).toMatchObject({tracked:1,solved:1,toRetry:1,solvedPercentage:100})
  })

  it('retains resource-level progress after a source rescan',async()=>{
    await StudyCourseService.confirmManifest(offeringId,manifest);const resource=(await StudyCourseService.getOffering(offeringId))!.resources[0];await StudyCourseService.markProgress(offeringId,resource.id,'reviewed');await StudyCourseService.confirmManifest(offeringId,manifest);StudyCourseService.invalidate()
    expect((await StudyCourseService.getOffering(offeringId))?.progress.find(row=>row.targetId===resource.id)).toMatchObject({id:expect.any(String),resourceId:resource.id,state:'reviewed',studyState:'studied'})
  })

  it('creates one canonical Global Task per target across concurrent and repeated calls',async()=>{
    const unit=await StudyLearningService.createUnit(offeringId,{title:'Reachability'}),[first,concurrent]=await Promise.all([StudyLearningService.createTask(offeringId,'learning-unit',unit.id,'Study reachability'),StudyLearningService.createTask(offeringId,'learning-unit',unit.id,'Concurrent duplicate')]),again=await StudyLearningService.createTask(offeringId,'learning-unit',unit.id,'Repeated duplicate')
    expect(concurrent.id).toBe(first.id);expect(again.id).toBe(first.id)
    expect((await GlobalTaskService.list(offeringId)).filter(row=>row.id===first.id)).toHaveLength(1)
    expect((await StudyLearningService.getSnapshot(offeringId))?.evidenceLinks.filter(row=>row.targetId===unit.id&&row.taskId===first.id)).toHaveLength(1)
    expect(first).toMatchObject({area:'study',projectId:offeringId})
  })

  it('reports a partial Task relation failure and reconciles the same canonical Task on retry',async()=>{
    const unit=await StudyLearningService.createUnit(offeringId,{title:'Recovery'}),mutation=vi.spyOn(StudyRepository,'mutate').mockResolvedValueOnce({ok:false,error:{code:'persistence-unavailable',message:'Injected Study relation failure',retryable:true}})
    await expect(StudyLearningService.createTask(offeringId,'learning-unit',unit.id,'Study recovery')).rejects.toThrow(/was created.*retry to reconcile/i)
    mutation.mockRestore()
    const persisted=(await GlobalTaskService.list(offeringId)).filter(row=>row.id.includes(unit.id));expect(persisted).toHaveLength(1)
    const recovered=await StudyLearningService.createTask(offeringId,'learning-unit',unit.id,'Study recovery')
    expect(recovered.id).toBe(persisted[0].id);expect((await GlobalTaskService.list(offeringId)).filter(row=>row.id===recovered.id)).toHaveLength(1);expect((await StudyLearningService.getSnapshot(offeringId))?.evidenceLinks.filter(row=>row.taskId===recovered.id)).toHaveLength(1)
  })

  it('restores deep links for units and exercises and falls back after archive',async()=>{
    const unit=await StudyLearningService.createUnit(offeringId,{title:'Resume topic'})
    await WorkspaceResumeService.record({area:'study',projectId:offeringId,entityType:'learning-unit',entityId:unit.id,route:`/study/courses/${offeringId}/progress?unit=${unit.id}`})
    expect(await WorkspaceResumeService.resolveLatest(offeringId,'study')).toMatchObject({valid:true,route:`/study/courses/${offeringId}/progress?unit=${unit.id}`})
    await StudyLearningService.archiveUnit(offeringId,unit.id)
    expect(await WorkspaceResumeService.resolveLatest(offeringId,'study')).toMatchObject({valid:false,route:`/study/courses/${offeringId}/overview`})
  })
})

describe('Module 008 responsive UI entry points',()=>{
  it('renders Progress, creates a unit, and opens the shared inspector',async()=>{
    render(<MemoryRouter initialEntries={[`/study/courses/${offeringId}/progress`]}><CourseWorkspace offeringId={offeringId} section="progress" onStartTimer={()=>undefined}/></MemoryRouter>)
    expect(await screen.findByRole('heading',{name:'Course structure'})).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox',{name:'New learning unit'}),{target:{value:'Controllability'}});fireEvent.click(screen.getByRole('button',{name:/Add unit/}))
    const newUnitInput=screen.getByRole('textbox',{name:'New learning unit'});await waitFor(()=>expect(screen.getByRole('button',{name:/Controllability/})).toBeInTheDocument());expect(await screen.findByRole('complementary',{name:'Learning unit inspector'})).toBeInTheDocument();fireEvent.keyDown(window,{key:'Escape'});await waitFor(()=>expect(newUnitInput).toHaveFocus());const trigger=screen.getByRole('button',{name:/Controllability/});fireEvent.click(trigger)
    expect(await screen.findByRole('complementary',{name:'Learning unit inspector'})).toBeInTheDocument()
    fireEvent.keyDown(window,{key:'Escape'});await waitFor(()=>expect(screen.queryByRole('complementary',{name:'Learning unit inspector'})).not.toBeInTheDocument());expect(trigger).toHaveFocus()
  })

  it('renders Exercises, preserves special item labels, and opens the shared inspector',async()=>{
    const set=await StudyLearningService.createSet(offeringId,{title:'Sheet 2',kind:'exercise'});await StudyLearningService.createItem(offeringId,set.id,{itemCode:'A2(c)'})
    render(<MemoryRouter initialEntries={[`/study/courses/${offeringId}/exercises`]}><CourseWorkspace offeringId={offeringId} section="exercises" onStartTimer={()=>undefined}/></MemoryRouter>)
    expect(await screen.findByRole('heading',{name:'Exercise sets and attempts'})).toBeInTheDocument();fireEvent.click(await screen.findByRole('button',{name:/A2\(c\)/}))
    expect(await screen.findByRole('complementary',{name:'Exercise inspector'})).toBeInTheDocument()
  })

  it('restores focus to Add item after create auto-opens and Escape closes the inspector',async()=>{
    await StudyLearningService.createSet(offeringId,{title:'Sheet 3',kind:'exercise'})
    render(<MemoryRouter initialEntries={[`/study/courses/${offeringId}/exercises`]}><CourseWorkspace offeringId={offeringId} section="exercises" onStartTimer={()=>undefined}/></MemoryRouter>)
    await screen.findByRole('heading',{name:'Exercise sets and attempts'});const newItemInput=await screen.findByRole('textbox',{name:'Exercise item code'});fireEvent.change(newItemInput,{target:{value:'B1'}});fireEvent.click(screen.getByRole('button',{name:/Add item/}))
    expect(await screen.findByRole('complementary',{name:'Exercise inspector'})).toBeInTheDocument();fireEvent.keyDown(window,{key:'Escape'});await waitFor(()=>expect(newItemInput).toHaveFocus())
  })

  it('projects exercises and review count on Overview when learning units are not configured',async()=>{
    const set=await StudyLearningService.createSet(offeringId,{title:'Overview sheet',kind:'exercise'}),item=await StudyLearningService.createItem(offeringId,set.id,{itemCode:'O1'});await StudyLearningService.setItemProgress(offeringId,item.id,{solveState:'solved',needsReview:true})
    render(<MemoryRouter initialEntries={[`/study/courses/${offeringId}/overview`]}><CourseWorkspace offeringId={offeringId} section="overview" onStartTimer={()=>undefined}/></MemoryRouter>)
    const card=(await screen.findByRole('heading',{name:'Canonical course progress'})).closest('section')!;expect(within(card).getByText('Learning units').nextElementSibling).toHaveTextContent('Not configured');expect(within(card).getByText('Exercises').nextElementSibling).toHaveTextContent('1/1 solved');expect(within(card).getByText('Review queue').nextElementSibling).toHaveTextContent('1')
    StudyLearningService.invalidate();expect((await StudyLearningService.queryProgress(offeringId)).exercise).toMatchObject({tracked:1,solved:1,toRetry:1})
  })
})
