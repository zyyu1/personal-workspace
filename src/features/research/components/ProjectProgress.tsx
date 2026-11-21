import { Check, Circle } from 'lucide-react'
import type { ProjectStage } from '../types'
import { SectionCard } from './SectionCard'
export function ProjectProgress({ stages, currentStage }: { stages: ProjectStage[]; currentStage: string }) {
  return <SectionCard title="Project progress" eyebrow="Configured stages">
    {stages.length ? <><div className="current-stage"><span>Current stage</span><strong>{currentStage}</strong></div><ol className="stage-list">{stages.map(stage => <li key={stage.id} className={stage.state}><span className="stage-marker">{stage.state === 'complete' ? <Check size={14}/> : <Circle size={11}/>}</span><div><strong>{stage.label}</strong><small>{stage.milestone}</small></div></li>)}</ol><p className="helper">Progress follows configured research stages, not task completion counts.</p></> : <div className="empty-state compact"><h3>No research stages configured</h3><p>Add project-specific stages to track meaningful progress.</p></div>}
  </SectionCard>
}
