import type { ResearchTask, TimeEntry } from '../research/types'
import type { WorkspaceResource } from '../../services/globalResourceService'

export type EnrollmentStatus='active'|'paused'|'completed'|'archived'
export type MaterialSourceKind='folder'|'archive'|'manual'
export type PermissionState='session-authorized'|'permission-required'|'offline'|'unsupported'
export type ImportStatus='preview'|'completed'|'partial'|'failed'|'cancelled'
export type MaterialClassification='lectures'|'exercises'|'tutorials'|'past-papers'|'labs'|'notes'|'administrative'|'other'
export type StudyProgressState='not-started'|'studying'|'studied'|'reviewed'
export type StudyProgressTargetType='resource'|'learning-unit'|'exercise-item'
export type LearningStudyState='not_started'|'in_progress'|'studied'
export type MasteryState='unassessed'|'needs_review'|'practicing'|'confident'
export type ExerciseSolveState='not_started'|'in_progress'|'blocked'|'solved'
export type ExerciseOutcome='unknown'|'incorrect'|'partial'|'correct'
export type ExerciseSetKind='exercise'|'kgu'|'tutorial'|'other'

export interface Course{id:string;title:string;code?:string;department?:string;defaultTags:string[];demo?:boolean}
export interface CourseOffering{id:string;courseId:string;term:string;enrollmentStatus:EnrollmentStatus;lecturer?:string;ects?:number;courseUrl?:string;progressStatus?:string;demo?:boolean}
export interface CourseMaterialSource{id:string;courseOfferingId:string;kind:MaterialSourceKind;label:string;fingerprint:string;deviceId?:string;indexedAt?:string;permissionState:PermissionState;importMode:'index-only';metadataSync:'synced'|'pending'|'offline'|'error'}
export interface ManifestEntry{relativePath:string;entryType:'file'|'directory';size?:number;compressedSize?:number;modifiedAt?:string;classification:MaterialClassification;classificationConfidence:'low'|'medium'|'high';safe:boolean;reason?:string;executable?:boolean;symlink?:boolean;encrypted?:boolean}
export interface CourseMaterialEntry extends ManifestEntry{id:string;sourceId:string;resourceId?:string;status:'available'|'missing'|'rejected';manualClassification?:boolean}
export interface CourseMaterialImport{id:string;sourceId:string;status:ImportStatus;startedAt:string;completedAt?:string;totals:{discovered:number;accepted:number;rejected:number};failures:Array<{path?:string;reason:string}>;manifestVersion:1;initiatedBy:'user'}
export interface CourseSection{id:string;offeringId:string;type:MaterialClassification;label:string;order:number}
export interface CourseLearningUnit{id:string;courseOfferingId:string;parentUnitId?:string;title:string;code?:string;order:number;description?:string;includeInCoverage:boolean;resourceIds:string[];archivedAt?:string;createdAt:string;updatedAt:string}
export interface CourseExerciseSet{id:string;courseOfferingId:string;title:string;setCode?:string;kind:ExerciseSetKind;learningUnitId?:string;sourceResourceIds:string[];status:'active'|'archived';order:number;createdAt:string;updatedAt:string}
export interface CourseExerciseItem{id:string;courseOfferingId:string;setId:string;itemCode:string;normalizedCode:string;title?:string;learningUnitId?:string;sourcePointer?:string;sourceResourceIds:string[];order:number;includeInCoverage:boolean;archivedAt?:string;createdAt:string;updatedAt:string}
export interface CourseExerciseAttempt{id:string;exerciseItemId:string;courseOfferingId:string;attemptedAt:string;outcome:ExerciseOutcome;notes?:string;mistakeTags:string[];difficulty?:'easy'|'medium'|'hard';noteId?:string;createdAt:string;revisedAt?:string}
export interface StudyEvidenceLink{id:string;courseOfferingId:string;targetType:'learning-unit'|'exercise-set'|'exercise-item'|'assessment';targetId:string;resourceId?:string;noteId?:string;taskId?:string;relationRole:string;createdAt:string}
export interface CourseStudyProgress{id:string;offeringId:string;targetType?:StudyProgressTargetType;targetId?:string;resourceId?:string;sectionId?:string;state?:StudyProgressState;studyState?:LearningStudyState;masteryState?:MasteryState;solveState?:ExerciseSolveState;needsReview?:boolean;lastStudiedAt?:string;lastReviewedAt?:string;reviewOn?:string;updatedAt:string;noteId?:string}
export type AssessmentType='exam'|'quiz'|'testat'|'report'|'assignment'
export type RegistrationState='unknown'|'not_registered'|'registered'|'withdrawn'|'not_required'
export interface RegistrationLogEntry{status:RegistrationState;changedAt:string;evidence?:string}
export interface AssessmentRegistration{status:RegistrationState;updatedAt?:string;evidence?:string;history:RegistrationLogEntry[]}
export type AssessmentLifecycle='active'|'archived'|'cancelled'
/** Module 007 fields keep their original meaning; Module 009 adds optional lifecycle, registration and timestamps. */
export interface CourseAssessment{id:string;offeringId:string;assessmentType:AssessmentType;title:string;officialDateTime?:string;originalTimezone?:string;provenance?:string;registrationStatus?:string;verified:boolean;lifecycle?:AssessmentLifecycle;registration?:AssessmentRegistration;createdAt?:string;updatedAt?:string}
export type DatePrecision='unknown'|'date-only'|'exact'
export type ExamVerificationStatus='unverified'|'user-confirmed'|'source-verified'|'legacy-verified'
export type ExamMilestoneKind='registration-open'|'registration-close'|'withdrawal-close'|'exam'|'grade-release'
export type ExamMilestoneStatus='active'|'superseded'|'cancelled'
export interface ExamMilestone{id:string;offeringId:string;assessmentId:string;kind:ExamMilestoneKind;datePrecision:DatePrecision;localDate?:string;localTime?:string;timezone?:string;instant?:string;disambiguation?:'earlier'|'later';verificationStatus:ExamVerificationStatus;sourceUrl?:string;sourceNote?:string;status:ExamMilestoneStatus;supersedesId?:string;supersededById?:string;createdAt:string;updatedAt:string}
export type SittingParticipation='unknown'|'not_taken'|'attended'|'absent'|'withdrawn'
export type SittingOutcome='unknown'|'pending'|'passed'|'failed'|'void'
export interface ExamSitting{id:string;offeringId:string;assessmentId:string;sittingLabel?:string;participationStatus:SittingParticipation;examDateReference?:string;outcomeStatus:SittingOutcome;gradeValue?:string;gradeSource:'none'|'self-reported'|'official-evidenced';gradeSystem?:string;evidenceResourceId?:string;notes?:string;createdAt:string;updatedAt:string}
export type PastPaperKind='past-exam'|'mock'|'sample'|'unknown'
export interface CoursePastPaper{id:string;courseId:string;label:string;originTerm?:string;year?:number;paperKind:PastPaperKind;questionResourceId:string;solutionResourceId?:string;maxPoints?:number;durationMinutes?:number;notes?:string;archivedAt?:string;createdAt:string;updatedAt:string}
export interface PastPaperOfferingLink{id:string;paperId:string;offeringId:string;createdAt:string}
export type PracticeStatus='planned'|'in_progress'|'completed'|'abandoned'
export interface PastPaperPractice{id:string;offeringId:string;paperId:string;status:PracticeStatus;startedAt?:string;completedAt?:string;selfReportedMinutes?:number;scoredPoints?:number;maxPointsAtAttempt?:number;scoreSource?:'self'|'external-reviewed';notes?:string;linkedExerciseSetId?:string;createdAt:string;updatedAt:string}
export interface StudyState{courses:Course[];offerings:CourseOffering[];sources:CourseMaterialSource[];imports:CourseMaterialImport[];entries:CourseMaterialEntry[];sections:CourseSection[];progress:CourseStudyProgress[];assessments:CourseAssessment[];learningUnits:CourseLearningUnit[];exerciseSets:CourseExerciseSet[];exerciseItems:CourseExerciseItem[];attempts:CourseExerciseAttempt[];evidenceLinks:StudyEvidenceLink[];examMilestones:ExamMilestone[];examSittings:ExamSitting[];coursePastPapers:CoursePastPaper[];pastPaperOfferingLinks:PastPaperOfferingLink[];pastPaperPractices:PastPaperPractice[]}
export interface CourseOfferingView{course:Course;offering:CourseOffering;sources:CourseMaterialSource[];entries:CourseMaterialEntry[];sections:CourseSection[];progress:CourseStudyProgress[];assessments:CourseAssessment[];learningUnits:CourseLearningUnit[];exerciseSets:CourseExerciseSet[];exerciseItems:CourseExerciseItem[];attempts:CourseExerciseAttempt[];evidenceLinks:StudyEvidenceLink[];resources:WorkspaceResource[];tasks:ResearchTask[];timeEntries:TimeEntry[]}
export interface CourseProgressQuery{offeringId:string;unit:{tracked:number;studied:number;confident:number;needsReview:number;percentage?:number};exercise:{tracked:number;attempted:number;solved:number;toRetry:number;attemptPercentage?:number;solvedPercentage?:number};reviewCount:number}
export interface ManifestPreview{sourceLabel:string;sourceFingerprint:string;sourceKind:MaterialSourceKind;entries:ManifestEntry[];failures:Array<{path?:string;reason:string}>;totals:{discovered:number;accepted:number;rejected:number;uncompressedBytes:number};canConfirm:boolean}
