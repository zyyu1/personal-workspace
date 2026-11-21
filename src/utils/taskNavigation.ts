import type { ResearchTask } from '../features/research/types'

export const taskProjectRoute=(task:ResearchTask)=>task.area==='study'
  ? `/study/courses/${encodeURIComponent(task.projectId??'')}/overview`
  : `/research/projects/${encodeURIComponent(task.projectId??'')}/tasks?task=${encodeURIComponent(task.id)}`

export const taskResourceRoute=(task:ResearchTask,resourceId:string)=>task.area==='study'
  ? `/study/courses/${encodeURIComponent(task.projectId??'')}/materials?resource=${encodeURIComponent(resourceId)}`
  : `/research/projects/${encodeURIComponent(task.projectId??'')}/files?resourceId=${encodeURIComponent(resourceId)}`
