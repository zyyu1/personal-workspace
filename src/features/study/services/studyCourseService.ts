import { createVersionedRepository, stableId, unwrapMutation, validationFailure, notFoundFailure } from '../../../data/persistence'
import { GlobalResourceService } from '../../../services/globalResourceService'
import { GlobalTaskService } from '../../../services/globalTaskService'
import { TimeEntryService } from '../../../services/timeEntryService'
import { parseSafeExternalUrl } from '../../../services/safeExternalUrl'
import type { Course, CourseAssessment, CourseMaterialEntry, CourseOffering, CourseOfferingView, ManifestPreview, MaterialClassification, StudyProgressState, StudyState } from '../types'

const sections=(offeringId:string)=>[
  ['lectures','Lectures / Skript'],['exercises','Exercises / Aufgaben'],['tutorials','Tutorials / Solutions'],['past-papers','Past papers'],['labs','Labs'],['notes','Notes'],['administrative','Administrative'],['other','Other'],
].map(([type,label],order)=>({id:`section-${offeringId}-${type}`,offeringId,type:type as MaterialClassification,label,order}))

const initial:StudyState={
  courses:[{id:'course-system-theory',title:'System Theory I',code:'ST1',defaultTags:['engineering'],demo:true}],
  offerings:[{id:'offering-system-theory-ws26',courseId:'course-system-theory',term:'Winter 2026/27',enrollmentStatus:'active',lecturer:'Demo lecturer',demo:true}],
  sources:[],imports:[],entries:[],sections:sections('offering-system-theory-ws26'),progress:[],
  assessments:[{id:'assessment-system-theory-exam',offeringId:'offering-system-theory-ws26',assessmentType:'exam',title:'Final examination',verified:false,provenance:'Date not yet confirmed'}],
}
const copy=<T>(value:T):T=>structuredClone(value)
const repository=createVersionedRepository<StudyState>({domain:'study-courses',schemaVersion:1,seedVersion:1,seed:()=>copy(initial)})
const hash=(value:string)=>{let result=2166136261;for(const char of value){result^=char.codePointAt(0)??0;result=Math.imul(result,16777619)}return(result>>>0).toString(36)}
const resourceKind=(path:string)=>{const ext=path.split('.').pop()?.toLowerCase();return ext==='md'?'markdown':ext||'file'}
const mime=(path:string)=>path.toLowerCase().endsWith('.pdf')?'application/pdf':path.toLowerCase().endsWith('.md')?'text/markdown':undefined

export const StudyCourseService={
  async listOfferings(){const state=await repository.getState();return copy(state.offerings.map(offering=>({offering,course:state.courses.find(course=>course.id===offering.courseId)!})).filter(row=>row.course))},
  async getOffering(offeringId:string):Promise<CourseOfferingView|undefined>{
    const state=await repository.getState(),offering=state.offerings.find(row=>row.id===offeringId),course=state.courses.find(row=>row.id===offering?.courseId)
    if(!offering||!course)return undefined
    const resources=(await GlobalResourceService.list()).filter(resource=>resource.links.some(link=>link.entityType==='course-offering'&&link.entityId===offeringId))
    return copy({course,offering,sources:state.sources.filter(row=>row.courseOfferingId===offeringId),entries:state.entries.filter(row=>state.sources.some(source=>source.id===row.sourceId&&source.courseOfferingId===offeringId)),sections:state.sections.filter(row=>row.offeringId===offeringId),progress:state.progress.filter(row=>row.offeringId===offeringId),assessments:state.assessments.filter(row=>row.offeringId===offeringId),resources,tasks:await GlobalTaskService.list(offeringId),timeEntries:await TimeEntryService.list(offeringId)})
  },
  async createOffering(values:{title:string;code?:string;term:string;enrollmentStatus:CourseOffering['enrollmentStatus'];lecturer?:string;ects?:number;courseUrl?:string}){
    if(!values.title.trim()||!values.term.trim())throw validationFailure('Course title and term are required')
    if(values.ects!==undefined&&(!Number.isFinite(values.ects)||values.ects<=0))throw validationFailure('ECTS must be a positive number')
    const url=values.courseUrl?parseSafeExternalUrl(values.courseUrl).toString():undefined,courseId=stableId('course'),offeringId=stableId('offering')
    return unwrapMutation(await repository.mutate(state=>{const course:Course={id:courseId,title:values.title.trim(),code:values.code?.trim()||undefined,defaultTags:[]},offering:CourseOffering={id:offeringId,courseId,term:values.term.trim(),enrollmentStatus:values.enrollmentStatus,lecturer:values.lecturer?.trim()||undefined,ects:values.ects,courseUrl:url};return{state:{...state,courses:[...state.courses,course],offerings:[...state.offerings,offering],sections:[...state.sections,...sections(offeringId)]},value:{course,offering}}}))
  },
  async createTermOffering(courseId:string,values:{term:string;enrollmentStatus:CourseOffering['enrollmentStatus'];lecturer?:string}){if(!values.term.trim())throw validationFailure('Term is required');const offeringId=stableId('offering');return unwrapMutation(await repository.mutate(state=>{if(!state.courses.some(course=>course.id===courseId))throw notFoundFailure('Course not found');const offering:CourseOffering={id:offeringId,courseId,term:values.term.trim(),enrollmentStatus:values.enrollmentStatus,lecturer:values.lecturer?.trim()||undefined};return{state:{...state,offerings:[...state.offerings,offering],sections:[...state.sections,...sections(offeringId)]},value:offering}}))},
  async confirmManifest(offeringId:string,preview:ManifestPreview){
    if(!preview.canConfirm)throw validationFailure('Manifest contains no safe files to index')
    const before=await repository.getState();if(!before.offerings.some(row=>row.id===offeringId))throw notFoundFailure('Course offering not found')
    const existingSource=before.sources.find(row=>row.courseOfferingId===offeringId&&row.fingerprint===preview.sourceFingerprint),sourceId=existingSource?.id??`source-${hash(`${offeringId}:${preview.sourceFingerprint}`)}`,importId=stableId('course-import'),startedAt=new Date().toISOString()
    unwrapMutation(await repository.mutate(state=>({state:{...state,sources:existingSource?state.sources: [...state.sources,{id:sourceId,courseOfferingId:offeringId,kind:preview.sourceKind,label:preview.sourceLabel,fingerprint:preview.sourceFingerprint,permissionState:'permission-required',importMode:'index-only',metadataSync:'pending'}],imports:[...state.imports,{id:importId,sourceId,status:'preview',startedAt,totals:{discovered:preview.totals.discovered,accepted:0,rejected:preview.totals.rejected},failures:copy(preview.failures),manifestVersion:1,initiatedBy:'user'}]},value:sourceId})))
    const incoming=new Map<string,ManifestPreview['entries'][number]>()
    for(const entry of preview.entries){const prior=incoming.get(entry.relativePath);if(!prior||(!entry.safe&&prior.safe))incoming.set(entry.relativePath,entry)}
    const failures=copy(preview.failures),indexed:Array<{entry:ManifestPreview['entries'][number];resourceId:string}>=[],failedPaths=new Set<string>()
    for(const entry of [...incoming.values()].filter(row=>row.safe&&row.entryType==='file')){
      const id=`study-resource-${hash(`${sourceId}:${entry.relativePath}`)}`
      try{const resource=await GlobalResourceService.upsertIndexedResource({id,title:entry.relativePath.split('/').at(-1)??entry.relativePath,resourceKind:resourceKind(entry.relativePath),mimeType:mime(entry.relativePath),sourceRef:`study:${sourceId}:${entry.relativePath}`,sourceId,offeringId,relativePath:entry.relativePath,size:entry.size,modifiedAt:entry.modifiedAt,provider:preview.sourceKind==='archive'?'ZIP index snapshot':'Browser folder snapshot'});indexed.push({entry,resourceId:resource.id})}
      catch(error){failedPaths.add(entry.relativePath);failures.push({path:entry.relativePath,reason:error instanceof Error?error.message:'Resource indexing failed'})}
    }
    return unwrapMutation(await repository.mutate(state=>{
      const current=state.entries.filter(row=>row.sourceId===sourceId),present=new Set(incoming.keys()),missing=current.filter(row=>!present.has(row.relativePath)).map(row=>({...row,status:'missing' as const})),updated=indexed.map(({entry,resourceId})=>{const prior=current.find(row=>row.relativePath===entry.relativePath);return{id:prior?.id??`entry-${hash(`${sourceId}:${entry.relativePath}`)}`,sourceId,resourceId,status:'available' as const,...entry,classification:prior?.manualClassification?prior.classification:entry.classification,manualClassification:prior?.manualClassification}})
      const rejected:CourseMaterialEntry[]=[...incoming.values()].filter(row=>!row.safe).map(entry=>{const prior=current.find(row=>row.relativePath===entry.relativePath);return{id:prior?.id??`entry-${hash(`${sourceId}:${entry.relativePath}`)}`,sourceId,status:'rejected',...entry,classification:prior?.manualClassification?prior.classification:entry.classification,manualClassification:prior?.manualClassification}})
      const failed:CourseMaterialEntry[]=[...incoming.values()].filter(row=>failedPaths.has(row.relativePath)).map(entry=>{const prior=current.find(row=>row.relativePath===entry.relativePath);return prior?{...prior,status:prior.resourceId?'available':'missing'}:{id:`entry-${hash(`${sourceId}:${entry.relativePath}`)}`,sourceId,status:'missing',...entry}})
      const directories:CourseMaterialEntry[]=[...incoming.values()].filter(row=>row.safe&&row.entryType==='directory').map(entry=>{const prior=current.find(row=>row.relativePath===entry.relativePath);return{id:prior?.id??`entry-${hash(`${sourceId}:${entry.relativePath}`)}`,sourceId,status:'available',...entry,classification:prior?.manualClassification?prior.classification:entry.classification,manualClassification:prior?.manualClassification}})
      const status=failures.length?(indexed.length?'partial':'failed'):'completed',completedAt=new Date().toISOString()
      return{state:{...state,sources:state.sources.map(row=>row.id===sourceId?{...row,indexedAt:completedAt,metadataSync:status==='completed'?'synced':'error'}:row),entries:[...state.entries.filter(row=>row.sourceId!==sourceId),...updated,...directories,...failed,...missing,...rejected],imports:state.imports.map(row=>row.id===importId?{...row,status,completedAt,totals:{discovered:preview.totals.discovered,accepted:indexed.length,rejected:failures.length},failures}:row)},value:{sourceId,importId,status,indexed:indexed.length,failures}}
    }))
  },
  async updateClassification(entryId:string,classification:MaterialClassification){return unwrapMutation(await repository.mutate(state=>{const entry=state.entries.find(row=>row.id===entryId);if(!entry)throw notFoundFailure('Material entry not found');const next={...entry,classification,manualClassification:true};return{state:{...state,entries:state.entries.map(row=>row.id===entryId?next:row)},value:next}}))},
  async markProgress(offeringId:string,resourceId:string,stateValue:StudyProgressState){return unwrapMutation(await repository.mutate(state=>{const existing=state.progress.find(row=>row.offeringId===offeringId&&row.resourceId===resourceId),next={id:existing?.id??stableId('study-progress'),offeringId,resourceId,state:stateValue,updatedAt:new Date().toISOString()};return{state:{...state,progress:[...state.progress.filter(row=>row.id!==existing?.id),next]},value:next}}))},
  async createStudyTask(offeringId:string,resourceId:string,title:string){const existing=(await GlobalTaskService.list(offeringId)).find(task=>task.resourceLinks?.some(link=>link.resourceId===resourceId));if(existing)return existing;const task=await GlobalTaskService.create({projectId:offeringId,area:'study',title:`Study: ${title}`,stage:'Course materials',taskType:'reading',priority:'medium',resourceLinks:[{id:`task-resource-${resourceId}`,resourceId,label:title,kind:'file',available:false}]});await GlobalResourceService.linkResource(resourceId,{type:'task',id:task.id,label:task.title},'study material');return task},
  async addExistingResource(offeringId:string,resourceId:string){
    const resource=await GlobalResourceService.get(resourceId);if(!resource)throw notFoundFailure('Resource not found')
    await GlobalResourceService.linkResource(resourceId,{type:'course-offering',id:offeringId},'course material')
    const sourceId=`source-existing-${offeringId}-${resourceId}`,entryId=`entry-existing-${offeringId}-${resourceId}`,permissionState=resource.byteAvailability==='available-provider'||resource.byteAvailability==='available-here'||resource.byteAvailability==='available-managed'?'session-authorized' as const:'permission-required' as const
    unwrapMutation(await repository.mutate(state=>{
      if(!state.offerings.some(row=>row.id===offeringId))throw notFoundFailure('Course offering not found')
      const hasSource=state.sources.some(row=>row.id===sourceId),hasEntry=state.entries.some(row=>row.id===entryId)
      return{state:{...state,sources:hasSource?state.sources:[...state.sources,{id:sourceId,courseOfferingId:offeringId,kind:'manual',label:'Global Resource Library',fingerprint:`existing:${offeringId}:${resourceId}`,indexedAt:new Date().toISOString(),permissionState,importMode:'index-only',metadataSync:resource.metadataSync==='synced'?'synced':'pending'}],entries:hasEntry?state.entries:[...state.entries,{id:entryId,sourceId,resourceId,relativePath:resource.title,entryType:'file',classification:resource.resourceKind==='markdown'?'notes':resource.resourceKind==='pdf'?'lectures':'other',classificationConfidence:'low',safe:true,status:'available'}]},value:entryId}
    }))
    return this.getOffering(offeringId)
  },
  async unlinkResource(offeringId:string,resourceId:string){
    const before=await repository.getState()
    if(!before.offerings.some(row=>row.id===offeringId))throw notFoundFailure('Course offering not found')
    const ownedSources=new Set(before.sources.filter(row=>row.courseOfferingId===offeringId).map(row=>row.id))
    if(!before.entries.some(row=>ownedSources.has(row.sourceId)&&row.resourceId===resourceId))throw notFoundFailure('Course material link not found')
    const result=await GlobalResourceService.unlinkResource(resourceId,{type:'course-offering',id:offeringId})
    unwrapMutation(await repository.mutate(state=>{
      const currentOwnedSources=new Set(state.sources.filter(row=>row.courseOfferingId===offeringId).map(row=>row.id))
      const entries=state.entries.flatMap(row=>{
        if(row.resourceId!==resourceId||!currentOwnedSources.has(row.sourceId))return[row]
        if(row.sourceId.startsWith(`source-existing-${offeringId}-`))return[]
        return[{...row,resourceId:undefined,status:'missing' as const}]
      })
      const sources=state.sources.filter(row=>!(row.courseOfferingId===offeringId&&row.id===`source-existing-${offeringId}-${resourceId}`))
      return{state:{...state,sources,entries},value:resourceId}
    }))
    return result
  },
  async getImport(importId:string){return copy((await repository.getState()).imports.find(row=>row.id===importId))},
  async saveAssessment(assessment:CourseAssessment){
    if(!assessment.title.trim())throw validationFailure('Assessment title is required')
    if(assessment.officialDateTime&&Number.isNaN(Date.parse(assessment.officialDateTime)))throw validationFailure('Assessment date is invalid')
    return unwrapMutation(await repository.mutate(state=>{if(!state.offerings.some(row=>row.id===assessment.offeringId))throw notFoundFailure('Course offering not found');const next={...assessment,title:assessment.title.trim()};return{state:{...state,assessments:[...state.assessments.filter(row=>row.id!==assessment.id),next]},value:next}}))
  },
  async listVerifiedAssessments(offeringId?:string){return copy((await repository.getState()).assessments.filter(row=>(!offeringId||row.offeringId===offeringId)&&row.verified&&Boolean(row.officialDateTime)))},
  reset(){return repository.reset()},invalidate(){repository.invalidate()},
}
