import { useEffect, useState } from 'react'
import { Beaker, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ExperimentRepository } from '../services/experimentRepository'
import type { ResearchExperiment } from '../types'

export function RecentExperiment({projectId}:{projectId:string}){const [experiment,setExperiment]=useState<ResearchExperiment>();useEffect(()=>{ExperimentRepository.snapshot(projectId).then(snapshot=>setExperiment([...snapshot.experiments].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]))},[projectId]);return <section className="card recent-experiment-card"><div className="card-title"><div><span className="eyebrow">Recent experiment · Demo</span><h2>Experiment activity</h2></div><Beaker/></div>{experiment?<Link to={`/research/projects/${projectId}/experiments/${experiment.id}`} className="experiment-link-row"><span><strong>{experiment.title}</strong><small>{experiment.status} · {experiment.stageLabel??'Stage not recorded'} · updated {new Date(experiment.updatedAt).toLocaleDateString()}</small></span><ExternalLink/></Link>:<div className="empty-state compact"><h3>No experiments</h3><p>Create an experiment from the Experiments tab.</p></div>}</section>}
