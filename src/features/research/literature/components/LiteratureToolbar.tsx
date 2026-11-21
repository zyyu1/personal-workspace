import { Filter, Search, X } from 'lucide-react'
import type { LiteratureFilters, ReadingStatus } from '../types'

const statuses: Array<{value:ReadingStatus|'all';label:string}> = [
  {value:'all',label:'All reading states'},{value:'to-read',label:'To Read'},{value:'reading',label:'Reading'},
  {value:'read',label:'Read'},{value:'on-hold',label:'On Hold'},{value:'not-tracked',label:'Not tracked'},
]

export function LiteratureToolbar({filters,onChange,onClear,availableYears,tags}:{filters:LiteratureFilters;onChange:(value:LiteratureFilters)=>void;onClear:()=>void;availableYears:number[];tags:string[]}) {
  const active = [filters.readingStatus!=='all',filters.year!=='all',filters.priority!=='all',filters.pdfAvailability!=='all',filters.tag!=='all'].filter(Boolean).length
  return <div className="literature-toolbar">
    <label className="literature-search"><Search size={17}/><input aria-label="Search papers" placeholder="Search title, author, DOI…" value={filters.query} onChange={e=>onChange({...filters,query:e.target.value})}/>{filters.query&&<button aria-label="Clear search" onClick={()=>onChange({...filters,query:''})}><X size={15}/></button>}</label>
    <label className="compact-select"><span className="sr-only">Reading status</span><select aria-label="Reading status" value={filters.readingStatus} onChange={e=>onChange({...filters,readingStatus:e.target.value as LiteratureFilters['readingStatus']})}>{statuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
    <label className="compact-select"><span className="sr-only">Publication year</span><select aria-label="Publication year" value={filters.year} onChange={e=>onChange({...filters,year:e.target.value})}><option value="all">All years</option>{availableYears.map(y=><option key={y}>{y}</option>)}</select></label>
    <details className="more-filters"><summary><Filter size={16}/> More filters{active>2&&<b>{active-2}</b>}</summary><div className="filter-popover">
      <label className="field"><span>Priority</span><select value={filters.priority} onChange={e=>onChange({...filters,priority:e.target.value as LiteratureFilters['priority']})}><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
      <label className="field"><span>PDF availability</span><select value={filters.pdfAvailability} onChange={e=>onChange({...filters,pdfAvailability:e.target.value as LiteratureFilters['pdfAvailability']})}><option value="all">Any availability</option><option value="available">Available here</option><option value="windows-only">Windows only</option><option value="missing">Missing</option></select></label>
      <label className="field"><span>Project tag</span><select value={filters.tag} onChange={e=>onChange({...filters,tag:e.target.value})}><option value="all">All tags</option>{tags.map(tag=><option key={tag}>{tag}</option>)}</select></label>
    </div></details>
    {(filters.query||active>0)&&<button className="text-button clear-filters" onClick={onClear}>Clear</button>}
  </div>
}
