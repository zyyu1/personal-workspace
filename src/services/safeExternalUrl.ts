export function parseSafeExternalUrl(value:string):URL{
  let parsed:URL
  try{parsed=new URL(value)}catch{throw new Error('Enter a valid HTTP or HTTPS URL')}
  if(!['http:','https:'].includes(parsed.protocol))throw new Error('Only HTTP or HTTPS links are supported')
  return parsed
}

export function safeExternalUrl(value?:string):string|undefined{
  if(!value)return undefined
  try{return parseSafeExternalUrl(value).toString()}catch{return undefined}
}
