import { BookOpen, PlugZap } from 'lucide-react'
import type { LiteratureItem } from '../types'
import { SectionCard } from './SectionCard'
export function RecentLiterature({ items, onOpen }: { items: LiteratureItem[]; onOpen: (paper: LiteratureItem) => void }) {
  return <SectionCard title="Recent literature" eyebrow="Workspace reading state" action={<span className="integration-badge"><PlugZap size={14}/> Zotero disconnected</span>}>
    {items.length ? <div className="paper-list">{items.slice(0,4).map(item => <button className="paper-row" key={item.id} onClick={() => onOpen(item)}><span className="paper-icon"><BookOpen size={17}/></span><span className="paper-main"><strong>{item.title}</strong><small>{item.authors} · {item.year}</small></span><span className={`reading-status ${item.readingStatus}`}>{item.readingStatus}</span></button>)}</div> : <div className="empty-state compact"><h3>No literature linked</h3><p>Connect Zotero or add a literature reference to see recent reading here.</p></div>}
  </SectionCard>
}
