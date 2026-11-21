import type { ManifestEntry, MaterialClassification } from '../types'

export const MATERIAL_LIMITS={archiveBytes:250*1024*1024,entryCount:5000,totalBytes:2*1024*1024*1024,singleFileBytes:250*1024*1024,compressionRatio:200,maxDepth:30} as const

export function classifyMaterial(path:string):{classification:MaterialClassification;confidence:'low'|'medium'|'high'}{
  const value=path.normalize('NFKC').toLowerCase()
  const tests:Array<[MaterialClassification,RegExp]>=[
    ['past-papers',/(altklausur|probeklausur|past[ _-]?paper|old[ _-]?exam)/],
    ['exercises',/(uebung|übung|aufgabe|exercise|sheet)/],
    ['tutorials',/(tutor|kgü|kgu|loesung|lösung|solution)/],
    ['lectures',/(vorlesung|lecture|skript|chapter)/],
    ['labs',/(praktikum|versuch|lab|testat)/],
    ['notes',/(note|notiz|\.md$)/],
    ['administrative',/(orga|organisation|schedule|syllabus|announcement)/],
  ]
  const found=tests.find(([,pattern])=>pattern.test(value))
  return found?{classification:found[0],confidence:'medium'}:{classification:'other',confidence:'low'}
}

export function validateRelativePath(raw:string):{safe:true;path:string}|{safe:false;reason:string}{
  if(!raw||raw.includes('\0')||raw.includes('\\'))return{safe:false,reason:'Unsafe or unsupported path separator'}
  const normalized=raw.normalize('NFKC').replace(/\/{2,}/g,'/')
  if(normalized.startsWith('/')||normalized.startsWith('//')||/^[a-zA-Z]:/.test(normalized))return{safe:false,reason:'Absolute paths are not allowed'}
  const parts=normalized.split('/').filter((part,index,array)=>!(part===''&&index===array.length-1))
  if(!parts.length||parts.some(part=>part===''||part==='.'||part==='..'))return{safe:false,reason:'Path traversal or empty segment detected'}
  if(parts.length>MATERIAL_LIMITS.maxDepth)return{safe:false,reason:'Path depth exceeds the safety limit'}
  return{safe:true,path:parts.join('/')}
}

export function manifestEntry(path:string,values:Omit<ManifestEntry,'relativePath'|'classification'|'classificationConfidence'|'safe'>):ManifestEntry{
  const checked=validateRelativePath(path),suggestion=classifyMaterial(path)
  return checked.safe?{...values,relativePath:checked.path,classification:suggestion.classification,classificationConfidence:suggestion.confidence,safe:true}:{...values,relativePath:path,classification:'other',classificationConfidence:'low',safe:false,reason:checked.reason}
}
