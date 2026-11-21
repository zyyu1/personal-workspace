import { useEffect, useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlobalResourceService, type WorkspaceResource } from '../../../../services/globalResourceService'
import { SectionCard } from '../../components/SectionCard'

export function QuickResources({projectId}:{projectId:string}){const [rows,setRows]=useState<WorkspaceResource[]>([]);useEffect(()=>{GlobalResourceService.list({projectId,sort:'recent'}).then(items=>setRows(items.slice(0,4)))},[projectId]);return <SectionCard className="quick-resources" eyebrow="Canonical resource links" title="Quick resources" action={<Link to={`/research/projects/${projectId}/files`}>View all</Link>}>{rows.length?<div className="quick-resource-list">{rows.map(item=><Link key={item.id} to={`/research/projects/${projectId}/files?resourceId=${encodeURIComponent(item.id)}`}><FileText/><span><strong>{item.title}</strong><small>{item.sourceKind} · {item.byteAvailability} · metadata {item.metadataSync}</small></span><ExternalLink/></Link>)}</div>:<div className="empty-state compact"><h3>No linked resources</h3><p>Add an explicit reference from Files.</p></div>}</SectionCard>}
