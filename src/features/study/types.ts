import type { ResearchTask, TimeEntry } from '../research/types'
import type { WorkspaceResource } from '../../services/globalResourceService'

export type EnrollmentStatus='active'|'paused'|'completed'|'archived'
export type MaterialSourceKind='folder'|'archive'|'manual'
export type PermissionState='session-authorized'|'permission-required'|'offline'|'unsupported'
export type ImportStatus='preview'|'completed'|'partial'|'failed'|'cancelled'
export type MaterialClassification='lectures'|'exercises'|'tutorials'|'past-papers'|'labs'|'notes'|'administrative'|'other'
export type StudyProgressState='not-started'|'studying'|'studied'|'reviewed'

export interface Course{id:string;title:string;code?:string;department?:string;defaultTags:string[];demo?:boolean}
export interface CourseOffering{id:string;courseId:string;term:string;enrollmentStatus:EnrollmentStatus;lecturer?:string;ects?:number;courseUrl?:string;progressStatus?:string;demo?:boolean}
export interface CourseMaterialSource{id:string;courseOfferingId:string;kind:MaterialSourceKind;label:string;fingerprint:string;deviceId?:string;indexedAt?:string;permissionState:PermissionState;importMode:'index-only';metadataSync:'synced'|'pending'|'offline'|'error'}
export interface ManifestEntry{relativePath:string;entryType:'file'|'directory';size?:number;compressedSize?:number;modifiedAt?:string;classification:MaterialClassification;classificationConfidence:'low'|'medium'|'high';safe:boolean;reason?:string;executable?:boolean;symlink?:boolean;encrypted?:boolean}
export interface CourseMaterialEntry extends ManifestEntry{id:string;sourceId:string;resourceId?:string;status:'available'|'missing'|'rejected';manualClassification?:boolean}
export interface CourseMaterialImport{id:string;sourceId:string;status:ImportStatus;startedAt:string;completedAt?:string;totals:{discovered:number;accepted:number;rejected:number};failures:Array<{path?:string;reason:string}>;manifestVersion:1;initiatedBy:'user'}
export interface CourseSection{id:string;offeringId:string;type:MaterialClassification;label:string;order:number}
export interface CourseStudyProgress{id:string;offeringId:string;resourceId?:string;sectionId?:string;state:StudyProgressState;updatedAt:string;noteId?:string}
export interface CourseAssessment{id:string;offeringId:string;assessmentType:'exam'|'quiz'|'testat'|'report'|'assignment';title:string;officialDateTime?:string;originalTimezone?:string;provenance?:string;registrationStatus?:string;verified:boolean}
export interface StudyState{courses:Course[];offerings:CourseOffering[];sources:CourseMaterialSource[];imports:CourseMaterialImport[];entries:CourseMaterialEntry[];sections:CourseSection[];progress:CourseStudyProgress[];assessments:CourseAssessment[]}
export interface CourseOfferingView{course:Course;offering:CourseOffering;sources:CourseMaterialSource[];entries:CourseMaterialEntry[];sections:CourseSection[];progress:CourseStudyProgress[];assessments:CourseAssessment[];resources:WorkspaceResource[];tasks:ResearchTask[];timeEntries:TimeEntry[]}
export interface ManifestPreview{sourceLabel:string;sourceFingerprint:string;sourceKind:MaterialSourceKind;entries:ManifestEntry[];failures:Array<{path?:string;reason:string}>;totals:{discovered:number;accepted:number;rejected:number;uncompressedBytes:number};canConfirm:boolean}
