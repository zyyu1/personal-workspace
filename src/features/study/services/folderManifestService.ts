import type { ManifestPreview } from '../types'
import { MATERIAL_LIMITS, manifestEntry } from './materialManifest'

export interface BrowserFileHandle{kind:'file';name:string;getFile():Promise<File>}
export interface BrowserDirectoryHandle{kind:'directory';name:string;values():AsyncIterable<BrowserFileHandle|BrowserDirectoryHandle>}

const stableHash=(value:string)=>{let hash=2166136261;for(let index=0;index<value.length;index++){hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(16).padStart(8,'0')}

export async function previewFolder(root:BrowserDirectoryHandle):Promise<ManifestPreview>{
  const entries:ManifestPreview['entries']=[],failures:ManifestPreview['failures']=[]
  let total=0
  const walk=async(directory:BrowserDirectoryHandle,prefix:string,depth:number):Promise<void>=>{
    if(depth>MATERIAL_LIMITS.maxDepth)throw new Error('Folder depth exceeds the safety limit')
    for await(const handle of directory.values()){
      if(entries.length>=MATERIAL_LIMITS.entryCount)throw new Error('Folder contains too many entries')
      const raw=prefix?`${prefix}/${handle.name}`:handle.name
      if(handle.kind==='directory'){
        const value=manifestEntry(raw,{entryType:'directory'})
        entries.push(value);if(!value.safe)failures.push({path:raw,reason:value.reason??'Unsafe path'});else await walk(handle,value.relativePath,depth+1)
      }else{
        const file=await handle.getFile();total+=file.size
        let value=manifestEntry(raw,{entryType:'file',size:file.size,modifiedAt:new Date(file.lastModified).toISOString()})
        if(file.size>MATERIAL_LIMITS.singleFileBytes)value={...value,safe:false,reason:'File exceeds the single-file limit'}
        entries.push(value);if(!value.safe)failures.push({path:raw,reason:value.reason??'Unsafe file'})
        if(total>MATERIAL_LIMITS.totalBytes)throw new Error('Folder size exceeds the 2 GB manifest limit')
      }
    }
  }
  await walk(root,'',0)
  const signature=entries.map(entry=>`${entry.relativePath}:${entry.entryType}:${entry.size??0}:${entry.modifiedAt??''}`).sort().join('|')
  return{sourceLabel:root.name,sourceFingerprint:`folder:${root.name}:${stableHash(signature)}`,sourceKind:'folder',entries,failures,totals:{discovered:entries.length,accepted:entries.filter(entry=>entry.safe&&entry.entryType==='file').length,rejected:failures.length,uncompressedBytes:total},canConfirm:entries.some(entry=>entry.safe&&entry.entryType==='file')}
}
