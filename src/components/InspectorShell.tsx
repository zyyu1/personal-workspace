import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AlertCircle, Inbox, LoaderCircle, X } from 'lucide-react'

type InspectorState='ready'|'loading'|'error'|'empty'

export function InspectorShell({title,eyebrow,onClose,children,className='',label='Context inspector',state='ready',message,full=false,returnFocusTo}:{title:string;eyebrow?:ReactNode;onClose:()=>void;children?:ReactNode;className?:string;label?:string;state?:InspectorState;message?:string;full?:boolean;returnFocusTo?:HTMLElement|null}){
  const titleId=useId(),panelRef=useRef<HTMLElement>(null),returnFocus=useRef<HTMLElement|null>(returnFocusTo??null),onCloseRef=useRef(onClose)
  onCloseRef.current=onClose
  useEffect(()=>{if(returnFocusTo)returnFocus.current=returnFocusTo},[returnFocusTo])
  useEffect(()=>{
    returnFocus.current??=document.activeElement instanceof HTMLElement?document.activeElement:null
    const panel=panelRef.current
    const first=panel?.querySelector<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
    first?.focus()
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onCloseRef.current();return}
      if(event.key!=='Tab'||!panel)return
      const focusable=[...panel.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      if(!focusable.length)return
      const firstItem=focusable[0],lastItem=focusable.at(-1)!
      if(event.shiftKey&&document.activeElement===firstItem){event.preventDefault();lastItem.focus()}
      else if(!event.shiftKey&&document.activeElement===lastItem){event.preventDefault();firstItem.focus()}
    }
    window.addEventListener('keydown',key)
    return()=>{window.removeEventListener('keydown',key);returnFocus.current?.focus()}
  },[])
  const status=state==='loading'?<div className="inspector-shell-state" role="status"><LoaderCircle className="spin"/><strong>Loading details…</strong></div>:state==='error'?<div className="inspector-shell-state" role="alert"><AlertCircle/><strong>{message??'Details are unavailable.'}</strong></div>:state==='empty'?<div className="inspector-shell-state"><Inbox/><strong>{message??'Nothing selected.'}</strong></div>:children
  return <aside ref={panelRef} className={`inspector-shell ${className} ${full?'inspector-shell-full':''}`} role="complementary" aria-label={label} tabIndex={-1}>
    <header className="inspector-shell-header"><div>{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label={`Close ${label.toLowerCase()}`}><X/></button></header>
    <div className="inspector-shell-body">{status}</div>
  </aside>
}
