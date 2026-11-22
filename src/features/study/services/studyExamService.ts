/**
 * Module 009 — Exams & Past Papers V1.0.
 * One canonical Study repository (`study-courses`, schema v3). Assessments stay in `assessments`;
 * milestones, sittings, past papers, offering links and practice are subordinate typed arrays.
 * Global Resource / Task stores are referenced by ID only; cross-store writes are idempotent and
 * report partial commits truthfully instead of claiming atomicity.
 */
import { notFoundFailure, stableId, unwrapMutation, validationFailure } from '../../../data/persistence'
import { GlobalResourceService } from '../../../services/globalResourceService'
import { GlobalTaskService } from '../../../services/globalTaskService'
import { parseSafeExternalUrl } from '../../../services/safeExternalUrl'
import { StudyRepository } from './studyCourseService'
import { ExamDateError, normalizeExamDate, viewerToday, type Disambiguation } from './examDates'
import type { AssessmentLifecycle, AssessmentType, CourseAssessment, CourseExerciseSet, CoursePastPaper, DatePrecision, ExamMilestone, ExamMilestoneKind, ExamSitting, ExamVerificationStatus, PastPaperKind, PastPaperOfferingLink, PastPaperPractice, PracticeStatus, RegistrationState, SittingOutcome, SittingParticipation, StudyEvidenceLink, StudyState } from '../types'

const copy=<T>(value:T):T=>structuredClone(value)
const now=()=>new Date().toISOString()
const has=<T extends object>(value:T,key:PropertyKey)=>Object.prototype.hasOwnProperty.call(value,key)
/** Omitted optional fields keep their saved value; an explicit empty value clears it (M008-QA-001 contract). */
const optionalText=(values:object,key:string,current:string|undefined)=>has(values,key)?(((values as Record<string,unknown>)[key] as string|undefined)?.trim()||undefined):current
const optionalNumber=(values:object,key:string,current:number|undefined)=>has(values,key)?((values as Record<string,unknown>)[key] as number|undefined):current

const ASSESSMENT_TYPES:AssessmentType[]=['exam','quiz','testat','report','assignment']
const REGISTRATION:RegistrationState[]=['unknown','not_registered','registered','withdrawn','not_required']
const MILESTONE_KINDS:ExamMilestoneKind[]=['registration-open','registration-close','withdrawal-close','exam','grade-release']
const USER_VERIFICATION:ExamVerificationStatus[]=['unverified','user-confirmed','source-verified']
const PARTICIPATION:SittingParticipation[]=['unknown','not_taken','attended','absent','withdrawn']
const OUTCOME:SittingOutcome[]=['unknown','pending','passed','failed','void']
const PAPER_KINDS:PastPaperKind[]=['past-exam','mock','sample','unknown']
const PRACTICE_STATUS:PracticeStatus[]=['planned','in_progress','completed','abandoned']
const oneOf=<T extends string>(value:string|undefined,allowed:readonly T[],label:string):T=>{if(!value||!allowed.includes(value as T))throw validationFailure(`${label} is invalid`);return value as T}

const requireOffering=(state:StudyState,offeringId:string)=>{const offering=state.offerings.find(row=>row.id===offeringId);if(!offering)throw notFoundFailure('Course offering not found');return offering}
const requireAssessment=(state:StudyState,offeringId:string,id:string)=>{const row=state.assessments.find(item=>item.id===id&&item.offeringId===offeringId);if(!row)throw notFoundFailure('Assessment not found in this course offering');return row}
const requireMilestone=(state:StudyState,offeringId:string,id:string)=>{const row=state.examMilestones.find(item=>item.id===id&&item.offeringId===offeringId);if(!row)throw notFoundFailure('Exam milestone not found in this course offering');return row}
const requireSitting=(state:StudyState,offeringId:string,id:string)=>{const row=state.examSittings.find(item=>item.id===id&&item.offeringId===offeringId);if(!row)throw notFoundFailure('Exam sitting not found in this course offering');return row}
const requirePaperForOffering=(state:StudyState,offeringId:string,paperId:string)=>{const offering=requireOffering(state,offeringId),paper=state.coursePastPapers.find(row=>row.id===paperId);if(!paper||paper.courseId!==offering.courseId)throw notFoundFailure('Past paper not found for this course');return paper}
const isPaperLinked=(state:StudyState,offeringId:string,paperId:string)=>state.pastPaperOfferingLinks.some(row=>row.offeringId===offeringId&&row.paperId===paperId)
const requirePractice=(state:StudyState,offeringId:string,id:string)=>{const row=state.pastPaperPractices.find(item=>item.id===id&&item.offeringId===offeringId);if(!row)throw notFoundFailure('Practice session not found in this course offering');return row}
const lifecycleOf=(row:CourseAssessment):AssessmentLifecycle=>row.lifecycle??'active'
const registrationOf=(row:CourseAssessment)=>row.registration??{status:'unknown' as const,history:[]}
const paperLinkId=(offeringId:string,paperId:string)=>`past-paper-link-${offeringId}-${paperId}`
const paperSetId=(offeringId:string,paperId:string)=>`exercise-set-past-paper-${offeringId}-${paperId}`
export const canonicalExamTaskId=(offeringId:string,assessmentId:string,purpose:'preparation'|'registration')=>`task-study-exam:${offeringId}:${assessmentId}:${purpose}`
const evidenceId=(offeringId:string,assessmentId:string,taskId:string)=>`evidence-${offeringId}-assessment-${assessmentId}-task-${taskId}`
const safeUrl=(value?:string)=>{const text=value?.trim();if(!text)return undefined;try{return parseSafeExternalUrl(text).toString()}catch{throw validationFailure('Source URL must be a safe http(s) link')}}
const toValidation=(error:unknown)=>error instanceof ExamDateError?validationFailure(error.message,error):error

export interface MilestoneInput{kind:ExamMilestoneKind;datePrecision:DatePrecision;localDate?:string;localTime?:string;timezone?:string;disambiguation?:Disambiguation;verificationStatus:ExamVerificationStatus;sourceUrl?:string;sourceNote?:string}
export interface SittingInput{participationStatus:SittingParticipation;outcomeStatus:SittingOutcome;sittingLabel?:string;examDateReference?:string;gradeValue?:string;gradeSource?:ExamSitting['gradeSource'];gradeSystem?:string;evidenceResourceId?:string;notes?:string}
export interface PaperInput{label:string;questionResourceId:string;solutionResourceId?:string;paperKind?:PastPaperKind;originTerm?:string;year?:number;maxPoints?:number;durationMinutes?:number;notes?:string}

function validateMilestone(values:MilestoneInput){
  const kind=oneOf(values.kind,MILESTONE_KINDS,'Milestone kind'),verificationStatus=oneOf(values.verificationStatus,USER_VERIFICATION,'Verification status (legacy-verified is reserved for migrated records)')
  let date
  try{date=normalizeExamDate(values)}catch(error){throw toValidation(error)}
  const sourceUrl=safeUrl(values.sourceUrl),sourceNote=values.sourceNote?.trim()||undefined
  if(verificationStatus==='source-verified'&&!sourceUrl&&!sourceNote)throw validationFailure('Source-verified requires a source link or source note')
  if(date.datePrecision==='unknown'&&verificationStatus!=='unverified')throw validationFailure('An unknown date cannot be confirmed or verified')
  return{kind,verificationStatus,sourceUrl,sourceNote,...date}
}
function validateSitting(values:SittingInput){
  const participationStatus=oneOf(values.participationStatus,PARTICIPATION,'Participation status'),outcomeStatus=oneOf(values.outcomeStatus,OUTCOME,'Outcome status'),gradeValue=values.gradeValue?.trim()||undefined
  const gradeSource=values.gradeSource??(gradeValue?'self-reported':'none')
  if(!['none','self-reported','official-evidenced'].includes(gradeSource))throw validationFailure('Grade source is invalid')
  if(gradeValue&&gradeSource==='none')throw validationFailure('A grade needs a source (self-reported or official evidence)')
  if(!gradeValue&&gradeSource!=='none')throw validationFailure('A grade source needs a grade value')
  if(gradeSource==='official-evidenced'&&!values.evidenceResourceId&&!values.notes?.trim())throw validationFailure('Official grade evidence needs an evidence Resource or a note describing the evidence')
  if(['passed','failed'].includes(outcomeStatus)&&participationStatus!=='attended'&&participationStatus!=='unknown')throw validationFailure('A pass/fail outcome requires attendance (or unknown participation)')
  if(values.examDateReference)try{normalizeExamDate({datePrecision:'date-only',localDate:values.examDateReference})}catch(error){throw toValidation(error)}
  return{participationStatus,outcomeStatus,gradeValue,gradeSource,gradeSystem:values.gradeSystem?.trim()||undefined,sittingLabel:values.sittingLabel?.trim()||undefined,examDateReference:values.examDateReference||undefined,evidenceResourceId:values.evidenceResourceId||undefined,notes:values.notes?.trim()||undefined}
}
const positiveOrUndefined=(value:number|undefined,label:string,integer=false)=>{if(value===undefined)return undefined;if(!Number.isFinite(value)||value<=0||(integer&&!Number.isInteger(value)))throw validationFailure(`${label} must be a positive number`);return value}
const nonNegativeOrUndefined=(value:number|undefined,label:string)=>{if(value===undefined)return undefined;if(!Number.isFinite(value)||value<0)throw validationFailure(`${label} cannot be negative`);return value}
function validatePracticeScore(scored?:number,max?:number){
  nonNegativeOrUndefined(scored,'Scored points');positiveOrUndefined(max,'Maximum points')
  if(scored!==undefined&&max!==undefined&&scored>max)throw validationFailure('Scored points cannot exceed the maximum points')
}

/** Percentage exists only when explicit points and a positive denominator are both known. */
export const practicePercentage=(practice:Pick<PastPaperPractice,'scoredPoints'|'maxPointsAtAttempt'>)=>practice.scoredPoints!==undefined&&practice.maxPointsAtAttempt!==undefined&&practice.maxPointsAtAttempt>0?Math.round(practice.scoredPoints/practice.maxPointsAtAttempt*1000)/10:undefined

export const activeMilestones=(milestones:ExamMilestone[],assessmentId:string)=>milestones.filter(row=>row.assessmentId===assessmentId&&row.status==='active')
/** A milestone is calendar-eligible only when dated, active, confirmed/verified and its assessment is active. */
export const isCalendarEligible=(milestone:ExamMilestone,assessment?:CourseAssessment)=>Boolean(assessment&&lifecycleOf(assessment)==='active'&&milestone.status==='active'&&milestone.datePrecision!=='unknown'&&milestone.localDate&&milestone.verificationStatus!=='unverified')

/**
 * F-01 effective exam-date resolver (read-only, derived from existing v3 history; no persisted state).
 * Ruling: F01_LEGACY_VERIFIED_CALENDAR_PRESERVATION_RULING.md — confirmation is the replacement threshold.
 * Replays the assessment's `exam` milestones in order (append-only creation order; cancellations at their
 * `updatedAt`), starting from verified 007 legacy evidence:
 *  - a dated `user-confirmed` / `source-verified` milestone becomes the effective date and clears any pending proposal;
 *  - an `unverified` or `unknown` milestone only becomes the pending proposal (never revokes confirmed evidence);
 *  - cancelling the effective confirmed milestone leaves NO effective date (no resurrection of older evidence);
 *  - cancelling the pending proposal clears it and keeps the effective date.
 * Calendar, Exams and Overview all read this one result.
 */
export type EffectiveExamEvidence={source:'legacy';officialDateTime:string;timezone?:string;provenance?:string}|{source:'milestone';milestone:ExamMilestone}
export interface ExamDateResolution{assessmentId:string;assessmentActive:boolean;effective?:EffectiveExamEvidence;pending?:ExamMilestone;effectiveWithdrawn:boolean;reviewNeeded:boolean;onCalendar:boolean}
const isConfirmedDated=(row:ExamMilestone)=>(row.verificationStatus==='user-confirmed'||row.verificationStatus==='source-verified'||row.verificationStatus==='legacy-verified')&&row.datePrecision!=='unknown'&&Boolean(row.localDate)
export function resolveExamDate(assessment:CourseAssessment,milestones:ExamMilestone[]):ExamDateResolution{
  const own=milestones.map((row,index)=>({row,index})).filter(({row})=>row.assessmentId===assessment.id&&row.offeringId===assessment.offeringId&&row.kind==='exam')
  type Step={time:string;order:number;kind:'create'|'cancel';row:ExamMilestone}
  const steps:Step[]=own.flatMap(({row,index})=>[{time:row.createdAt,order:index*2,kind:'create' as const,row},...(row.status==='cancelled'?[{time:row.updatedAt,order:index*2+1,kind:'cancel' as const,row}]:[])])
  steps.sort((a,b)=>a.time.localeCompare(b.time)||a.order-b.order)
  let effective:EffectiveExamEvidence|undefined=assessment.verified&&assessment.officialDateTime&&!Number.isNaN(Date.parse(assessment.officialDateTime))?{source:'legacy',officialDateTime:assessment.officialDateTime,timezone:assessment.originalTimezone,provenance:assessment.provenance}:undefined
  let pending:ExamMilestone|undefined,effectiveWithdrawn=false
  for(const step of steps){
    if(step.kind==='create'){if(isConfirmedDated(step.row)){effective={source:'milestone',milestone:step.row};pending=undefined;effectiveWithdrawn=false}else pending=step.row;continue}
    if(effective?.source==='milestone'&&effective.milestone.id===step.row.id){effective=undefined;effectiveWithdrawn=true}
    if(pending?.id===step.row.id)pending=undefined
  }
  const assessmentActive=lifecycleOf(assessment)==='active'
  return{assessmentId:assessment.id,assessmentActive,effective,pending,effectiveWithdrawn,reviewNeeded:Boolean(effective&&pending),onCalendar:assessmentActive&&Boolean(effective)}
}
/** Civil date of the effective evidence (original local date; never re-zoned). */
export const effectiveExamLocalDate=(effective?:EffectiveExamEvidence)=>!effective?undefined:effective.source==='milestone'?effective.milestone.localDate:effective.officialDateTime.slice(0,10)

export const StudyExamService={
  async getSnapshot(offeringId:string){
    const state=await StudyRepository.getState(),offering=state.offerings.find(row=>row.id===offeringId)
    if(!offering)return undefined
    const courseOfferings=state.offerings.filter(row=>row.courseId===offering.courseId),otherOfferingIds=new Set(courseOfferings.filter(row=>row.id!==offeringId).map(row=>row.id))
    const linkedPaperIds=new Set(state.pastPaperOfferingLinks.filter(row=>row.offeringId===offeringId).map(row=>row.paperId))
    return copy({
      offering,
      assessments:state.assessments.filter(row=>row.offeringId===offeringId),
      milestones:state.examMilestones.filter(row=>row.offeringId===offeringId),
      sittings:state.examSittings.filter(row=>row.offeringId===offeringId),
      /** Read-only course history from other terms; never editable from this offering. */
      courseHistory:state.examSittings.filter(row=>otherOfferingIds.has(row.offeringId)).map(row=>({sitting:row,term:courseOfferings.find(item=>item.id===row.offeringId)?.term??'Unknown term',assessmentTitle:state.assessments.find(item=>item.id===row.assessmentId)?.title??'Unknown assessment'})),
      linkedPapers:state.coursePastPapers.filter(row=>row.courseId===offering.courseId&&linkedPaperIds.has(row.id)),
      catalogPapers:state.coursePastPapers.filter(row=>row.courseId===offering.courseId&&!linkedPaperIds.has(row.id)&&!row.archivedAt),
      links:state.pastPaperOfferingLinks.filter(row=>row.offeringId===offeringId),
      practices:state.pastPaperPractices.filter(row=>row.offeringId===offeringId),
      evidenceLinks:state.evidenceLinks.filter(row=>row.courseOfferingId===offeringId&&row.targetType==='assessment'),
      exerciseSets:state.exerciseSets.filter(row=>row.courseOfferingId===offeringId),
    })
  },

  // ---- Assessments -------------------------------------------------------
  async createAssessment(offeringId:string,values:{title:string;assessmentType:AssessmentType}){
    if(!values.title?.trim())throw validationFailure('Assessment title is required')
    const assessmentType=oneOf(values.assessmentType,ASSESSMENT_TYPES,'Assessment type')
    return unwrapMutation(await StudyRepository.mutate(state=>{requireOffering(state,offeringId);const createdAt=now(),row:CourseAssessment={id:stableId('assessment'),offeringId,assessmentType,title:values.title.trim(),verified:false,lifecycle:'active',registration:{status:'unknown',history:[]},createdAt,updatedAt:createdAt};return{state:{...state,assessments:[...state.assessments,row]},value:row}}))
  },
  async updateAssessment(offeringId:string,id:string,values:{title?:string;assessmentType?:AssessmentType}){
    return unwrapMutation(await StudyRepository.mutate(state=>{const current=requireAssessment(state,offeringId,id);if(has(values,'title')&&!values.title?.trim())throw validationFailure('Assessment title is required');const next:CourseAssessment={...current,title:has(values,'title')?values.title!.trim():current.title,assessmentType:has(values,'assessmentType')?oneOf(values.assessmentType,ASSESSMENT_TYPES,'Assessment type'):current.assessmentType,updatedAt:now()};return{state:{...state,assessments:state.assessments.map(row=>row.id===id?next:row)},value:next}}))
  },
  /** Archive / cancel keep the record, milestones and sittings; restore returns it to active. */
  async setAssessmentLifecycle(offeringId:string,id:string,lifecycle:AssessmentLifecycle){
    const value=oneOf(lifecycle,['active','archived','cancelled'] as const,'Assessment lifecycle')
    return unwrapMutation(await StudyRepository.mutate(state=>{const current=requireAssessment(state,offeringId,id),next={...current,lifecycle:value,updatedAt:now()};return{state:{...state,assessments:state.assessments.map(row=>row.id===id?next:row)},value:next}}))
  },
  /** Registration only changes on this explicit call; it records local facts and never contacts a university system. */
  async setRegistration(offeringId:string,id:string,status:RegistrationState,evidence?:string){
    const value=oneOf(status,REGISTRATION,'Registration status')
    return unwrapMutation(await StudyRepository.mutate(state=>{const current=requireAssessment(state,offeringId,id),registration=registrationOf(current),changedAt=now(),note=evidence?.trim()||undefined;if(registration.status===value&&registration.evidence===note)return{state,value:current};const next:CourseAssessment={...current,registration:{status:value,updatedAt:changedAt,evidence:note,history:[...registration.history,{status:value,changedAt,evidence:note}]},updatedAt:changedAt};return{state:{...state,assessments:state.assessments.map(row=>row.id===id?next:row)},value:next}}))
  },

  // ---- Milestones -------------------------------------------------------
  /** Adds a milestone. An existing active milestone of the same kind is superseded (kept as history), never overwritten. */
  async setMilestone(offeringId:string,assessmentId:string,values:MilestoneInput){
    const valid=validateMilestone(values)
    return unwrapMutation(await StudyRepository.mutate(state=>{
      const assessment=requireAssessment(state,offeringId,assessmentId);if(lifecycleOf(assessment)!=='active')throw validationFailure('Restore the assessment before changing its dates')
      const previous=state.examMilestones.find(row=>row.assessmentId===assessmentId&&row.kind===valid.kind&&row.status==='active'),createdAt=now(),id=stableId('exam-milestone')
      const milestone:ExamMilestone={id,offeringId,assessmentId,status:'active',supersedesId:previous?.id,createdAt,updatedAt:createdAt,...valid}
      const milestones=state.examMilestones.map(row=>row.id===previous?.id?{...row,status:'superseded' as const,supersededById:id,updatedAt:createdAt}:row)
      return{state:{...state,examMilestones:[...milestones,milestone]},value:milestone}
    }))
  },
  async cancelMilestone(offeringId:string,id:string){
    return unwrapMutation(await StudyRepository.mutate(state=>{const current=requireMilestone(state,offeringId,id);if(current.status!=='active')return{state,value:current};const next={...current,status:'cancelled' as const,updatedAt:now()};return{state:{...state,examMilestones:state.examMilestones.map(row=>row.id===id?next:row)},value:next}}))
  },

  // ---- Sittings / real results -----------------------------------------
  /** A sitting exists only when the user records it; passing time never creates one and grades never imply pass/fail. */
  async recordSitting(offeringId:string,assessmentId:string,values:SittingInput){
    const valid=validateSitting(values)
    if(valid.evidenceResourceId&&!await GlobalResourceService.get(valid.evidenceResourceId))throw notFoundFailure('Evidence resource not found')
    return unwrapMutation(await StudyRepository.mutate(state=>{requireAssessment(state,offeringId,assessmentId);const createdAt=now(),row:ExamSitting={id:stableId('exam-sitting'),offeringId,assessmentId,...valid,createdAt,updatedAt:createdAt};return{state:{...state,examSittings:[...state.examSittings,row]},value:row}}))
  },
  async updateSitting(offeringId:string,id:string,values:Partial<SittingInput>){
    return unwrapMutation(await StudyRepository.mutate(state=>{const current=requireSitting(state,offeringId,id),merged={participationStatus:values.participationStatus??current.participationStatus,outcomeStatus:values.outcomeStatus??current.outcomeStatus,sittingLabel:optionalText(values,'sittingLabel',current.sittingLabel),examDateReference:optionalText(values,'examDateReference',current.examDateReference),gradeValue:optionalText(values,'gradeValue',current.gradeValue),gradeSource:has(values,'gradeSource')?values.gradeSource:has(values,'gradeValue')&&!values.gradeValue?.trim()?'none' as const:current.gradeSource,gradeSystem:optionalText(values,'gradeSystem',current.gradeSystem),evidenceResourceId:optionalText(values,'evidenceResourceId',current.evidenceResourceId),notes:optionalText(values,'notes',current.notes)},next:ExamSitting={...current,...validateSitting(merged),updatedAt:now()};return{state:{...state,examSittings:state.examSittings.map(row=>row.id===id?next:row)},value:next}}))
  },

  // ---- Past paper catalog ----------------------------------------------
  /** Catalogs metadata for one existing canonical Resource (no bytes copied) and links it to this offering. Never creates an assessment or date. */
  async createPastPaper(offeringId:string,values:PaperInput){
    if(!values.label?.trim())throw validationFailure('Past paper label is required')
    if(!values.questionResourceId)throw validationFailure('Choose the question paper Resource')
    if(values.solutionResourceId&&values.solutionResourceId===values.questionResourceId)throw validationFailure('Solution must be a different Resource')
    const year=positiveOrUndefined(values.year,'Year',true),maxPoints=positiveOrUndefined(values.maxPoints,'Maximum points'),durationMinutes=positiveOrUndefined(values.durationMinutes,'Duration',true),paperKind=oneOf(values.paperKind??'unknown',PAPER_KINDS,'Paper kind')
    if(year!==undefined&&(year<1950||year>2100))throw validationFailure('Year is out of range')
    for(const id of [values.questionResourceId,values.solutionResourceId].filter(Boolean) as string[])if(!await GlobalResourceService.get(id))throw notFoundFailure('Linked resource not found')
    const paper=unwrapMutation(await StudyRepository.mutate(state=>{const offering=requireOffering(state,offeringId),createdAt=now(),row:CoursePastPaper={id:stableId('past-paper'),courseId:offering.courseId,label:values.label.trim(),paperKind,questionResourceId:values.questionResourceId,solutionResourceId:values.solutionResourceId||undefined,originTerm:values.originTerm?.trim()||undefined,year,maxPoints,durationMinutes,notes:values.notes?.trim()||undefined,createdAt,updatedAt:createdAt},link:PastPaperOfferingLink={id:paperLinkId(offeringId,row.id),paperId:row.id,offeringId,createdAt};return{state:{...state,coursePastPapers:[...state.coursePastPapers,row],pastPaperOfferingLinks:[...state.pastPaperOfferingLinks,link]},value:row}}))
    await this.reconcilePaperResources(paper.id)
    return paper
  },
  /** Idempotent Resource relation repair for a paper (safe to retry after a partial failure). */
  async reconcilePaperResources(paperId:string){
    const paper=(await StudyRepository.getState()).coursePastPapers.find(row=>row.id===paperId);if(!paper)throw notFoundFailure('Past paper not found')
    try{
      await GlobalResourceService.linkResource(paper.questionResourceId,{type:'course-past-paper',id:paper.id,label:paper.label},'past paper question')
      if(paper.solutionResourceId)await GlobalResourceService.linkResource(paper.solutionResourceId,{type:'course-past-paper',id:paper.id,label:paper.label},'past paper solution')
    }catch(error){throw new Error(`Past paper ${paper.id} was saved, but its Resource relation could not be saved. Retry to reconcile.`,{cause:error})}
    return paper
  },
  async updatePastPaper(offeringId:string,paperId:string,values:Partial<Omit<PaperInput,'questionResourceId'>>){
    if(values.solutionResourceId&&!await GlobalResourceService.get(values.solutionResourceId))throw notFoundFailure('Linked resource not found')
    const paper=unwrapMutation(await StudyRepository.mutate(state=>{
      const current=requirePaperForOffering(state,offeringId,paperId)
      if(has(values,'label')&&!values.label?.trim())throw validationFailure('Past paper label is required')
      const solutionResourceId=optionalText(values,'solutionResourceId',current.solutionResourceId);if(solutionResourceId===current.questionResourceId)throw validationFailure('Solution must be a different Resource')
      const year=positiveOrUndefined(optionalNumber(values,'year',current.year),'Year',true)
      const next:CoursePastPaper={...current,label:has(values,'label')?values.label!.trim():current.label,paperKind:has(values,'paperKind')?oneOf(values.paperKind,PAPER_KINDS,'Paper kind'):current.paperKind,solutionResourceId,originTerm:optionalText(values,'originTerm',current.originTerm),year,maxPoints:positiveOrUndefined(optionalNumber(values,'maxPoints',current.maxPoints),'Maximum points'),durationMinutes:positiveOrUndefined(optionalNumber(values,'durationMinutes',current.durationMinutes),'Duration',true),notes:optionalText(values,'notes',current.notes),updatedAt:now()}
      return{state:{...state,coursePastPapers:state.coursePastPapers.map(row=>row.id===paperId?next:row)},value:next}
    }))
    if(paper.solutionResourceId)await this.reconcilePaperResources(paper.id)
    return paper
  },
  async archivePastPaper(offeringId:string,paperId:string,archived=true){
    return unwrapMutation(await StudyRepository.mutate(state=>{const current=requirePaperForOffering(state,offeringId,paperId),next={...current,archivedAt:archived?now():undefined,updatedAt:now()};return{state:{...state,coursePastPapers:state.coursePastPapers.map(row=>row.id===paperId?next:row)},value:next}}))
  },
  /** Explicitly reuses a course-wide paper in another offering. Practice, tasks and attempts are never copied. */
  async linkPaperToOffering(offeringId:string,paperId:string){
    return unwrapMutation(await StudyRepository.mutate(state=>{const paper=requirePaperForOffering(state,offeringId,paperId);if(paper.archivedAt)throw validationFailure('Restore the archived paper before linking it');const id=paperLinkId(offeringId,paperId),existing=state.pastPaperOfferingLinks.find(row=>row.id===id);if(existing)return{state,value:existing};const link:PastPaperOfferingLink={id,paperId,offeringId,createdAt:now()};return{state:{...state,pastPaperOfferingLinks:[...state.pastPaperOfferingLinks,link]},value:link}}))
  },

  // ---- Practice ---------------------------------------------------------
  async createPractice(offeringId:string,paperId:string,values:{status?:PracticeStatus;notes?:string}={}){
    const status=oneOf(values.status??'planned',PRACTICE_STATUS,'Practice status')
    return unwrapMutation(await StudyRepository.mutate(state=>{const paper=requirePaperForOffering(state,offeringId,paperId);if(!isPaperLinked(state,offeringId,paperId))throw validationFailure('Link this past paper to the course offering before practising it');const createdAt=now(),row:PastPaperPractice={id:stableId('past-paper-practice'),offeringId,paperId,status,startedAt:status==='in_progress'||status==='completed'?createdAt:undefined,completedAt:status==='completed'?createdAt:undefined,maxPointsAtAttempt:paper.maxPoints,notes:values.notes?.trim()||undefined,createdAt,updatedAt:createdAt};return{state:{...state,pastPaperPractices:[...state.pastPaperPractices,row]},value:row}}))
  },
  /** All values are self-reported. Minutes never create TimeEntries; scores never touch sittings or grades. */
  async updatePractice(offeringId:string,id:string,values:{status?:PracticeStatus;selfReportedMinutes?:number;scoredPoints?:number;maxPointsAtAttempt?:number;scoreSource?:'self'|'external-reviewed';notes?:string}){
    return unwrapMutation(await StudyRepository.mutate(state=>{
      const current=requirePractice(state,offeringId,id),updatedAt=now(),status=has(values,'status')?oneOf(values.status,PRACTICE_STATUS,'Practice status'):current.status
      const scoredPoints=optionalNumber(values,'scoredPoints',current.scoredPoints),maxPointsAtAttempt=optionalNumber(values,'maxPointsAtAttempt',current.maxPointsAtAttempt),selfReportedMinutes=optionalNumber(values,'selfReportedMinutes',current.selfReportedMinutes)
      validatePracticeScore(scoredPoints,maxPointsAtAttempt);positiveOrUndefined(selfReportedMinutes,'Self-reported minutes',true)
      const scoreSource=has(values,'scoreSource')?values.scoreSource:scoredPoints!==undefined?current.scoreSource??'self':undefined
      if(scoreSource&&!['self','external-reviewed'].includes(scoreSource))throw validationFailure('Score source is invalid')
      const next:PastPaperPractice={...current,status,selfReportedMinutes,scoredPoints,maxPointsAtAttempt,scoreSource,notes:optionalText(values,'notes',current.notes),startedAt:current.startedAt??(status==='in_progress'||status==='completed'?updatedAt:undefined),completedAt:status==='completed'?current.completedAt??updatedAt:undefined,updatedAt}
      return{state:{...state,pastPaperPractices:state.pastPaperPractices.map(row=>row.id===id?next:row)},value:next}
    }))
  },
  /**
   * Optional per-question tracking: maps the paper (in this offering) to ONE canonical Module 008 ExerciseSet with a
   * deterministic ID, created and linked atomically in the same Study repository. Repeating is idempotent; no items,
   * attempts, solve states or mastery are created or changed.
   */
  async linkPracticeExerciseSet(offeringId:string,practiceId:string,existingSetId?:string){
    const result=unwrapMutation(await StudyRepository.mutate(state=>{
      const practice=requirePractice(state,offeringId,practiceId),paper=requirePaperForOffering(state,offeringId,practice.paperId)
      let set:CourseExerciseSet|undefined,exerciseSets=state.exerciseSets
      if(existingSetId){set=state.exerciseSets.find(row=>row.id===existingSetId&&row.courseOfferingId===offeringId);if(!set)throw notFoundFailure('Exercise set not found in this course offering')}
      else{
        const id=paperSetId(offeringId,paper.id);set=state.exerciseSets.find(row=>row.id===id)
        if(!set){const createdAt=now();set={id,courseOfferingId:offeringId,title:`Past paper · ${paper.label}`,kind:'other',sourceResourceIds:[paper.questionResourceId],status:'active',order:state.exerciseSets.filter(row=>row.courseOfferingId===offeringId).length,createdAt,updatedAt:createdAt};exerciseSets=[...exerciseSets,set]}
      }
      if(practice.linkedExerciseSetId===set.id&&exerciseSets===state.exerciseSets)return{state,value:{practice,set,created:false}}
      const next={...practice,linkedExerciseSetId:set.id,updatedAt:now()}
      return{state:{...state,exerciseSets,pastPaperPractices:state.pastPaperPractices.map(row=>row.id===practiceId?next:row)},value:{practice:next,set,created:exerciseSets!==state.exerciseSets}}
    }))
    if(result.created)await GlobalResourceService.linkResource(result.set.sourceResourceIds[0],{type:'exercise-set',id:result.set.id,label:result.set.title},'exercise source').catch(()=>undefined)
    return result
  },

  // ---- Tasks ------------------------------------------------------------
  /** Idempotent canonical Task. Its dueDate is never derived from, nor written back to, exam or registration milestones. */
  async ensureExamTask(offeringId:string,assessmentId:string,purpose:'preparation'|'registration'){
    const state=await StudyRepository.getState(),assessment=requireAssessment(state,offeringId,assessmentId)
    const id=canonicalExamTaskId(offeringId,assessmentId,purpose)
    const task=await GlobalTaskService.ensure(id,{projectId:offeringId,area:'study',title:purpose==='preparation'?`Prepare: ${assessment.title}`:`Registration: ${assessment.title}`,stage:'Exams',taskType:'general',priority:'medium'})
    try{unwrapMutation(await StudyRepository.mutate(current=>{requireAssessment(current,offeringId,assessmentId);const link:StudyEvidenceLink={id:evidenceId(offeringId,assessmentId,task.id),courseOfferingId:offeringId,targetType:'assessment',targetId:assessmentId,taskId:task.id,relationRole:purpose==='preparation'?'exam preparation task':'exam registration task',createdAt:now()};return{state:{...current,evidenceLinks:current.evidenceLinks.some(row=>row.id===link.id)?current.evidenceLinks:[...current.evidenceLinks,link]},value:link}}))}
    catch(error){throw new Error(`Task ${task.id} was created, but its Study relation could not be saved. Retry to reconcile.`,{cause:error})}
    return task
  },

  // ---- Queries ----------------------------------------------------------
  /** Derived summary for Course Overview; built from the same canonical records, no stored countdowns. */
  async summary(offeringId:string,today=viewerToday()){
    const snapshot=await this.getSnapshot(offeringId);if(!snapshot)return undefined
    const active=snapshot.assessments.filter(row=>lifecycleOf(row)==='active')
    const rows=active.map(assessment=>{const resolution=resolveExamDate(assessment,snapshot.milestones);return{assessment,resolution,registration:registrationOf(assessment).status,sortDate:effectiveExamLocalDate(resolution.effective)??resolution.pending?.localDate}})
    const upcoming=rows.filter(row=>!row.sortDate||row.sortDate>=today).sort((a,b)=>(a.sortDate??'9999').localeCompare(b.sortDate??'9999'))
    const deadlines=snapshot.milestones.filter(row=>row.status==='active'&&row.kind!=='exam'&&row.localDate&&row.localDate>=today&&active.some(item=>item.id===row.assessmentId)).sort((a,b)=>a.localDate!.localeCompare(b.localDate!))
    return{upcoming,deadlines,cancelled:snapshot.assessments.filter(row=>lifecycleOf(row)==='cancelled').length,papers:snapshot.linkedPapers.filter(row=>!row.archivedAt).length,practices:snapshot.practices.length}
  },
  async entityExists(offeringId:string,type:'assessment'|'course-past-paper'|'exam-practice',id:string){
    const state=await StudyRepository.getState()
    if(type==='assessment')return state.assessments.some(row=>row.id===id&&row.offeringId===offeringId&&lifecycleOf(row)!=='archived')
    if(type==='course-past-paper')return state.pastPaperOfferingLinks.some(row=>row.offeringId===offeringId&&row.paperId===id)&&state.coursePastPapers.some(row=>row.id===id&&!row.archivedAt)
    return state.pastPaperPractices.some(row=>row.id===id&&row.offeringId===offeringId)
  },
  /** Calendar projection source (offering-scoped). */
  async calendarSources(offeringId:string){const state=await StudyRepository.getState();return copy({assessments:state.assessments.filter(row=>row.offeringId===offeringId),milestones:state.examMilestones.filter(row=>row.offeringId===offeringId)})},
}
