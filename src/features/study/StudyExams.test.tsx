import { beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MemoryPersistenceAdapter, WorkspacePersistence, type StoredEnvelope } from '../../data/persistence'
import { GlobalCalendarService } from '../../services/globalCalendarService'
import { GlobalResourceService } from '../../services/globalResourceService'
import { GlobalTaskService } from '../../services/globalTaskService'
import { TimeEntryService } from '../../services/timeEntryService'
import { WorkspaceResumeService } from '../../services/workspaceResumeService'
import { StudyCourseService, StudyRepository } from './services/studyCourseService'
import { StudyLearningService } from './services/studyLearningService'
import { StudyExamService, canonicalExamTaskId, practicePercentage } from './services/studyExamService'
import { candidateInstants, instantToZoned, normalizeExamDate, zonedToInstant } from './services/examDates'
import { CourseWorkspace } from './components/CourseWorkspace'
import type { StudyState } from './types'

const offeringId='offering-system-theory-ws26'
const adapter=()=>WorkspacePersistence.adapter as MemoryPersistenceAdapter
const studyEnvelope=async()=>(await adapter().read<StudyState>('study-courses'))!
type V2Data=Omit<StudyState,'examMilestones'|'examSittings'|'coursePastPapers'|'pastPaperOfferingLinks'|'pastPaperPractices'>
const toV2=(data:StudyState):V2Data=>{const {examMilestones:_m,examSittings:_s,coursePastPapers:_p,pastPaperOfferingLinks:_l,pastPaperPractices:_r,...rest}=data;return rest}
const writeLegacy=async(schemaVersion:number,data:unknown)=>{const current=await studyEnvelope();await adapter().write({...current,schemaVersion,data} as StoredEnvelope<unknown>);StudyCourseService.invalidate()}
const legacyAssessment={id:'assessment-legacy',offeringId,assessmentType:'exam' as const,title:'Legacy final exam',officialDateTime:'2027-02-15T09:00:00+01:00',originalTimezone:'Europe/Berlin',provenance:'https://example.org/exam',verified:true}
const calendar=()=>GlobalCalendarService.query({projectId:offeringId})
const examDate=(localDate:string,verificationStatus:'unverified'|'user-confirmed'|'source-verified'='user-confirmed')=>({kind:'exam' as const,datePrecision:'date-only' as const,localDate,verificationStatus,sourceNote:verificationStatus==='source-verified'?'Faculty announcement':undefined})

beforeEach(async()=>{
  cleanup()
  WorkspacePersistence.configure(new MemoryPersistenceAdapter())
  await Promise.all([StudyCourseService.reset(),GlobalResourceService.reset(),GlobalTaskService.reset(),TimeEntryService.reset(),WorkspaceResumeService.reset()])
  StudyLearningService.invalidate()
})

describe('Module 009 schema v3 migration (row 28)',()=>{
  it('migrates v1 -> v3 preserving 007 verified assessments, resource marks and ids, with a backup first',async()=>{
    const current=await studyEnvelope(),v1={...toV2(current.data),assessments:[legacyAssessment],entries:[{id:'entry-old',sourceId:'source-old',resourceId:'resource-old',relativePath:'Altklausur_WS23.pdf',entryType:'file',classification:'past-papers',classificationConfidence:'low',safe:true,status:'available',manualClassification:true}],progress:[{id:'progress-old',offeringId,resourceId:'resource-old',state:'reviewed',updatedAt:'2026-01-01T00:00:00.000Z'}]} as Record<string,unknown>
    for(const key of ['learningUnits','exerciseSets','exerciseItems','attempts','evidenceLinks'])delete v1[key]
    await writeLegacy(1,v1)
    const migrated=await StudyRepository.getState()
    expect(migrated.assessments).toEqual([legacyAssessment])
    expect(migrated.entries[0]).toMatchObject({id:'entry-old',classification:'past-papers',manualClassification:true})
    expect(migrated.progress[0]).toMatchObject({id:'progress-old',targetType:'resource',targetId:'resource-old',studyState:'studied'})
    expect(migrated).toMatchObject({learningUnits:[],examMilestones:[],examSittings:[],coursePastPapers:[],pastPaperOfferingLinks:[],pastPaperPractices:[]})
    const backup=adapter().backups.find(row=>row.metadata.stage==='schema-migration')!
    expect(backup.metadata).toMatchObject({sourceSchemaVersion:1,targetSchemaVersion:3})
    expect(backup.envelope.schemaVersion).toBe(1)
    expect((await studyEnvelope()).schemaVersion).toBe(3)
    // A past-paper classified material never becomes an assessment or a dated exam
    expect((await calendar()).filter(item=>item.sourceType==='assessment-deadline').map(item=>item.canonicalSourceId)).toEqual(['assessment-legacy'])
  })

  it('migrates v2 -> v3 carrying every 008 record unchanged',async()=>{
    const unit=await StudyLearningService.createUnit(offeringId,{title:'Laplace',code:'L1'}),set=await StudyLearningService.createSet(offeringId,{title:'Sheet 1',kind:'exercise'}),item=await StudyLearningService.createItem(offeringId,set.id,{itemCode:'A1'})
    await StudyLearningService.logAttempt(offeringId,item.id,{outcome:'partial',notes:'sign error'});await StudyLearningService.setUnitProgress(offeringId,unit.id,{studyState:'studied',masteryState:'confident'})
    const before=toV2((await studyEnvelope()).data);await writeLegacy(2,before)
    const after=await StudyRepository.getState()
    expect(toV2(after)).toEqual(before)
    expect(after.examMilestones).toEqual([])
    expect(adapter().backups.at(-1)?.metadata).toMatchObject({sourceSchemaVersion:2,targetSchemaVersion:3})
  })

  it('keeps v2 data intact when the backup or the migration commit fails, and retries safely',async()=>{
    const before=toV2((await studyEnvelope()).data);await writeLegacy(2,before)
    const memory=adapter(),backup=memory.backup.bind(memory),write=memory.write.bind(memory)
    memory.backup=async()=>{throw new Error('disk full')}
    await expect(StudyRepository.getState()).rejects.toThrow(/back up study-courses/)
    expect((await studyEnvelope()).schemaVersion).toBe(2)
    memory.backup=backup;memory.write=async envelope=>{if(envelope.domain==='study-courses'&&envelope.schemaVersion===3)throw new Error('commit failed');await write(envelope)}
    StudyCourseService.invalidate();await expect(StudyRepository.getState()).rejects.toThrow(/commit study-courses migration/)
    const stored=await studyEnvelope();expect(stored.schemaVersion).toBe(2);expect(stored.data).toEqual(before)
    memory.write=write;StudyCourseService.invalidate()
    expect((await StudyRepository.getState()).examSittings).toEqual([]);expect((await studyEnvelope()).schemaVersion).toBe(3)
  })

  it('rejects unsupported and incomplete versions without overwriting stored data',async()=>{
    const data=(await studyEnvelope()).data
    await writeLegacy(4,data);await expect(StudyRepository.getState()).rejects.toThrow(/unsupported schema version 4/)
    expect((await studyEnvelope()).schemaVersion).toBe(4)
    await writeLegacy(2,{...toV2(data),exerciseItems:undefined});await expect(StudyRepository.getState()).rejects.toThrow(/Unable to migrate/)
    expect((await studyEnvelope()).schemaVersion).toBe(2)
  })
})

describe('Module 009 dates, timezones and DST (rows 5-7)',()=>{
  it('rejects a Europe/Berlin DST gap and requires a choice in the DST fold',()=>{
    expect(()=>zonedToInstant('2026-03-29','02:30','Europe/Berlin')).toThrow(/does not exist/)
    expect(()=>zonedToInstant('2026-10-25','02:30','Europe/Berlin')).toThrow(/occurs twice/)
    expect(candidateInstants('2026-10-25','02:30','Europe/Berlin')).toHaveLength(2)
    expect(zonedToInstant('2026-10-25','02:30','Europe/Berlin','earlier')).toBe('2026-10-25T00:30:00.000Z')
    expect(zonedToInstant('2026-10-25','02:30','Europe/Berlin','later')).toBe('2026-10-25T01:30:00.000Z')
  })
  it('round-trips valid zoned times across DST and month boundaries',()=>{
    for(const [date,time,zone] of [['2026-03-29','03:30','Europe/Berlin'],['2027-02-15','09:00','Europe/Berlin'],['2026-07-15','09:00','Europe/Berlin'],['2026-12-31','23:30','Asia/Tokyo'],['2027-01-31','23:30','America/New_York']]){
      expect(instantToZoned(zonedToInstant(date,time,zone),zone)).toEqual({localDate:date,localTime:time})
    }
    expect(zonedToInstant('2027-01-31','23:30','America/New_York')).toBe('2027-02-01T04:30:00.000Z')
  })
  it('keeps date-only dates without a clock time and never assumes a timezone',()=>{
    expect(normalizeExamDate({datePrecision:'date-only',localDate:'2027-02-10'})).toEqual({datePrecision:'date-only',localDate:'2027-02-10'})
    expect(()=>normalizeExamDate({datePrecision:'date-only',localDate:'2027-02-10',localTime:'00:00'})).toThrow(/cannot carry a clock time/)
    expect(()=>normalizeExamDate({datePrecision:'exact',localDate:'2027-02-10',localTime:'10:00'})).toThrow(/IANA timezone/)
    expect(()=>normalizeExamDate({datePrecision:'date-only',localDate:'2027-02-30'})).toThrow(/real calendar day/)
    expect(()=>normalizeExamDate({datePrecision:'exact',localDate:'2027-02-10',localTime:'10:00',timezone:'+01:00'})).toThrow(/Unknown IANA/)
  })
  it('stores exact milestones with local time, zone and derived instant; calendar keeps the original civil date',async()=>{
    const assessment=await StudyExamService.createAssessment(offeringId,{title:'Final',assessmentType:'exam'})
    await expect(StudyExamService.setMilestone(offeringId,assessment.id,{kind:'exam',datePrecision:'exact',localDate:'2026-03-29',localTime:'02:30',timezone:'Europe/Berlin',verificationStatus:'user-confirmed'})).rejects.toThrow(/does not exist/)
    const milestone=await StudyExamService.setMilestone(offeringId,assessment.id,{kind:'exam',datePrecision:'exact',localDate:'2027-01-31',localTime:'23:30',timezone:'America/New_York',verificationStatus:'user-confirmed'})
    expect(milestone).toMatchObject({localDate:'2027-01-31',localTime:'23:30',timezone:'America/New_York',instant:'2027-02-01T04:30:00.000Z'})
    const item=(await calendar()).find(row=>row.canonicalSourceId===assessment.id)!
    expect(item).toMatchObject({date:'2027-01-31',start:'2027-02-01T04:30:00.000Z',precision:'exact',timezone:'America/New_York',originalLocal:'2027-01-31 23:30'})
  })
  it('projects date-only confirmed exams without a fabricated time and keeps unknown/unverified dates off the calendar',async()=>{
    const confirmed=await StudyExamService.createAssessment(offeringId,{title:'Oral exam',assessmentType:'exam'}),tentative=await StudyExamService.createAssessment(offeringId,{title:'Quiz',assessmentType:'quiz'}),unknown=await StudyExamService.createAssessment(offeringId,{title:'Testat',assessmentType:'testat'})
    await StudyExamService.setMilestone(offeringId,confirmed.id,examDate('2027-02-10'))
    await StudyExamService.setMilestone(offeringId,tentative.id,examDate('2027-02-11','unverified'))
    await StudyExamService.setMilestone(offeringId,unknown.id,{kind:'exam',datePrecision:'unknown',verificationStatus:'unverified'})
    await expect(StudyExamService.setMilestone(offeringId,unknown.id,{kind:'exam',datePrecision:'unknown',verificationStatus:'user-confirmed'})).rejects.toThrow(/cannot be confirmed/)
    await expect(StudyExamService.setMilestone(offeringId,unknown.id,{...examDate('2027-02-12'),verificationStatus:'legacy-verified'})).rejects.toThrow(/reserved/)
    await expect(StudyExamService.setMilestone(offeringId,unknown.id,{...examDate('2027-02-12'),verificationStatus:'source-verified',sourceNote:undefined})).rejects.toThrow(/source link or source note/)
    const items=(await calendar()).filter(row=>row.sourceType==='assessment-deadline')
    expect(items.map(row=>row.canonicalSourceId)).toEqual([confirmed.id])
    expect(items[0]).toMatchObject({date:'2027-02-10',precision:'date-only',start:undefined,end:undefined,verification:'user-confirmed'})
  })
})

describe('Module 009 assessments, milestones, registration and sittings (rows 1-3, 8-15)',()=>{
  it('creates assessments with stable ids and rejects foreign offerings',async()=>{
    const other=await StudyCourseService.createTermOffering('course-system-theory',{term:'Summer 2027',enrollmentStatus:'active'})
    const assessment=await StudyExamService.createAssessment(offeringId,{title:'  Final exam ',assessmentType:'exam'})
    expect(assessment).toMatchObject({offeringId,title:'Final exam',lifecycle:'active',verified:false,registration:{status:'unknown',history:[]}})
    await expect(StudyExamService.createAssessment(offeringId,{title:'x',assessmentType:'party' as never})).rejects.toThrow(/Assessment type/)
    await expect(StudyExamService.updateAssessment(other.id,assessment.id,{title:'hijack'})).rejects.toThrow(/not found/)
    await expect(StudyExamService.setMilestone(other.id,assessment.id,examDate('2027-02-10'))).rejects.toThrow(/not found/)
    const updated=await StudyExamService.updateAssessment(offeringId,assessment.id,{title:'Final exam (Klausur)'})
    expect(updated.id).toBe(assessment.id)
    expect((await StudyExamService.getSnapshot(other.id))!.assessments).toEqual([])
    expect((await StudyExamService.getSnapshot(offeringId))!.assessments.map(row=>row.id)).toContain(assessment.id)
  })
  it('supersedes a corrected date with history and cancels without deleting',async()=>{
    const assessment=await StudyExamService.createAssessment(offeringId,{title:'Final',assessmentType:'exam'})
    const first=await StudyExamService.setMilestone(offeringId,assessment.id,examDate('2027-02-10','source-verified'))
    const second=await StudyExamService.setMilestone(offeringId,assessment.id,examDate('2027-02-17','source-verified'))
    const snapshot=(await StudyExamService.getSnapshot(offeringId))!
    expect(snapshot.milestones.find(row=>row.id===first.id)).toMatchObject({status:'superseded',supersededById:second.id,localDate:'2027-02-10',sourceNote:'Faculty announcement'})
    expect(second.supersedesId).toBe(first.id)
    expect((await calendar()).filter(row=>row.canonicalSourceId===assessment.id).map(row=>row.date)).toEqual(['2027-02-17'])
    await StudyExamService.setAssessmentLifecycle(offeringId,assessment.id,'cancelled')
    expect((await calendar()).some(row=>row.canonicalSourceId===assessment.id)).toBe(false)
    expect((await StudyExamService.summary(offeringId,'2027-01-01'))!.upcoming.some(row=>row.assessment.id===assessment.id)).toBe(false)
    const after=(await StudyExamService.getSnapshot(offeringId))!
    expect(after.milestones.filter(row=>row.assessmentId===assessment.id)).toHaveLength(2)
    expect(after.assessments.find(row=>row.id===assessment.id)?.lifecycle).toBe('cancelled')
  })
  it('keeps registration open/close, withdrawal and exam as separate milestones; registration changes only explicitly',async()=>{
    const assessment=await StudyExamService.createAssessment(offeringId,{title:'Final',assessmentType:'exam'})
    await StudyExamService.setMilestone(offeringId,assessment.id,examDate('2027-02-17'))
    await StudyExamService.setMilestone(offeringId,assessment.id,{...examDate('2026-12-01'),kind:'registration-open'})
    await StudyExamService.setMilestone(offeringId,assessment.id,{...examDate('2027-01-10'),kind:'registration-close'})
    await StudyExamService.setMilestone(offeringId,assessment.id,{...examDate('2027-02-03'),kind:'withdrawal-close'})
    const active=(await StudyExamService.getSnapshot(offeringId))!.milestones.filter(row=>row.status==='active')
    expect(active.map(row=>`${row.kind}:${row.localDate}`).sort()).toEqual(['exam:2027-02-17','registration-close:2027-01-10','registration-open:2026-12-01','withdrawal-close:2027-02-03'])
    expect((await StudyExamService.getSnapshot(offeringId))!.assessments.find(row=>row.id===assessment.id)?.registration?.status).toBe('unknown')
    await expect(StudyExamService.setRegistration(offeringId,assessment.id,'maybe' as never)).rejects.toThrow(/Registration status/)
    await StudyExamService.setRegistration(offeringId,assessment.id,'registered','confirmation e-mail')
    const saved=await StudyExamService.setRegistration(offeringId,assessment.id,'withdrawn')
    expect(saved.registration).toMatchObject({status:'withdrawn',history:[{status:'registered',evidence:'confirmation e-mail'},{status:'withdrawn'}]})
    const items=await calendar()
    expect(items.filter(row=>row.sourceType==='exam-milestone').map(row=>row.date).sort()).toEqual(['2026-12-01','2027-01-10','2027-02-03'])
    expect(items.filter(row=>row.sourceType==='assessment-deadline'&&row.canonicalSourceId===assessment.id)).toHaveLength(1)
  })
  it('records sittings only explicitly, never infers pass/fail, and keeps history per offering',async()=>{
    const other=await StudyCourseService.createTermOffering('course-system-theory',{term:'Summer 2027',enrollmentStatus:'active'})
    const assessment=await StudyExamService.createAssessment(offeringId,{title:'Final',assessmentType:'exam'})
    await StudyExamService.setMilestone(offeringId,assessment.id,examDate('2020-02-10'))
    expect((await StudyExamService.getSnapshot(offeringId))!.sittings).toEqual([])
    const absent=await StudyExamService.recordSitting(offeringId,assessment.id,{participationStatus:'absent',outcomeStatus:'unknown'})
    const graded=await StudyExamService.recordSitting(offeringId,assessment.id,{participationStatus:'attended',outcomeStatus:'pending',gradeValue:'4.0'})
    expect(graded).toMatchObject({outcomeStatus:'pending',gradeValue:'4.0',gradeSource:'self-reported'})
    await expect(StudyExamService.recordSitting(offeringId,assessment.id,{participationStatus:'attended',outcomeStatus:'passed',gradeValue:'1.3',gradeSource:'official-evidenced'})).rejects.toThrow(/evidence/)
    await expect(StudyExamService.recordSitting(offeringId,assessment.id,{participationStatus:'absent',outcomeStatus:'passed'})).rejects.toThrow(/requires attendance/)
    await expect(StudyExamService.updateSitting(other.id,absent.id,{notes:'x'})).rejects.toThrow(/not found/)
    const otherSnapshot=(await StudyExamService.getSnapshot(other.id))!
    expect(otherSnapshot.sittings).toEqual([])
    expect(otherSnapshot.courseHistory.map(row=>[row.sitting.id,row.term])).toEqual([[absent.id,'Winter 2026/27'],[graded.id,'Winter 2026/27']])
    const edited=await StudyExamService.updateSitting(offeringId,graded.id,{notes:'Einsicht booked'})
    expect(edited).toMatchObject({gradeValue:'4.0',gradeSource:'self-reported',outcomeStatus:'pending',notes:'Einsicht booked'})
  })
})

describe('Module 009 past papers and practice (rows 4, 16-22, 26)',()=>{
  const setupPaper=async()=>{await StudyCourseService.addExistingResource(offeringId,'r-survey-url');return StudyExamService.createPastPaper(offeringId,{label:'Klausur WS 2024/25',questionResourceId:'r-survey-url',paperKind:'past-exam',year:2025})}
  it('catalogs one canonical Resource without creating an assessment, date or copy',async()=>{
    const resourcesBefore=(await GlobalResourceService.list()).length,assessmentsBefore=(await StudyRepository.getState()).assessments.length,calendarBefore=await calendar()
    const paper=await setupPaper()
    expect(paper).toMatchObject({courseId:'course-system-theory',questionResourceId:'r-survey-url'})
    expect((await GlobalResourceService.list()).length).toBe(resourcesBefore)
    expect((await GlobalResourceService.get('r-survey-url'))!.links.some(link=>link.entityType==='course-past-paper'&&link.entityId===paper.id&&link.relationRole==='past paper question')).toBe(true)
    expect((await StudyRepository.getState()).assessments.length).toBe(assessmentsBefore)
    expect(await calendar()).toEqual(calendarBefore)
    await expect(StudyExamService.createPastPaper(offeringId,{label:'x',questionResourceId:'missing'})).rejects.toThrow(/Linked resource not found/)
    await expect(StudyExamService.createPastPaper(offeringId,{label:'x',questionResourceId:'r-survey-url',solutionResourceId:'r-survey-url'})).rejects.toThrow(/different Resource/)
  })
  it('preserves omitted metadata on partial update and clears only explicit empties',async()=>{
    const paper=await setupPaper(),withSolution=await StudyExamService.updatePastPaper(offeringId,paper.id,{solutionResourceId:'r-aloha-pdf',originTerm:'WS 24/25',maxPoints:90})
    const unrelated=await StudyExamService.updatePastPaper(offeringId,paper.id,{label:'Klausur WS24'})
    expect(unrelated).toMatchObject({solutionResourceId:'r-aloha-pdf',originTerm:'WS 24/25',maxPoints:90,year:2025})
    expect(withSolution.solutionResourceId).toBe('r-aloha-pdf')
    expect((await StudyExamService.updatePastPaper(offeringId,paper.id,{originTerm:''})).originTerm).toBeUndefined()
  })
  it('reuses a paper across offerings explicitly without copying practice or tasks',async()=>{
    const paper=await setupPaper(),other=await StudyCourseService.createTermOffering('course-system-theory',{term:'Summer 2027',enrollmentStatus:'active'}),foreign=await StudyCourseService.createOffering({title:'Other course',term:'WS',enrollmentStatus:'active'})
    const practice=await StudyExamService.createPractice(offeringId,paper.id)
    await StudyExamService.updatePractice(offeringId,practice.id,{status:'completed',scoredPoints:60,maxPointsAtAttempt:90})
    await expect(StudyExamService.createPractice(other.id,paper.id)).rejects.toThrow(/Link this past paper/)
    expect((await StudyExamService.getSnapshot(other.id))!.catalogPapers.map(row=>row.id)).toEqual([paper.id])
    const [linkA,linkB]=await Promise.all([StudyExamService.linkPaperToOffering(other.id,paper.id),StudyExamService.linkPaperToOffering(other.id,paper.id)])
    expect(linkA.id).toBe(linkB.id)
    const otherSnapshot=(await StudyExamService.getSnapshot(other.id))!
    expect(otherSnapshot.linkedPapers.map(row=>row.id)).toEqual([paper.id]);expect(otherSnapshot.practices).toEqual([])
    expect(await GlobalTaskService.list(other.id)).toEqual([])
    await expect(StudyExamService.linkPaperToOffering(foreign.offering.id,paper.id)).rejects.toThrow(/not found for this course/)
    await expect(StudyExamService.updatePractice(other.id,practice.id,{notes:'x'})).rejects.toThrow(/not found/)
  })
  it('keeps paper and practice when bytes are unavailable; Open Original stays capability-gated',async()=>{
    await StudyCourseService.addExistingResource(offeringId,'r-aloha-pdf')
    const paper=await StudyExamService.createPastPaper(offeringId,{label:'Mock',questionResourceId:'r-aloha-pdf',paperKind:'mock'}),practice=await StudyExamService.createPractice(offeringId,paper.id,{status:'in_progress'})
    await expect(GlobalResourceService.openOriginal('r-aloha-pdf')).rejects.toThrow(/No authorized browser-openable source/)
    const snapshot=(await StudyExamService.getSnapshot(offeringId))!
    expect(snapshot.linkedPapers[0].id).toBe(paper.id);expect(snapshot.practices[0]).toMatchObject({id:practice.id,status:'in_progress'})
  })
  it('shows practice percentage only with explicit points and denominator, and never touches official results or time entries',async()=>{
    const paper=await setupPaper(),practice=await StudyExamService.createPractice(offeringId,paper.id),assessment=await StudyExamService.createAssessment(offeringId,{title:'Final',assessmentType:'exam'})
    expect(practicePercentage(practice)).toBeUndefined()
    const scored=await StudyExamService.updatePractice(offeringId,practice.id,{scoredPoints:45,selfReportedMinutes:120})
    expect(scored).toMatchObject({scoredPoints:45,scoreSource:'self',selfReportedMinutes:120});expect(practicePercentage(scored)).toBeUndefined()
    await expect(StudyExamService.updatePractice(offeringId,practice.id,{maxPointsAtAttempt:40})).rejects.toThrow(/cannot exceed/)
    await expect(StudyExamService.updatePractice(offeringId,practice.id,{scoredPoints:-1})).rejects.toThrow(/negative/)
    await expect(StudyExamService.updatePractice(offeringId,practice.id,{maxPointsAtAttempt:0})).rejects.toThrow(/positive/)
    expect(practicePercentage(await StudyExamService.updatePractice(offeringId,practice.id,{maxPointsAtAttempt:90,status:'completed'}))).toBe(50)
    const snapshot=(await StudyExamService.getSnapshot(offeringId))!
    expect(snapshot.sittings).toEqual([]);expect(snapshot.assessments.find(row=>row.id===assessment.id)?.verified).toBe(false)
    expect(await TimeEntryService.list(offeringId)).toEqual([])
  })
  it('maps per-question practice to one canonical 008 exercise set idempotently without solving anything',async()=>{
    const paper=await setupPaper(),practice=await StudyExamService.createPractice(offeringId,paper.id),second=await StudyExamService.createPractice(offeringId,paper.id)
    const progressBefore=await StudyLearningService.queryProgress(offeringId)
    const [a,b]=await Promise.all([StudyExamService.linkPracticeExerciseSet(offeringId,practice.id),StudyExamService.linkPracticeExerciseSet(offeringId,practice.id)])
    const c=await StudyExamService.linkPracticeExerciseSet(offeringId,second.id)
    expect(new Set([a.set.id,b.set.id,c.set.id]).size).toBe(1)
    const state=await StudyRepository.getState()
    expect(state.exerciseSets.filter(row=>row.id===a.set.id)).toHaveLength(1)
    expect(state.exerciseItems).toEqual([]);expect(state.attempts).toEqual([]);expect(state.progress).toEqual([])
    expect(await StudyLearningService.queryProgress(offeringId)).toEqual(progressBefore)
    await StudyLearningService.createItem(offeringId,a.set.id,{itemCode:'A1'});await StudyLearningService.createItem(offeringId,a.set.id,{itemCode:'a1'})
    expect((await StudyRepository.getState()).exerciseItems).toHaveLength(1)
  })
})

describe('Module 009 shared Task / Calendar / Timer / Resume integration (rows 23-27)',()=>{
  it('ensures one canonical exam task under concurrency and reconciles a failed Study relation on retry',async()=>{
    const assessment=await StudyExamService.createAssessment(offeringId,{title:'Final',assessmentType:'exam'})
    const [one,two]=await Promise.all([StudyExamService.ensureExamTask(offeringId,assessment.id,'preparation'),StudyExamService.ensureExamTask(offeringId,assessment.id,'preparation')])
    expect(one.id).toBe(canonicalExamTaskId(offeringId,assessment.id,'preparation'));expect(two.id).toBe(one.id)
    expect((await GlobalTaskService.list(offeringId)).filter(task=>task.id===one.id)).toHaveLength(1)
    const memory=adapter(),write=memory.write.bind(memory);let fail=true
    memory.write=async envelope=>{if(fail&&envelope.domain==='study-courses'){fail=false;throw new Error('relation write failed')}await write(envelope)}
    await expect(StudyExamService.ensureExamTask(offeringId,assessment.id,'registration')).rejects.toThrow(/created, but its Study relation could not be saved/)
    const retried=await StudyExamService.ensureExamTask(offeringId,assessment.id,'registration')
    expect((await GlobalTaskService.list(offeringId)).filter(task=>task.id===retried.id)).toHaveLength(1)
    expect((await StudyRepository.getState()).evidenceLinks.filter(row=>row.targetType==='assessment'&&row.taskId)).toHaveLength(2)
  })
  it('keeps task due date, planned sessions and exam/registration milestones as separate facts',async()=>{
    const assessment=await StudyExamService.createAssessment(offeringId,{title:'Final',assessmentType:'exam'})
    await StudyExamService.setMilestone(offeringId,assessment.id,examDate('2027-02-17'))
    await StudyExamService.setMilestone(offeringId,assessment.id,{...examDate('2027-01-10'),kind:'registration-close'})
    const task=await StudyExamService.ensureExamTask(offeringId,assessment.id,'preparation')
    expect(task.dueDate).toBeUndefined()
    await GlobalTaskService.update(task.id,{dueDate:'2027-02-01'});await GlobalTaskService.planDay(task.id,'2027-01-20')
    const items=await calendar(),snapshot=(await StudyExamService.getSnapshot(offeringId))!
    expect(items.filter(row=>row.canonicalSourceId===assessment.id).map(row=>row.date)).toEqual(['2027-02-17'])
    expect(items.find(row=>row.sourceType==='task-due-date'&&row.taskId===task.id)?.date).toBe('2027-02-01')
    expect(items.filter(row=>row.sourceType==='exam-milestone').map(row=>row.date)).toEqual(['2027-01-10'])
    expect(snapshot.milestones.filter(row=>row.status==='active').map(row=>row.localDate).sort()).toEqual(['2027-01-10','2027-02-17'])
  })
  it('replaces the legacy 007 projection with one stable exam event instead of duplicating it',async()=>{
    const state=await StudyRepository.getState();await StudyRepository.replace({...state,assessments:[...state.assessments,legacyAssessment]})
    const before=(await calendar()).filter(row=>row.sourceType==='assessment-deadline')
    expect(before).toHaveLength(1);expect(before[0]).toMatchObject({id:'calendar-assessment:assessment-legacy',date:'2027-02-15',precision:'exact'})
    await StudyExamService.setMilestone(offeringId,'assessment-legacy',{kind:'exam',datePrecision:'exact',localDate:'2027-02-16',localTime:'09:00',timezone:'Europe/Berlin',verificationStatus:'source-verified',sourceUrl:'https://example.org/exam'})
    const after=(await calendar()).filter(row=>row.sourceType==='assessment-deadline')
    expect(after).toHaveLength(1);expect(after[0]).toMatchObject({id:'calendar-assessment:assessment-legacy',date:'2027-02-16',start:'2027-02-16T08:00:00.000Z',verification:'source-verified'})
    expect((await StudyRepository.getState()).assessments.find(row=>row.id==='assessment-legacy')).toMatchObject({officialDateTime:legacyAssessment.officialDateTime,verified:true,originalTimezone:'Europe/Berlin'})
  })
  it('validates exam resume links and falls back safely after archive or for other offerings',async()=>{
    const paper=await (async()=>{await StudyCourseService.addExistingResource(offeringId,'r-survey-url');return StudyExamService.createPastPaper(offeringId,{label:'P',questionResourceId:'r-survey-url'})})()
    const assessment=await StudyExamService.createAssessment(offeringId,{title:'Final',assessmentType:'exam'}),practice=await StudyExamService.createPractice(offeringId,paper.id)
    const route=(key:string,id:string)=>`/study/courses/${offeringId}/exams?${key}=${id}`
    await WorkspaceResumeService.record({area:'study',projectId:offeringId,entityType:'assessment',entityId:assessment.id,route:route('assessment',assessment.id)})
    expect(await WorkspaceResumeService.resolveLatest(offeringId,'study')).toMatchObject({valid:true,route:route('assessment',assessment.id)})
    await StudyExamService.setAssessmentLifecycle(offeringId,assessment.id,'archived')
    expect(await WorkspaceResumeService.resolveLatest(offeringId,'study')).toMatchObject({valid:false,route:`/study/courses/${offeringId}/overview`})
    await WorkspaceResumeService.record({area:'study',projectId:offeringId,entityType:'exam-practice',entityId:practice.id,route:route('practice',practice.id)},new Date(Date.now()+1000))
    expect((await WorkspaceResumeService.resolveLatest(offeringId,'study')).valid).toBe(true)
    await WorkspaceResumeService.record({area:'study',projectId:offeringId,entityType:'course-past-paper',entityId:paper.id,route:route('paper',paper.id)},new Date(Date.now()+2000))
    await StudyExamService.archivePastPaper(offeringId,paper.id)
    expect((await WorkspaceResumeService.resolveLatest(offeringId,'study')).valid).toBe(false)
    const other=await StudyCourseService.createTermOffering('course-system-theory',{term:'Summer 2027',enrollmentStatus:'active'})
    await WorkspaceResumeService.record({area:'study',projectId:other.id,entityType:'exam-practice',entityId:practice.id,route:`/study/courses/${other.id}/exams?practice=${practice.id}`})
    expect((await WorkspaceResumeService.resolveLatest(other.id,'study')).valid).toBe(false)
  })
})

describe('Module 009 Exams UI (rows 2, 5, 29)',()=>{
  const renderExams=(entry=`/study/courses/${offeringId}/exams`)=>render(<MemoryRouter initialEntries={[entry]}><CourseWorkspace offeringId={offeringId} section="exams" onStartTimer={()=>undefined}/></MemoryRouter>)
  it('opens the Exams tab, shows unknown dates honestly, and restores focus after create + Escape',async()=>{
    renderExams()
    expect(await screen.findByRole('link',{name:'Exams'})).toBeInTheDocument()
    expect(await screen.findByText('Final examination')).toBeInTheDocument()
    expect(screen.getAllByText('Unknown date').length).toBeGreaterThan(0)
    const input=screen.getByRole('textbox',{name:'New assessment title'})
    fireEvent.change(input,{target:{value:'Klausur'}});fireEvent.click(screen.getByRole('button',{name:/Add assessment/}))
    expect(await screen.findByRole('complementary',{name:'Assessment inspector'})).toBeInTheDocument()
    expect(screen.getByText(/no university system is contacted/i)).toBeInTheDocument()
    fireEvent.keyDown(window,{key:'Escape'})
    await waitFor(()=>expect(screen.queryByRole('complementary',{name:'Assessment inspector'})).not.toBeInTheDocument())
    await waitFor(()=>expect(input).toHaveFocus())
    const card=screen.getByRole('button',{name:/Klausur/});card.focus();fireEvent.click(card)
    expect(await screen.findByRole('complementary',{name:'Assessment inspector'})).toBeInTheDocument()
    fireEvent.keyDown(window,{key:'Escape'});await waitFor(()=>expect(card).toHaveFocus())
  })
  it('resolves missing and conflicting deep links without inventing state',async()=>{
    renderExams(`/study/courses/${offeringId}/exams?paper=missing-paper&practice=also-missing`)
    expect(await screen.findByText(/not available in this course offering/)).toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
  it('shows the overview exam summary from the same canonical records',async()=>{
    const assessment=await StudyExamService.createAssessment(offeringId,{title:'Signals final',assessmentType:'exam'})
    await StudyExamService.setMilestone(offeringId,assessment.id,examDate('2099-02-10'))
    await StudyExamService.setMilestone(offeringId,'assessment-system-theory-exam',examDate('2099-03-01','unverified'))
    render(<MemoryRouter><CourseWorkspace offeringId={offeringId} section="overview" onStartTimer={()=>undefined}/></MemoryRouter>)
    expect(await screen.findByRole('heading',{name:'Signals final'})).toBeInTheDocument()
    expect(screen.getByText('2099-02-10')).toBeInTheDocument();expect(screen.getByText('Date known, time unknown')).toBeInTheDocument()
    expect(screen.getByText('1 more upcoming')).toBeInTheDocument()
  })
})
