import type { TimeEntry } from '../features/research/types'

export const timeEntrySeconds=(entry:Pick<TimeEntry,'durationSeconds'|'minutes'>)=>entry.durationSeconds??entry.minutes*60

export function formatDurationSeconds(value:number,{includeSeconds=false,signed=false}:{includeSeconds?:boolean;signed?:boolean}={}){
  const negative=value<0,seconds=Math.max(0,Math.round(Math.abs(value))),prefix=negative&&signed?'-':''
  if(seconds===0)return '0 min'
  if(seconds<60)return includeSeconds?`${prefix}${seconds} sec`:`${prefix}<1 min`
  const hours=Math.floor(seconds/3600),minutes=Math.floor((seconds%3600)/60),remainder=seconds%60
  const parts:string[]=[]
  if(hours)parts.push(`${hours}h`)
  if(minutes||!hours)parts.push(`${minutes} min`)
  if(includeSeconds&&remainder)parts.push(`${remainder} sec`)
  return `${prefix}${parts.join(' ')}`
}

export const formatTimeEntry=(entry:Pick<TimeEntry,'durationSeconds'|'minutes'>,detail=false)=>formatDurationSeconds(timeEntrySeconds(entry),{includeSeconds:detail})
