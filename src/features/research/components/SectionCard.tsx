import type { ReactNode } from 'react'
export function SectionCard({ title, eyebrow, action, children, className = '' }: { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}><header className="card-head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{action}</header>{children}</section>
}
