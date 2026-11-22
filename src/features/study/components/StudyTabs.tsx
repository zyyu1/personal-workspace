import { NavLink } from 'react-router-dom'

const tabs=[['overview','Overview',true],['materials','Materials',true],['progress','Progress',true],['exercises','Exercises',true],['exams','Exams',true],['labs','Labs',false],['notes','Notes',false]] as const
export function StudyTabs({offeringId}:{offeringId:string}){return <nav className="research-tabs study-tabs" aria-label="Course sections">{tabs.map(([path,label,enabled])=>enabled?<NavLink key={path} to={`/study/courses/${offeringId}/${path}`}>{label}</NavLink>:<span key={path} className="future-tab" aria-disabled="true" title="Planned for a later module">{label}<small>Future</small></span>)}</nav>}
