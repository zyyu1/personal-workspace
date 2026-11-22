// Module 009 real-browser smoke check (cloud CI runner, headless Chrome over the DevTools protocol).
// No npm dependency: Node 24 global fetch/WebSocket only. Prints JSON evidence lines; exits non-zero on failure.
// This is cloud Chrome evidence only — NOT Windows native file-picker / host validation.
const BASE=process.env.APP_URL??'http://127.0.0.1:4173'
const CDP=process.env.CDP_URL??'http://127.0.0.1:9222'
const OFFERING='offering-system-theory-ws26'
const VIEWPORTS=[[1440,900],[1024,768],[390,844]]
const evidence=[],failures=[],consoleErrors=[]
const log=(step,data)=>{const row={step,...data};evidence.push(row);console.log(JSON.stringify(row))}
const check=(condition,step,detail)=>{if(!condition){failures.push({step,detail});console.log(JSON.stringify({step,FAIL:detail}))}return condition}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))

const target=await (await fetch(`${CDP}/json/new?about:blank`,{method:'PUT'})).json()
const socket=new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject})
let nextId=0;const pending=new Map()
socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result)}else if(message.method==='Runtime.exceptionThrown')consoleErrors.push(message.params.exceptionDetails.exception?.description??message.params.exceptionDetails.text);else if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')consoleErrors.push(message.params.args.map(arg=>arg.value??arg.description).join(' '));else if(message.method==='Log.entryAdded'&&message.params.entry.level==='error')consoleErrors.push(`${message.params.entry.source}: ${message.params.entry.text}`)}
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})
const js=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value}
const waitFor=async(expression,label,timeout=8000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await js(`Boolean(${expression})`))return true;await sleep(100)}check(false,label,`timed out waiting for: ${expression}`);return false}
const go=async path=>{await send('Page.navigate',{url:`${BASE}${path}`});await sleep(300);await waitFor(`document.readyState==='complete'`,`load ${path}`)}
const key=async name=>{const code={Escape:27,Tab:9}[name];await send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,windowsVirtualKeyCode:code});await send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name,windowsVirtualKeyCode:code})}
const helpers=`window.__set=(selector,value)=>{const el=document.querySelector(selector);if(!el)throw new Error('missing '+selector);const proto=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}));return true};window.__button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim().includes(text));window.__overflow=()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,overflow:document.documentElement.scrollWidth>window.innerWidth+1});window.__inspector=label=>document.querySelector('aside[aria-label="'+label+'"]')`
const inject=()=>js(helpers)

await send('Page.enable');await send('Runtime.enable');await send('Log.enable')
const nextMonth=(()=>{const date=new Date();date.setUTCMonth(date.getUTCMonth()+1,15);return date.toISOString().slice(0,10)})()

for(const [width,height] of VIEWPORTS){
  const tag=`${width}x${height}`
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768})
  await go(`/study/courses/${OFFERING}/exams`);await inject()
  await waitFor(`document.body.innerText.includes('Exams & past papers')`,`${tag} exams route`)
  log('route',{viewport:tag,tabActive:await js(`document.querySelector('a[aria-current="page"]')?.textContent`),unknownShown:await js(`document.body.innerText.includes('Unknown date')`),...await js('window.__overflow()')})
  check(!(await js('window.__overflow().overflow')),`${tag} no overflow (list)`,await js('window.__overflow()'))
  // Create -> auto-open Inspector -> Escape -> focus returns to the create input
  const title=`Browser exam ${tag}`
  await js(`window.__set('input[aria-label="New assessment title"]',${JSON.stringify(title)})`);await js(`window.__button('Add assessment').click()`)
  await waitFor(`window.__inspector('Assessment inspector')`,`${tag} inspector auto-opens`)
  log('inspector-open',{viewport:tag,focusInside:await js(`window.__inspector('Assessment inspector').contains(document.activeElement)`),rect:await js(`(()=>{const r=window.__inspector('Assessment inspector').getBoundingClientRect();return{x:Math.round(r.x),width:Math.round(r.width),height:Math.round(r.height)}})()`),...await js('window.__overflow()')})
  check(!(await js('window.__overflow().overflow')),`${tag} no overflow (inspector)`,await js('window.__overflow()'))
  // DST gap is rejected in the real UI
  await js(`window.__set('.milestone-form select:nth-of-type(1)','exam')`)
  await js(`(()=>{const selects=[...document.querySelectorAll('.milestone-form select')];window.__set_el=(el,v)=>{const proto=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}))};window.__set_el(selects[1],'exact');return true})()`)
  await sleep(150)
  await js(`(()=>{const form=document.querySelector('.milestone-form');window.__set_el(form.querySelector('input[type=date]'),'2026-03-29');window.__set_el(form.querySelector('input[type=time]'),'02:30');window.__set_el(form.querySelector('input[list=exam-zones]'),'Europe/Berlin');const v=[...form.querySelectorAll('select')][2];window.__set_el(v,'user-confirmed');return true})()`)
  await js(`window.__button('Save milestone').click()`)
  await waitFor(`document.body.innerText.includes('does not exist in Europe/Berlin')`,`${tag} DST gap rejected in UI`)
  // Valid exact milestone in next month
  await js(`(()=>{const form=document.querySelector('.milestone-form');window.__set_el(form.querySelector('input[type=date]'),${JSON.stringify(nextMonth)});window.__set_el(form.querySelector('input[type=time]'),'09:00');return true})()`)
  await js(`window.__button('Save milestone').click()`)
  await waitFor(`window.__inspector('Assessment inspector')?.innerText.includes(${JSON.stringify(`${nextMonth} 09:00 (Europe/Berlin)`)})`,`${tag} exact milestone saved`)
  const assessmentId=await js(`new URLSearchParams(location.search).get('assessment')`)
  await key('Escape')
  await waitFor(`!window.__inspector('Assessment inspector')`,`${tag} Escape closes inspector`)
  const focusLabel=await js(`document.activeElement?.getAttribute('aria-label')`)
  log('escape-focus',{viewport:tag,focusLabel})
  check(focusLabel==='New assessment title',`${tag} focus returns to create input`,focusLabel)
  // Deep link persisted reload (IndexedDB)
  await go(`/study/courses/${OFFERING}/exams?assessment=${encodeURIComponent(assessmentId)}`);await inject()
  await waitFor(`window.__inspector('Assessment inspector')?.innerText.includes(${JSON.stringify(title)})`,`${tag} deep link reload`)
  log('deep-link-reload',{viewport:tag,assessmentId,persisted:await js(`window.__inspector('Assessment inspector')?.innerText.includes(${JSON.stringify(nextMonth)})`)})
  await key('Escape');await sleep(200)
  // Past papers view: empty/permission states are plain text
  await js(`window.__button('Past Papers').click()`);await sleep(200)
  log('past-papers-view',{viewport:tag,emptyState:await js(`document.body.innerText.includes('No past papers in this term')`),...await js('window.__overflow()')})
  check(!(await js('window.__overflow().overflow')),`${tag} no overflow (past papers)`,await js('window.__overflow()'))
  // Missing deep link fallback
  await go(`/study/courses/${OFFERING}/exams?practice=does-not-exist`);await inject()
  await waitFor(`document.body.innerText.includes('not available in this course offering')`,`${tag} missing deep link fallback`)
  // Overview summary
  await go(`/study/courses/${OFFERING}/overview`);await inject()
  await waitFor(`document.body.innerText.includes('Open exams')`,`${tag} overview exam summary`)
  check(!(await js('window.__overflow().overflow')),`${tag} no overflow (overview)`,await js('window.__overflow()'))
}

// Calendar: one exam event with original local time + zone
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
await go('/calendar');await inject()
await waitFor(`document.querySelector('select[aria-label="Calendar project"] option[value="${OFFERING}"]')`,'calendar project option')
await js(`window.__set('select[aria-label="Calendar project"]','${OFFERING}')`);await sleep(300)
await js(`document.querySelector('button[aria-label="Next month"]').click()`);await sleep(300)
await waitFor(`document.body.innerText.includes('Original: ${nextMonth} 09:00')`,'calendar original local time')
log('calendar',{examEvents:await js(`[...document.querySelectorAll('.calendar-item')].filter(el=>el.innerText.includes('Browser exam')).length`),text:await js(`[...document.querySelectorAll('.calendar-item')].filter(el=>el.innerText.includes('Browser exam')).map(el=>el.innerText.replace(/\\s+/g,' ').slice(0,160))`)})
check(await js(`[...document.querySelectorAll('.calendar-item')].filter(el=>el.innerText.includes('Browser exam 1440x900')).length`)===1,'calendar one event per exam','count mismatch')

log('console-errors',{count:consoleErrors.length,errors:consoleErrors.slice(0,10)})
check(consoleErrors.length===0,'no console errors',consoleErrors.slice(0,10))
log('summary',{checks:evidence.length,failures:failures.length,environment:'GitHub-hosted ubuntu-latest, headless Google Chrome, vite preview (cloud only; not Windows host validation)'})
socket.close()
process.exit(failures.length?1:0)
