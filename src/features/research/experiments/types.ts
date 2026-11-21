export type ExperimentStatus='planned'|'active'|'on-hold'|'completed'|'archived'
export type ExperimentType='robotics'|'simulation'|'offline-evaluation'|'scientific'|'other'
export type ExperimentSource='manual'|'local-files'|'external-tracker'|'mixed'
export type RunStatus='draft'|'queued'|'running'|'completed'|'failed'|'cancelled'|'unknown'
export type RunSourceKind='manual'|'local-file'|'external-mlflow'|'external-dvc'|'external-aim'
export type MetricDirection='higher'|'lower'|'target'
export type TypedValue=string|number|boolean

export interface RunParameter { key:string;typedValue:TypedValue;unit?:string;source:'workspace'|'external' }
export interface RunMetric { name:string;numericValue?:number;unit?:string;split?:string;step?:number;direction?:MetricDirection;protocolId?:string;source:'workspace'|'external';sampleSize?:number }
export interface ExperimentCodeRef { repoUrl?:string;commitSha?:string;branchAtRun?:string;dirtyFlag?:boolean;entrypoint?:string;configResourceId?:string }
export interface ExperimentDatasetRef { datasetName:string;version?:string;digest?:string;split?:string;resourceId?:string;availability?:string }
export interface ExperimentEnvironment { operatingSystem?:string;runtime?:string;dependenciesLock?:string;containerDigest?:string;hardware?:string;device?:string;seed?:number }
export interface ExperimentArtifactLink { resourceId:string;role:'model'|'log'|'image'|'video'|'report'|'config'|'dataset'|'output';sourceKind:'reference'|'managed'|'connected';fingerprint?:string;availability?:string }
export interface ExperimentObservation { id:string;authorNote:string;outcome?:string;linkedResourceId?:string;createdAt:string }
export interface ExperimentRun { id:string;experimentId:string;label:string;status:RunStatus;sourceKind:RunSourceKind;externalRunId?:string;startedAt?:string;endedAt?:string;measuredDurationSeconds?:number;notes?:string;version?:string;parameters:RunParameter[];metrics:RunMetric[];code:ExperimentCodeRef;dataset?:ExperimentDatasetRef;environment:ExperimentEnvironment;artifacts:ExperimentArtifactLink[];observations:ExperimentObservation[];taskIds:string[];lastSyncedAt?:string;externalVersion?:string;errorMessage?:string }
export interface ResearchExperiment { id:string;projectId:string;title:string;summary:string;type:ExperimentType;status:ExperimentStatus;source:ExperimentSource;goal:string;hypothesis?:string;protocol?:string;evaluationCriteria?:string;stageId?:string;stageLabel?:string;tags:string[];paperIds:string[];taskIds:string[];resourceIds:string[];repoUrl?:string;createdAt:string;updatedAt:string;pinned?:boolean;archivedAt?:string }
export interface ExperimentSnapshot {demoData:boolean;offline:boolean;experiments:ResearchExperiment[];runs:ExperimentRun[];externalState:'not-connected'|'cached'|'connected'}
export interface ComparisonIssue {field:string;message:string}
export interface RunComparison {experimentId:string;runIds:string[];metricName:string;comparable:boolean;issues:ComparisonIssue[];rows:Array<{run:ExperimentRun;metric?:RunMetric}>;conclusion?:string}
