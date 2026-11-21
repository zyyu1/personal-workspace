import type { Priority, ResearchTask, TaskStatus, TaskType } from '../features/research/types'

const seedTasks:ResearchTask[]=[
  {id:'t1',projectId:'adaptive-agents',title:'Refine the evaluation protocol',status:'in-progress',stage:'Method design',dueDate:'2026-11-24',priority:'high',taskType:'analysis',paperIds:['demo-library:REFLEX2'],dailyAssignments:[{id:'day-t1',taskId:'t1',projectId:'adaptive-agents',date:'2026-11-22'}],plannedSessions:[{id:'session-t1-a',taskId:'t1',projectId:'adaptive-agents',start:'2026-11-22T09:30',end:'2026-11-22T10:30'},{id:'session-t1-b',taskId:'t1',projectId:'adaptive-agents',start:'2026-11-24T14:00',end:'2026-11-24T14:45'}],resourceLinks:[{id:'r1',label:'evaluation-metrics.md',kind:'note',available:true}]},
  {id:'t2',projectId:'adaptive-agents',title:'Compare memory baselines',status:'todo',stage:'Method design',dueDate:'2026-11-27',priority:'medium',taskType:'analysis',paperIds:['demo-library:REFLEX2'],dailyAssignments:[],plannedSessions:[{id:'session-t2',taskId:'t2',projectId:'adaptive-agents',start:'2026-11-23T13:00',end:'2026-11-23T14:30'}]},
  {id:'t3',projectId:'adaptive-agents',title:'Annotate failure-mode examples',status:'todo',stage:'Literature review',priority:'medium',taskType:'reading',paperIds:['demo-library:ALOHA1'],dailyAssignments:[],plannedSessions:[]},
  {id:'t4',projectId:'adaptive-agents',title:'Prepare pilot experiment config',status:'blocked',stage:'Experiments',priority:'low',taskType:'experiment',dailyAssignments:[{id:'day-t4',taskId:'t4',projectId:'adaptive-agents',date:'2026-11-25'}],plannedSessions:[],dependencies:[{id:'dep-t4',taskId:'t4',dependsOnTaskId:'t1'}]},
  {id:'paper-task-1',projectId:'adaptive-agents',title:'Extract ALOHA evaluation metrics',status:'todo',stage:'Literature review',priority:'high',taskType:'reading',paperIds:['demo-library:ALOHA1'],dailyAssignments:[],plannedSessions:[]},
]

let tasks:ResearchTask[]=structuredClone(seedTasks)
const copy=<T>(value:T):T=>structuredClone(value)

export const GlobalTaskService={
  async list(projectId?:string){return copy(projectId?tasks.filter(task=>task.projectId===projectId):tasks)},
  async get(id:string){const task=tasks.find(item=>item.id===id);return task?copy(task):undefined},
  async create(values:{projectId:string;title:string;stage:string;taskType:TaskType;priority?:Priority;dueDate?:string;paperIds?:string[]}){
    const task:ResearchTask={id:`task-${Date.now()}-${tasks.length}`,status:'todo',dailyAssignments:[],plannedSessions:[],...values}
    tasks=[...tasks,task];return copy(task)
  },
  async update(id:string,values:Partial<Pick<ResearchTask,'title'|'status'|'stage'|'taskType'|'priority'|'dueDate'|'paperIds'>>){
    tasks=tasks.map(task=>task.id===id?{...task,...values}:task);return copy(tasks.find(task=>task.id===id)!)
  },
  async planDay(id:string,date:string){
    const task=tasks.find(item=>item.id===id)!;const assignment={id:`day-${id}-${date}`,taskId:id,projectId:task.projectId!,date}
    task.dailyAssignments=[...(task.dailyAssignments??[]).filter(item=>item.date!==date),assignment];return copy(task)
  },
  async addSession(id:string,start:string,end:string){
    const task=tasks.find(item=>item.id===id)!;task.plannedSessions=[...(task.plannedSessions??[]),{id:`session-${id}-${Date.now()}`,taskId:id,projectId:task.projectId!,start,end}];return copy(task)
  },
  async rescheduleSession(id:string,sessionId:string,start:string,end:string){
    const task=tasks.find(item=>item.id===id)!;task.plannedSessions=(task.plannedSessions??[]).map(session=>session.id===sessionId?{...session,start,end}:session);return copy(task)
  },
  async createReadingTask(projectId:string,paperId:string,paperTitle:string){
    const existing=tasks.find(task=>task.projectId===projectId&&task.taskType==='reading'&&task.paperIds?.includes(paperId))
    if(existing)return copy(existing)
    return this.create({projectId,title:`Read: ${paperTitle}`,stage:'Literature review',taskType:'reading',priority:'medium',paperIds:[paperId]})
  },
  reset(){tasks=structuredClone(seedTasks)},
  statuses:['todo','in-progress','blocked','done'] as TaskStatus[],
}
