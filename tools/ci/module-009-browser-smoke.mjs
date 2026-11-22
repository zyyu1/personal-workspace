// Module 009 real-browser smoke check (cloud CI runner, headless Chrome over the DevTools protocol).
// No npm dependency: Node 24 global fetch/WebSocket only. Prints JSON evidence lines; exits non-zero on failure.
// This is cloud Chrome evidence only — NOT Windows native file-picker / host validation.
const BASE=process.env.APP_URL??'http://127.0.0.1:4173'
const CDP=process.env.CDP_URL??'http://127.0.0.1:9222'
const OFFERING='offering-system-theory-ws26'
const VIEWPORTS=[[1440,900],[1024,768],[390,844]]
const evidence=[],failures=[],consoleErrors=[],knownBrowserDefaults=[]
const log=(step,data)=>{const row={step,...data};evidence.push(row);console.log(JSON.stringify(row))}
const check=(condition,step,detail)=>{if(!condition){failures.push({step,detail});console.log(JSON.stringify({step,FAIL:detail}))}return condition}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))

const target=await (await fetch(`${CDP}/json/new?about:blank`,{method:'PUT'})).json()
const socket=new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject})
let nextId=0;const pending=new Map()
socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result)}else if(message.method==='Runtime.exceptionThrown')consoleErrors.push(message.params.exceptionDetails.exception?.description??message.params.exceptionDetails.text);else if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')consoleErrors.push(message.params.args.map(arg=>arg.value??arg.description).join(' '));else if(message.method==='Log.entryAdded'&&message.params.entry.level==='error'){const entry=message.params.entry;if(entry.source==='network'&&new URL(entry.url??'http://x/').pathname==='/favicon.ico')knownBrowserDefaults.push(`${entry.text} ${entry.url}`);else consoleErrors.push(`${entry.source}: ${entry.text}${entry.url?` (${entry.url})`:''}`)}}
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})
const js=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value}
const waitFor=async(expression,label,timeout=8000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await js(`Boolean(${expression})`))return true;await sleep(100)}check(false,label,`timed out waiting for: ${expression}`);return false}
const go=async path=>{await send('Page.navigate',{url:`${BASE}${path}`});await sleep(300);await waitFor(`document.readyState==='complete'`,`load ${path}`)}
const key=async name=>{const code={Escape:27,Tab:9}[name];await send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,windowsVirtualKeyCode:code});await send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name,windowsVirtualKeyCode:code})}
const helpers=`window.__set=(selector,value)=>{const el=document.querySelector(selector);if(!el)throw new Error('missing '+selector);const proto=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}));return true};window.__button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim().includes(text));window.__overflow=()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,overflow:document.documentElement.scrollWidth>window.innerWidth+1});window.__inspector=label=>document.querySelector('aside[aria-label="'+label+'"]')`
const inject=()=>js(helpers)

await send('Page.enable');await send('Runtime.enable');await send('Log.enable')
const nextMonth=(()=>{const date=new Date();date.setUTCMonth(date.getUTCMonth()+1,15);return date.toISOString().slice(0,10)})()

// Focus-restore diagnostics (MODULE_009_FOCUS_DIAGNOSTIC_SCRIPT_REMEDIATION_AUTHORIZATION.md):
// the script never calls .focus(); it only observes document.activeElement.
const CYCLES_PER_VIEWPORT=5,FOCUS_TIMEOUT_MS=1000,FOCUS_DELAY_FLAG_MS=250,POLL_MS=25
const focusCycles=[]
const focusProbe=`window.__describe=el=>el?{tag:el.tagName.toLowerCase(),id:el.id||null,ariaLabel:el.getAttribute?.('aria-label')??null,connected:el.isConnected}:null;
window.__armFocusProbe=()=>{window.__expectedInput=document.querySelector('input[aria-label="New assessment title"]');window.__closedAt=undefined;window.__initialFocus=undefined;const inspector=window.__inspector('Assessment inspector');const observer=new MutationObserver(()=>{if(window.__closedAt===undefined&&!inspector.isConnected){window.__closedAt=performance.now();window.__initialFocus=window.__describe(document.activeElement);observer.disconnect()}});observer.observe(document.body,{childList:true,subtree:true});window.__probeObserver=observer;return Boolean(window.__expectedInput&&inspector)};
window.__runFocusProbe=async(timeoutMs,pollMs)=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const closeDeadline=performance.now()+3000;while(window.__closedAt===undefined&&performance.now()<closeDeadline)await sleep(5);if(window.__closedAt===undefined){window.__probeObserver?.disconnect();return{inspectorClosed:false}}
const expected=window.__expectedInput,t0=window.__closedAt;let latency;while(performance.now()-t0<=timeoutMs){if(document.activeElement===expected&&expected.isConnected){latency=Math.round(performance.now()-t0);break}await sleep(pollMs)}
return{inspectorClosed:true,initialFocus:window.__initialFocus,initialIsTarget:window.__initialFocus?.ariaLabel==='New assessment title'&&window.__initialFocus?.connected===true,restoredFocus:window.__describe(document.activeElement),restorationLatencyMs:latency??null,timeout:latency===undefined,targetConnected:expected.isConnected,targetIsSameElement:document.activeElement===expected}}`

for(const [width,height] of VIEWPORTS){
  const tag=`${width}x${height}`
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768})
  await go(`/study/courses/${OFFERING}/exams`);await inject();await js(focusProbe)
  await waitFor(`document.body.innerText.toLowerCase().includes('exams & past papers')`,`${tag} exams route`)
  log('route',{viewport:tag,tabActive:await js(`document.querySelector('a[aria-current="page"]')?.textContent`),unknownShown:await js(`document.body.innerText.includes('Unknown date')`),...await js('window.__overflow()')})
  check(!(await js('window.__overflow().overflow')),`${tag} no overflow (list)`,await js('window.__overflow()'))
  let assessmentId,firstTitle
  for(let cycle=1;cycle<=CYCLES_PER_VIEWPORT;cycle++){
    // Create -> auto-open Inspector -> (cycle 1: DST + milestone checks) -> Escape -> observe focus restore
    const title=`Browser exam ${tag} #${cycle}`
    check(!(await js(`Boolean(window.__inspector('Assessment inspector'))`)),`${tag} cycle ${cycle} starts with inspector closed`,'inspector still open')
    await js(`window.__set('input[aria-label="New assessment title"]',${JSON.stringify(title)})`);await js(`window.__button('Add assessment').click()`)
    await waitFor(`window.__inspector('Assessment inspector')?.innerText.includes(${JSON.stringify(title)})`,`${tag} cycle ${cycle} inspector auto-opens`)
    const focusInside=await js(`window.__inspector('Assessment inspector').contains(document.activeElement)`)
    check(focusInside,`${tag} cycle ${cycle} focus inside inspector`,focusInside)
    if(cycle===1){
      firstTitle=title
      log('inspector-open',{viewport:tag,focusInside,rect:await js(`(()=>{const r=window.__inspector('Assessment inspector').getBoundingClientRect();return{x:Math.round(r.x),width:Math.round(r.width),height:Math.round(r.height)}})()`),...await js('window.__overflow()')})
      check(!(await js('window.__overflow().overflow')),`${tag} no overflow (inspector)`,await js('window.__overflow()'))
      // DST gap is rejected in the real UI
      await js(`(()=>{const selects=[...document.querySelectorAll('.milestone-form select')];window.__set_el=(el,v)=>{const proto=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}))};window.__set_el(selects[0],'exam');window.__set_el(selects[1],'exact');return true})()`)
      await waitFor(`document.querySelector('.milestone-form input[type=time]')`,`${tag} exact time field shown`)
      await js(`(()=>{const form=document.querySelector('.milestone-form');window.__set_el(form.querySelector('input[type=date]'),'2026-03-29');window.__set_el(form.querySelector('input[type=time]'),'02:30');window.__set_el(form.querySelector('input[list=exam-zones]'),'Europe/Berlin');const v=[...form.querySelectorAll('select')][2];window.__set_el(v,'user-confirmed');return true})()`)
      await js(`window.__button('Save milestone').click()`)
      await waitFor(`document.body.innerText.includes('does not exist in Europe/Berlin')`,`${tag} DST gap rejected in UI`)
      await js(`(()=>{const form=document.querySelector('.milestone-form');window.__set_el(form.querySelector('input[type=date]'),${JSON.stringify(nextMonth)});window.__set_el(form.querySelector('input[type=time]'),'09:00');return true})()`)
      await js(`window.__button('Save milestone').click()`)
      await waitFor(`window.__inspector('Assessment inspector')?.innerText.includes(${JSON.stringify(`${nextMonth} 09:00 (Europe/Berlin)`)})`,`${tag} exact milestone saved`)
      await waitFor(`!window.__button('Save milestone')?.disabled`,`${tag} save settled`)
      assessmentId=await js(`new URLSearchParams(location.search).get('assessment')`)
    }
    const armed=await js('window.__armFocusProbe()')
    check(armed,`${tag} cycle ${cycle} focus probe armed`,armed)
    await key('Escape')
    const result=await js(`window.__runFocusProbe(${FOCUS_TIMEOUT_MS},${POLL_MS})`)
    const delayed=result.restorationLatencyMs!==null&&result.restorationLatencyMs>FOCUS_DELAY_FLAG_MS
    const row={viewport:tag,cycle,...result,potentialUserVisibleDelay:delayed}
    focusCycles.push(row);log('focus-cycle',row)
    check(result.inspectorClosed,`${tag} cycle ${cycle} Escape closes inspector`,result)
    check(result.inspectorClosed&&!result.timeout&&result.targetIsSameElement&&result.targetConnected,`${tag} cycle ${cycle} focus restored to the original connected create input within ${FOCUS_TIMEOUT_MS} ms`,result)
    if(delayed)log('FLAG potential user-visible focus delay',{viewport:tag,cycle,restorationLatencyMs:result.restorationLatencyMs,thresholdMs:FOCUS_DELAY_FLAG_MS})
  }
  // Deep link persisted reload (IndexedDB)
  await go(`/study/courses/${OFFERING}/exams?assessment=${encodeURIComponent(assessmentId)}`);await inject()
  await waitFor(`window.__inspector('Assessment inspector')?.innerText.includes(${JSON.stringify(firstTitle)})`,`${tag} deep link reload`)
  log('deep-link-reload',{viewport:tag,assessmentId,persisted:await js(`window.__inspector('Assessment inspector')?.innerText.includes(${JSON.stringify(nextMonth)})`)})
  await key('Escape');await waitFor(`!window.__inspector('Assessment inspector')`,`${tag} deep link inspector closes`)
  // Past papers view: empty/permission states are plain text
  await js(`window.__button('Past Papers').click()`)
  await waitFor(`document.body.innerText.includes('No past papers in this term')`,`${tag} past papers empty state`)
  log('past-papers-view',{viewport:tag,emptyState:true,...await js('window.__overflow()')})
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
for(const [width,height] of VIEWPORTS){const count=await js(`[...document.querySelectorAll('.calendar-item')].filter(el=>el.innerText.includes('Browser exam ${width}x${height} #1')).length`);check(count===1,`calendar one event per exam (${width}x${height} #1)`,count)}

log('console-errors',{count:consoleErrors.length,errors:consoleErrors.slice(0,10),reportedNotFailed:{reason:'index.html declares no favicon; Chrome requests /favicon.ico by default (pre-existing, not app code)',entries:[...new Set(knownBrowserDefaults)]}})
check(consoleErrors.length===0,'no console errors',consoleErrors.slice(0,10))
const latencies=focusCycles.map(row=>row.restorationLatencyMs).filter(value=>value!==null)
log('focus-summary',{cycles:focusCycles.length,restored:focusCycles.filter(row=>!row.timeout&&row.targetIsSameElement).length,timeouts:focusCycles.filter(row=>row.timeout).length,initialNotYetOnTarget:focusCycles.filter(row=>!row.initialIsTarget).length,delayedOver250ms:focusCycles.filter(row=>row.potentialUserVisibleDelay).map(row=>`${row.viewport}#${row.cycle}:${row.restorationLatencyMs}ms`),maxLatencyMs:latencies.length?Math.max(...latencies):null,latencies:focusCycles.map(row=>`${row.viewport}#${row.cycle}:${row.restorationLatencyMs??'timeout'}`)})
check(focusCycles.length===VIEWPORTS.length*CYCLES_PER_VIEWPORT,'all 15 focus cycles executed',focusCycles.length)
log('summary',{checks:evidence.length,failures:failures.length,environment:'GitHub-hosted ubuntu-latest, headless Google Chrome, vite preview (cloud only; not Windows host validation)'})
socket.close()
process.exit(failures.length?1:0)
