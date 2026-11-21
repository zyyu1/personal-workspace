import type { ResearchProject } from '../types'
import type { InspectorItem } from '../../../components/Inspector'
import { ContinueResearch } from '../components/ContinueResearch'
import { NextActions } from '../components/NextActions'
import { ProjectProgress } from '../components/ProjectProgress'
import { RecentLiterature } from '../components/RecentLiterature'
import { ResearchRoadmap } from '../components/ResearchRoadmap'
import { TimeInvestment } from '../components/TimeInvestment'
import { UpcomingMilestones } from '../components/UpcomingMilestones'
import { RecentExperiment } from '../experiments/components/RecentExperiment'
import { QuickResources } from '../resources/components/QuickResources'

export function ResearchOverview({ project, onInspect, onResume }: { project: ResearchProject; onInspect: (item: InspectorItem) => void; onResume: () => void }) {
  return <div className="overview-grid">
    <ContinueResearch context={project.continueContext} onInspect={onInspect} onResume={onResume}/>
    <ProjectProgress stages={project.stages} currentStage={project.currentStage}/>
    <NextActions tasks={project.tasks} onOpen={(data) => onInspect({kind:'task',data})}/>
    <RecentLiterature items={project.literature} onOpen={(data) => onInspect({kind:'paper',data})}/>
    <RecentExperiment projectId={project.id}/>
    <QuickResources projectId={project.id}/>
    <TimeInvestment entries={project.timeEntries}/>
    <ResearchRoadmap stages={project.stages}/>
    <UpcomingMilestones milestones={project.milestones}/>
  </div>
}
