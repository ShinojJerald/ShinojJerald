import type { ReactNode } from 'react';
import { useReveal } from '../lib/hooks';

export function SectionHead({ index, kicker, title, lede }: { index: string; kicker: string; title: ReactNode; lede?: ReactNode }) {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`section-head reveal ${shown ? 'is-in' : ''}`}>
      <p className="eyebrow">
        <span className="eyebrow-index">{index}</span>
        <span className="eyebrow-rule" aria-hidden="true" />
        {kicker}
      </p>
      <h2 className="section-title">{title}</h2>
      {lede && <p className="section-lede">{lede}</p>}
    </div>
  );
}

export function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'li' | 'article' }) {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${shown ? 'is-in' : ''} ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}
