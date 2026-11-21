import type { ComparisonIssue, ExperimentRun, RunComparison } from '../types'

export const RunComparisonService={
  compare(experimentId:string,allRuns:ExperimentRun[],runIds:string[],metricName:string,conclusion?:string):RunComparison{
    const issues:ComparisonIssue[]=[]
    if(runIds.length<2||runIds.length>4)issues.push({field:'selection',message:'Select between 2 and 4 runs.'})
    const unique=[...new Set(runIds)],rows=unique.map(id=>({run:allRuns.find(run=>run.id===id),metric:allRuns.find(run=>run.id===id)?.metrics.find(metric=>metric.name===metricName)})).filter((row):row is {run:ExperimentRun;metric:ExperimentRun['metrics'][number]|undefined}=>Boolean(row.run))
    if(rows.some(row=>row.run.experimentId!==experimentId))issues.push({field:'ownership',message:'All runs must belong to this experiment.'})
    if(rows.length!==unique.length)issues.push({field:'selection',message:'One or more run IDs are invalid.'})
    if(rows.some(row=>row.metric?.numericValue===undefined))issues.push({field:'metric',message:'One or more runs have no recorded numeric value for this metric.'})
    const values=(field:(row:typeof rows[number])=>string|undefined)=>new Set(rows.map(field).filter(Boolean))
    if(values(row=>row.metric?.unit).size>1)issues.push({field:'unit',message:'Metric units differ.'})
    if(values(row=>row.metric?.split??row.run.dataset?.split).size>1)issues.push({field:'split',message:'Evaluation splits differ.'})
    if(values(row=>row.metric?.protocolId).size>1)issues.push({field:'protocol',message:'Evaluation protocols differ.'})
    if(values(row=>row.run.dataset?.version).size>1)issues.push({field:'dataset',message:'Dataset versions differ.'})
    const samples=[...new Set(rows.map(row=>row.metric?.sampleSize).filter(value=>value!==undefined))];if(samples.length>1)issues.push({field:'sample-size',message:'Recorded sample sizes differ; inspect results without assuming equal evidence.'})
    return{experimentId,runIds:unique,metricName,comparable:issues.length===0,issues,rows,conclusion}
  },
}
