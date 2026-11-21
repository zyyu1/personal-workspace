import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { ArrowUpDown, FileCheck2, FileQuestion, MonitorDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { LiteraturePaper, ReadingStatus } from '../types'

const statusLabel:Record<ReadingStatus,string> = {'to-read':'To Read',reading:'Reading',read:'Read','on-hold':'On Hold','not-tracked':'Not tracked'}
const PdfBadge = ({value}:{value:LiteraturePaper['pdfAvailability']}) => <span className={`pdf-badge ${value}`}>{value==='available'?<FileCheck2/>:value==='windows-only'?<MonitorDown/>:<FileQuestion/>}{value==='available'?'Available':value==='windows-only'?'Windows only':'Missing'}</span>

export function PaperTable({papers,projectId,selectedId,onSelect}:{papers:LiteraturePaper[];projectId?:string;selectedId?:string;onSelect:(paper:LiteraturePaper)=>void}) {
  const [sorting,setSorting]=useState<SortingState>([{id:'updatedAt',desc:true}])
  const columns=useMemo<ColumnDef<LiteraturePaper>[]>(()=>[
    {accessorKey:'title',header:'Paper title',cell:info=><div className="paper-title-cell"><strong>{info.row.original.title||'Untitled record'}</strong><small>{info.row.original.authors.length?info.row.original.authors.join(', '):'Authors unavailable'}</small></div>},
    {accessorKey:'year',header:'Year',cell:info=>info.getValue() as number||'—'},
    {id:'readingStatus',header:'Reading status',accessorFn:paper=>projectId?(paper.projectStates[projectId]?.readingStatus??'not-tracked'):'not-tracked',cell:info=><span className={`reading-status ${info.getValue()}`}>{statusLabel[info.getValue() as ReadingStatus]}</span>},
    {id:'tags',header:'Project tags',enableSorting:false,cell:info=><div className="table-tags">{projectId&&info.row.original.projectStates[projectId]?.tags.length?info.row.original.projectStates[projectId].tags.slice(0,2).map(tag=><span key={tag}>{tag}</span>):<span className="muted">—</span>}</div>},
    {accessorKey:'pdfAvailability',header:'PDF',enableSorting:false,cell:info=><PdfBadge value={info.getValue() as LiteraturePaper['pdfAvailability']}/>},
    {accessorKey:'updatedAt',header:'Last updated',cell:info=>info.getValue()?new Date(info.getValue() as string).toLocaleDateString('en',{month:'short',day:'numeric'}):'—'},
  ],[projectId])
  const table=useReactTable({data:papers,columns,state:{sorting},onSortingChange:setSorting,getCoreRowModel:getCoreRowModel(),getSortedRowModel:getSortedRowModel()})
  return <div className="paper-table-wrap"><table className="paper-table"><thead>{table.getHeaderGroups().map(group=><tr key={group.id}>{group.headers.map(header=><th key={header.id}><button disabled={!header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header,header.getContext())}{header.column.getCanSort()&&<ArrowUpDown size={13}/>}</button></th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row=><tr key={row.original.stableId} className={selectedId===row.original.stableId?'selected':''} onClick={()=>onSelect(row.original)} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')onSelect(row.original)}}>{row.getVisibleCells().map(cell=><td key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</td>)}</tr>)}</tbody></table></div>
}

export function PaperCards({papers,projectId,selectedId,onSelect}:{papers:LiteraturePaper[];projectId?:string;selectedId?:string;onSelect:(paper:LiteraturePaper)=>void}) {
  return <div className="paper-cards">{papers.map(paper=>{const state=projectId?paper.projectStates[projectId]:undefined;return <button key={paper.stableId} className={selectedId===paper.stableId?'paper-card selected':'paper-card'} onClick={()=>onSelect(paper)}><div className="paper-card-head"><span className={`reading-status ${state?.readingStatus??'not-tracked'}`}>{statusLabel[state?.readingStatus??'not-tracked']}</span><PdfBadge value={paper.pdfAvailability}/></div><strong>{paper.title||'Untitled record'}</strong><p>{paper.authors.length?paper.authors.join(', '):'Authors unavailable'}</p><small>{paper.year??'Year unknown'}{paper.publication?` · ${paper.publication}`:''}</small></button>})}</div>
}
