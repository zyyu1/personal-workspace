import { Check } from 'lucide-react'
import type { ProjectStage } from '../types'
import { SectionCard } from './SectionCard'
export function ResearchRoadmap({ stages }: { stages: ProjectStage[] }) {
  return <SectionCard title="Research roadmap" eyebrow="Project-specific workflow" action={<button className="text-button">Open timeline</button>}>
    {stages.length ? <div className="roadmap">{stages.map((stage,index) => <div className={`roadmap-step ${stage.state}`} key={stage.id}><span className="roadmap-index">{stage.state === 'complete' ? <Check size={14}/> : index+1}</span><div><strong>{stage.label}</strong><small>{stage.milestone}</small></div></div>)}</div> : <div className="empty-state compact"><h3>Roadmap not configured</h3><p>Choose stages that match this project instead of a fixed research template.</p></div>}
  </SectionCard>
}
