import type { Priority, ResearchTask } from '../../types'
import { DisconnectedZoteroConnector } from './zoteroConnector'
import { paperStableId, type LiteraturePaper, type LiteratureSnapshot, type ReadingStatus } from '../types'
import { GlobalTaskService } from '../../../../services/globalTaskService'
import { GlobalResourceService } from '../../../../services/globalResourceService'
import { createVersionedRepository, notFoundFailure, unwrapMutation } from '../../../../data/persistence'

const sharedPaper = (overrides: Partial<LiteraturePaper> & Pick<LiteraturePaper, 'itemKey' | 'title'>): LiteraturePaper => ({
  stableId: paperStableId('demo-library', overrides.itemKey), libraryId: 'demo-library', authors: [],
  collectionIds: [], projectStates: {}, pdfAvailability: 'missing', resources: [], relatedTasks: [],
  relatedProjects: [], source: 'zotero', syncState: 'disconnected', ...overrides,
})

const initialPapers: LiteraturePaper[] = [
  sharedPaper({ itemKey:'ALOHA1', title:'Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware', authors:['Tony Z. Zhao','Vikash Kumar','Sergey Levine','Chelsea Finn'], year:2023, publication:'Robotics: Science and Systems', doi:'10.15607/RSS.2023.XIX.016', url:'https://tonyzhaozh.github.io/aloha/', collectionIds:['robotics','active-reading'], pdfAvailability:'windows-only', updatedAt:'2026-11-20T18:40:00Z', abstract:'A demonstration-driven approach to fine-grained bimanual manipulation with an accessible hardware platform.', projectStates:{'adaptive-agents':{projectId:'adaptive-agents',readingStatus:'reading',priority:'high',note:'Compare the data collection loop with our agent evaluation protocol.',tags:['embodied agents','methods'],lastReadAt:'2026-11-20T17:10:00Z'},'robotics-review':{projectId:'robotics-review',readingStatus:'to-read',priority:'medium',tags:['robotics']}}, resources:[{id:'r-aloha-pdf',kind:'pdf',label:'ALOHA.pdf',availability:'windows-only',device:'Research-PC'},{id:'r-aloha-note',kind:'markdown',label:'aloha-reading-notes.md',availability:'available'}], relatedTasks:[{id:'paper-task-1',title:'Extract ALOHA evaluation metrics',status:'todo',stage:'Literature review',priority:'high'}], relatedProjects:[{id:'adaptive-agents',name:'Adaptive Research Agents'},{id:'robotics-review',name:'Affordable Robotics Review'}] }),
  sharedPaper({ itemKey:'REFLEX2', title:'Reflexion: Language Agents with Verbal Reinforcement Learning', authors:['Noah Shinn','Federico Cassano','Edward Berman','Ashwin Gopinath'], year:2023, publication:'NeurIPS', arxiv:'2303.11366', url:'https://arxiv.org/abs/2303.11366', collectionIds:['agents','active-reading'], pdfAvailability:'missing', updatedAt:'2026-11-19T09:20:00Z', projectStates:{'adaptive-agents':{projectId:'adaptive-agents',readingStatus:'read',priority:'high',note:'Use the verbal feedback taxonomy in the related-work matrix.',tags:['reflection','agents'],lastReadAt:'2026-11-19T08:15:00Z'}}, relatedProjects:[{id:'adaptive-agents',name:'Adaptive Research Agents'}] }),
  sharedPaper({ itemKey:'GENAG3', title:'Generative Agents: Interactive Simulacra of Human Behavior', authors:['Joon Sung Park','Joseph O’Brien','Carrie Jun Cai','Meredith Ringel Morris'], year:2023, publication:'UIST', doi:'10.1145/3586183.3606763', collectionIds:['agents'], pdfAvailability:'windows-only', updatedAt:'2026-11-17T14:05:00Z', projectStates:{'adaptive-agents':{projectId:'adaptive-agents',readingStatus:'reading',priority:'medium',tags:['memory','simulation']}}, resources:[{id:'r-gen-pdf',kind:'pdf',label:'generative-agents.pdf',availability:'windows-only',device:'Research-PC'}], relatedProjects:[{id:'adaptive-agents',name:'Adaptive Research Agents'}] }),
  sharedPaper({ itemKey:'SURVEY4', title:'A Survey on Large Language Model based Autonomous Agents', authors:['Lei Wang','Chen Ma','Xueyang Feng'], year:2024, publication:'Frontiers of Computer Science', arxiv:'2308.11432', collectionIds:['agents','surveys'], pdfAvailability:'available', updatedAt:'2026-11-12T11:30:00Z', projectStates:{'adaptive-agents':{projectId:'adaptive-agents',readingStatus:'to-read',priority:'medium',tags:['survey']}}, resources:[{id:'r-survey-url',kind:'url',label:'Publisher page',availability:'available',url:'https://arxiv.org/abs/2308.11432'}], relatedProjects:[{id:'adaptive-agents',name:'Adaptive Research Agents'}] }),
  sharedPaper({ itemKey:'MISSING5', title:'Untitled conference record', authors:[], collectionIds:['inbox'], pdfAvailability:'missing', projectStates:{}, updatedAt:'2026-10-03T10:00:00Z', relatedProjects:[] }),
]

const snapshot: LiteratureSnapshot = {
  demoData: true,
  library: { id:'demo-library', name:'Demo Zotero Library', type:'user', syncState:'disconnected', lastSyncedAt:'2026-11-20T18:45:00Z' },
  collections: [
    {id:'all',libraryId:'demo-library',name:'All papers',itemCount:5},
    {id:'active-reading',libraryId:'demo-library',name:'Active reading',itemCount:2},
    {id:'agents',libraryId:'demo-library',name:'Agent systems',itemCount:3},
    {id:'robotics',libraryId:'demo-library',name:'Robotics',itemCount:1},
    {id:'surveys',libraryId:'demo-library',name:'Surveys',itemCount:1},
    {id:'inbox',libraryId:'demo-library',name:'Inbox',itemCount:1},
    {id:'empty',libraryId:'demo-library',name:'Empty collection',itemCount:0},
  ],
  papers: initialPapers,
}

const connector = new DisconnectedZoteroConnector(snapshot)
const copy=<T>(value:T):T=>structuredClone(value)
const repository=createVersionedRepository<LiteraturePaper[]>({domain:'literature',schemaVersion:1,seedVersion:1,seed:()=>copy(initialPapers)})
const canonicalAvailability=(value:string)=>['available-here','available-managed','available-provider'].includes(value)?'available':value==='another-device'?'windows-only':'missing'

export const LiteratureService = {
  async getSnapshot(): Promise<LiteratureSnapshot> {
    await new Promise(resolve => setTimeout(resolve, 120))
    const papers=await repository.getState(),resourceIds=[...new Set(papers.flatMap(paper=>paper.resources.map(resource=>resource.id)))],canonical=new Map((await GlobalResourceService.list(resourceIds)).map(resource=>[resource.id,resource]))
    const seen = new Map<string,LiteraturePaper>()
    for (const paper of papers)seen.set(paper.stableId,{...paper,resources:paper.resources.map(resource=>{const item=canonical.get(resource.id);return item?{...resource,availability:canonicalAvailability(item.byteAvailability) as typeof resource.availability}:resource}),pdfAvailability:(()=>{const pdf=paper.resources.find(resource=>resource.kind==='pdf'),item=pdf&&canonical.get(pdf.id);return item?canonicalAvailability(item.byteAvailability) as LiteraturePaper['pdfAvailability']:paper.pdfAvailability})()})
    return { ...(await connector.getSnapshot()), papers: [...seen.values()] }
  },
  async updateProjectState(stableId:string, projectId:string, values:{readingStatus?:Exclude<ReadingStatus,'not-tracked'>;priority?:Priority;note?:string}) {
    const result=await repository.mutate(papers=>{if(!papers.some(p=>p.stableId===stableId))throw notFoundFailure('Paper not found');const state=papers.map(p => p.stableId === stableId ? {...p, projectStates:{...p.projectStates,[projectId]:{...(p.projectStates[projectId]??{readingStatus:'to-read',tags:[]}),projectId,...values}}} : p);return{state,value:state.find(p=>p.stableId===stableId)!}});return unwrapMutation(result)
  },
  async createReadingTask(stableId:string, projectId:string): Promise<ResearchTask> {
    const papers=await repository.getState()
    const paper = papers.find(p => p.stableId === stableId)
    if (!paper) throw notFoundFailure('Paper not found')
    const task=await GlobalTaskService.createReadingTask(projectId,stableId,paper.title)
    if(!paper.relatedTasks.some(item=>item.id===task.id))unwrapMutation(await repository.mutate(current=>({state:current.map(p=>p.stableId===stableId?{...p,relatedTasks:[...p.relatedTasks,task]}:p),value:task})))
    await this.updateProjectState(stableId,projectId,{readingStatus:'to-read'})
    return task
  },
  async unlinkProject(stableId:string, projectId:string) {
    const result=await repository.mutate(papers=>{const state=papers.map(p => { if(p.stableId!==stableId)return p; const states={...p.projectStates}; delete states[projectId]; return {...p,projectStates:states,relatedProjects:p.relatedProjects.filter(project=>project.id!==projectId)} });const value=state.find(p=>p.stableId===stableId);if(!value)throw notFoundFailure('Paper not found');return{state,value}});return unwrapMutation(result)
  },
  async reset() { await repository.reset(); await GlobalTaskService.reset() },
  invalidate(){repository.invalidate()},
}
