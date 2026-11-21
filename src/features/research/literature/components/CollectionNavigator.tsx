import { ChevronLeft, ChevronRight, Folder, Library, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { ZoteroCollection } from '../types'

export function CollectionNavigator({ collections, selectedId, collapsed, onSelect, onToggle }: { collections: ZoteroCollection[]; selectedId:string; collapsed:boolean; onSelect:(id:string)=>void; onToggle:()=>void }) {
  return <aside className={`collection-nav ${collapsed ? 'collapsed' : ''}`} aria-label="Zotero collections">
    <header><div><span className="eyebrow">Zotero collections</span>{!collapsed && <strong>Demo library</strong>}</div><button className="icon-button" onClick={onToggle} aria-label={collapsed ? 'Expand collections' : 'Collapse collections'}>{collapsed ? <PanelLeftOpen/> : <PanelLeftClose/>}</button></header>
    {!collapsed && <nav>{collections.map(c => <button key={c.id} className={selectedId===c.id?'collection-item active':'collection-item'} onClick={()=>onSelect(c.id)}><span className="collection-icon">{c.id==='all'?<Library size={16}/>:<Folder size={16}/>}</span><span>{c.name}</span><small>{c.itemCount}</small></button>)}</nav>}
    {collapsed && <div className="collection-collapsed-label"><Folder size={17}/><span>Collections</span></div>}
  </aside>
}

export function CollectionPicker({collections,selectedId,onSelect}:{collections:ZoteroCollection[];selectedId:string;onSelect:(id:string)=>void}) {
  return <label className="field collection-picker"><span>Collection</span><select value={selectedId} onChange={e=>onSelect(e.target.value)}>{collections.map(c=><option key={c.id} value={c.id}>{c.name} ({c.itemCount})</option>)}</select></label>
}
