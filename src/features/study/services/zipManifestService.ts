import { BlobReader, ZipReader } from '@zip.js/zip.js'
import type { ManifestPreview } from '../types'
import { MATERIAL_LIMITS, manifestEntry } from './materialManifest'

const stableHash=(value:string)=>{let hash=2166136261;for(let index=0;index<value.length;index++){hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(16).padStart(8,'0')}

export async function previewZip(file:File):Promise<ManifestPreview>{
  if(!file.name.toLowerCase().endsWith('.zip'))throw new Error('Choose a .zip archive')
  if(file.size>MATERIAL_LIMITS.archiveBytes)throw new Error('ZIP exceeds the 250 MB source limit')
  const reader=new ZipReader(new BlobReader(file))
  try{
    const raw=await reader.getEntries()
    if(raw.length>MATERIAL_LIMITS.entryCount)throw new Error('ZIP contains too many entries')
    let total=0
    const entries=raw.map(entry=>{
      total+=entry.uncompressedSize
      const unixType=(entry.unixMode??0)&0o170000
      const special=unixType!==0&&unixType!==0o100000&&unixType!==0o040000
      const ratio=entry.compressedSize===0?(entry.uncompressedSize===0?1:Infinity):entry.uncompressedSize/entry.compressedSize
      const value=manifestEntry(entry.filename,{entryType:entry.directory?'directory':'file',size:entry.uncompressedSize,compressedSize:entry.compressedSize,modifiedAt:entry.lastModDate instanceof Date&&!Number.isNaN(entry.lastModDate.getTime())?entry.lastModDate.toISOString():undefined})
      const reasons=[
        !value.safe?value.reason:undefined,
        entry.encrypted?'Encrypted entries are not supported':undefined,
        entry.symlink||special?'Links and special files are not allowed':undefined,
        entry.uncompressedSize>MATERIAL_LIMITS.singleFileBytes?'Entry exceeds the single-file limit':undefined,
        ratio>MATERIAL_LIMITS.compressionRatio?'Compression ratio exceeds the safety limit':undefined,
        ![0,8].includes(entry.compressionMethod)?'Compression method is not supported':undefined,
        entry.filename.includes('\uFFFD')?'Filename encoding could not be decoded safely':undefined,
      ].filter(Boolean) as string[]
      return{...value,executable:entry.executable,symlink:entry.symlink,encrypted:entry.encrypted,safe:reasons.length===0,reason:reasons.join('; ')||undefined}
    })
    if(total>MATERIAL_LIMITS.totalBytes)throw new Error('ZIP expanded size exceeds the 2 GB manifest limit')
    const failures=entries.filter(entry=>!entry.safe).map(entry=>({path:entry.relativePath,reason:entry.reason??'Unsafe entry'}))
    const signature=entries.map(entry=>`${entry.relativePath}:${entry.entryType}:${entry.size??0}:${entry.compressedSize??0}`).sort().join('|')
    return{sourceLabel:file.name,sourceFingerprint:`zip:${file.name}:${file.size}:${stableHash(signature)}`,sourceKind:'archive',entries,failures,totals:{discovered:entries.length,accepted:entries.filter(entry=>entry.safe&&entry.entryType==='file').length,rejected:failures.length,uncompressedBytes:total},canConfirm:entries.some(entry=>entry.safe&&entry.entryType==='file')}
  }catch(error){throw new Error(error instanceof Error?`ZIP preflight failed: ${error.message}`:'ZIP preflight failed')}
  finally{await reader.close().catch(()=>undefined)}
}
