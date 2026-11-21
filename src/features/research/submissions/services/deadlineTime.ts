import type { DeadlineEvent, TemporalStatus } from '../types'

export function temporalStatus(deadline:DeadlineEvent,now=new Date()):TemporalStatus{return deadline.utcInstant?(new Date(deadline.utcInstant)>now?'upcoming':'passed'):'unknown'}
export function deadlineDisplay(deadline:DeadlineEvent,timeZone='Europe/Berlin'){
 const original=deadline.datePrecision==='rolling'?'Rolling submission':deadline.datePrecision==='tba'?'TBA':deadline.originalLocalDatetime?`${deadline.originalLocalDatetime.replace('T',' ')}${deadline.originalTimezone?` · ${deadline.originalTimezone}`:''}`:'Unknown'
 if(deadline.datePrecision!=='exact'||!deadline.utcInstant)return{original,local:'No exact local conversion',precise:false,reason:deadline.datePrecision==='date-only'?'Date only · time and zone unknown':deadline.datePrecision==='zone-unknown'?'Timezone unknown':deadline.datePrecision==='time-unknown'?'Time unknown':'No fixed deadline'}
 const local=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(deadline.utcInstant))
 return{original,local,precise:true,reason:deadline.originalTimezone==='AoE'?'Official AoE interpreted as UTC−12':''}
}
