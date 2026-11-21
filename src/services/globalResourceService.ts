export type ResourceAvailability='available'|'windows-only'|'unavailable'|'external'
export type ResourceSourceKind='reference'|'managed'|'connected'
export interface WorkspaceResource { id:string;name:string;type:string;sourceKind:ResourceSourceKind;locator:string;availability:ResourceAvailability;size?:string;hash?:string;version?:string;url?:string }

const seed:WorkspaceResource[]=[
  {id:'resource-eval-config',name:'evaluation-config.yaml',type:'config',sourceKind:'reference',locator:'C:\\Research\\adaptive-agents\\config\\evaluation.yaml',availability:'windows-only',size:'4 KB',hash:'sha256:73b…91c'},
  {id:'resource-run-report',name:'baseline-results.csv',type:'report',sourceKind:'managed',locator:'workspace://adaptive-agents/baseline-results.csv',availability:'available',size:'18 KB',version:'v1'},
  {id:'resource-run-log',name:'pilot-run.log',type:'log',sourceKind:'reference',locator:'C:\\Research\\adaptive-agents\\runs\\pilot.log',availability:'windows-only',size:'2.4 MB'},
  {id:'resource-external-metrics',name:'MLflow metrics snapshot',type:'metrics',sourceKind:'connected',locator:'mlflow://demo/run-219',availability:'external',version:'cached 2026-11-20'},
]
export const GlobalResourceService={
  async list(ids?:string[]){const rows=ids?seed.filter(item=>ids.includes(item.id)):seed;return structuredClone(rows)},
  async get(id:string){const item=seed.find(value=>value.id===id);return item?structuredClone(item):undefined},
  async unlink(_entityId:string,_resourceId:string){return {sourcePreserved:true}},
}
