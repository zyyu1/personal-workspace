/**
 * Module 009 civil-date / zoned-time validation.
 *
 * Uses only the platform `Intl` time-zone database (no third-party dependency).
 * - `date-only` values stay plain `YYYY-MM-DD` strings; no midnight instant is invented.
 * - `exact` values are local date + `HH:mm` + IANA zone; the absolute instant is derived
 *   only after validation. Non-existent local times (DST gap) are rejected; ambiguous
 *   local times (DST fold) require an explicit `earlier` / `later` choice.
 */
import type { DatePrecision } from '../types'

export type Disambiguation='earlier'|'later'
export class ExamDateError extends Error{
  readonly reason:'invalid-date'|'invalid-time'|'invalid-timezone'|'nonexistent-time'|'ambiguous-time'|'missing-field'|'unexpected-field'
  constructor(reason:ExamDateError['reason'],message:string){super(message);this.name='ExamDateError';this.reason=reason}
}

const DATE=/^(\d{4})-(\d{2})-(\d{2})$/
const TIME=/^([01]\d|2[0-3]):([0-5]\d)$/

export function parsePlainDate(value:string){
  const match=DATE.exec(value)
  if(!match)throw new ExamDateError('invalid-date',`Date must use YYYY-MM-DD: ${value}`)
  const [year,month,day]=[Number(match[1]),Number(match[2]),Number(match[3])]
  const probe=new Date(Date.UTC(year,month-1,day))
  if(year<1900||year>2200||probe.getUTCFullYear()!==year||probe.getUTCMonth()!==month-1||probe.getUTCDate()!==day)throw new ExamDateError('invalid-date',`Not a real calendar day: ${value}`)
  return{year,month,day}
}

export function parseLocalTime(value:string){
  const match=TIME.exec(value)
  if(!match)throw new ExamDateError('invalid-time',`Time must use 24-hour HH:mm: ${value}`)
  return{hour:Number(match[1]),minute:Number(match[2])}
}

const formatterCache=new Map<string,Intl.DateTimeFormat>()
const formatter=(timeZone:string)=>{
  let value=formatterCache.get(timeZone)
  if(!value){value=new Intl.DateTimeFormat('en-US',{timeZone,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});formatterCache.set(timeZone,value)}
  return value
}

export function isValidTimeZone(value:string){
  if(!value||value!==value.trim())return false
  if(value!=='UTC'&&!/^[A-Za-z]+(?:[/_+-][A-Za-z0-9_+-]+)+$/.test(value))return false
  try{formatter(value);return true}catch{return false}
}

export function assertTimeZone(value:string|undefined):string{
  if(!value)throw new ExamDateError('missing-field','An exact time needs an IANA timezone; the timezone is not assumed')
  if(!isValidTimeZone(value))throw new ExamDateError('invalid-timezone',`Unknown IANA timezone: ${value}`)
  return value
}

/** Wall-clock fields of an instant in a zone. */
function wallClock(epochMs:number,timeZone:string){
  const parts=Object.fromEntries(formatter(timeZone).formatToParts(new Date(epochMs)).filter(part=>part.type!=='literal').map(part=>[part.type,Number(part.value)]))
  return{year:parts.year,month:parts.month,day:parts.day,hour:parts.hour,minute:parts.minute,second:parts.second}
}
const offsetMinutesAt=(epochMs:number,timeZone:string)=>{const wall=wallClock(epochMs,timeZone);return Math.round((Date.UTC(wall.year,wall.month-1,wall.day,wall.hour,wall.minute,wall.second)-Math.floor(epochMs/1000)*1000)/60000)}

/** All instants whose wall-clock time in `timeZone` equals the given local date/time (0, 1 or 2 results). */
export function candidateInstants(localDate:string,localTime:string,timeZone:string){
  const date=parsePlainDate(localDate),time=parseLocalTime(localTime),zone=assertTimeZone(timeZone)
  const wallUtc=Date.UTC(date.year,date.month-1,date.day,time.hour,time.minute)
  const offsets=new Set([-36,-12,0,12,36].map(hours=>offsetMinutesAt(wallUtc+hours*3600000,zone)))
  const matches=new Set<number>()
  for(const offset of offsets){
    const instant=wallUtc-offset*60000,wall=wallClock(instant,zone)
    if(wall.year===date.year&&wall.month===date.month&&wall.day===date.day&&wall.hour===time.hour&&wall.minute===time.minute)matches.add(instant)
  }
  return [...matches].sort((a,b)=>a-b)
}

export function zonedToInstant(localDate:string,localTime:string,timeZone:string,disambiguation?:Disambiguation){
  const candidates=candidateInstants(localDate,localTime,timeZone)
  if(!candidates.length)throw new ExamDateError('nonexistent-time',`${localDate} ${localTime} does not exist in ${timeZone} (daylight-saving gap)`)
  if(candidates.length>1&&!disambiguation)throw new ExamDateError('ambiguous-time',`${localDate} ${localTime} occurs twice in ${timeZone} (daylight-saving fold); choose earlier or later`)
  const instant=candidates.length>1&&disambiguation==='later'?candidates[candidates.length-1]:candidates[0]
  return new Date(instant).toISOString()
}

/** Inverse: instant → original zone local date/time (round-trip check). */
export function instantToZoned(instant:string,timeZone:string){
  const epoch=Date.parse(instant);if(Number.isNaN(epoch))throw new ExamDateError('invalid-date',`Invalid instant: ${instant}`)
  const wall=wallClock(epoch,assertTimeZone(timeZone)),pad=(value:number)=>String(value).padStart(2,'0')
  return{localDate:`${wall.year}-${pad(wall.month)}-${pad(wall.day)}`,localTime:`${pad(wall.hour)}:${pad(wall.minute)}`}
}

export interface ExamDateInput{datePrecision:DatePrecision;localDate?:string;localTime?:string;timezone?:string;disambiguation?:Disambiguation}
export interface NormalizedExamDate{datePrecision:DatePrecision;localDate?:string;localTime?:string;timezone?:string;instant?:string;disambiguation?:Disambiguation}

/** Validates the D2 precision contract and returns only the fields that are meaningful for it. */
export function normalizeExamDate(input:ExamDateInput):NormalizedExamDate{
  const localDate=input.localDate?.trim()||undefined,localTime=input.localTime?.trim()||undefined,timezone=input.timezone?.trim()||undefined
  if(input.datePrecision==='unknown'){
    if(localDate||localTime)throw new ExamDateError('unexpected-field','An unknown date cannot carry a date or time')
    return{datePrecision:'unknown',timezone:timezone&&isValidTimeZone(timezone)?timezone:undefined}
  }
  if(input.datePrecision==='date-only'){
    if(!localDate)throw new ExamDateError('missing-field','A date-only milestone needs a date')
    if(localTime)throw new ExamDateError('unexpected-field','A date-only milestone cannot carry a clock time')
    parsePlainDate(localDate)
    if(timezone&&!isValidTimeZone(timezone))throw new ExamDateError('invalid-timezone',`Unknown IANA timezone: ${timezone}`)
    return{datePrecision:'date-only',localDate,timezone}
  }
  if(input.datePrecision!=='exact')throw new ExamDateError('invalid-date','Unknown date precision')
  if(!localDate||!localTime)throw new ExamDateError('missing-field','An exact milestone needs a date and a clock time')
  const zone=assertTimeZone(timezone),candidates=candidateInstants(localDate,localTime,zone)
  const instant=zonedToInstant(localDate,localTime,zone,input.disambiguation)
  return{datePrecision:'exact',localDate,localTime,timezone:zone,instant,disambiguation:candidates.length>1?input.disambiguation:undefined}
}

/** Today's civil date in the viewer's zone (used only to split upcoming vs past, never stored). */
export const viewerToday=(now=new Date())=>`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

export function describeExamDate(value:{datePrecision:DatePrecision;localDate?:string;localTime?:string;timezone?:string;instant?:string}){
  if(value.datePrecision==='unknown'||!value.localDate)return{label:'Unknown date',detail:'No confirmed date yet'}
  if(value.datePrecision==='date-only')return{label:value.localDate,detail:'Date known, time unknown'}
  return{label:`${value.localDate} ${value.localTime} (${value.timezone})`,detail:value.instant?`Your time: ${new Date(value.instant).toLocaleString([],{dateStyle:'medium',timeStyle:'short'})}`:'Exact time'}
}
