import { useEffect, useState } from 'react';
import { useActiveSection } from '../lib/hooks';
import { SECTION_IDS, type SectionId } from '../lib/world';

const LABELS: Record<SectionId, string> = {
  home: 'Home',
  about: 'About',
  experience: 'Experience',
  skills: 'Skills',
  projects: 'Projects',
  tunekadal: 'TuneKadal',
  github: 'GitHub',
  contact: 'Contact',
};

export function Nav({ calm, onToggleCalm }: { calm: boolean; onToggleCalm: () => void }) {
  const active = useActiveSection();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="nav">
      <a className="nav-mark" href="#home" aria-label="Shinoj Jerald — back to top">
        <span className="nav-mark-glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5" />
            <path d="M2 13c2.5 0 2.5-3 5-3s2.5 5 5 5 2.5-7 5-7 2.5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <span className="nav-mark-text">SJ</span>
      </a>

      <nav aria-label="Sections" className={`nav-links ${open ? 'is-open' : ''}`} id="nav-links">
        <ul>
          {SECTION_IDS.map((id) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={active === id ? 'is-active' : undefined}
                aria-current={active === id ? 'true' : undefined}
                onClick={() => setOpen(false)}
              >
                {LABELS[id]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="nav-tools">
        <button
          type="button"
          className="nav-calm"
          aria-pressed={calm}
          aria-label="Reduce motion"
          onClick={onToggleCalm}
          title={calm ? 'Motion reduced — click to restore' : 'Reduce motion'}
        >
          <span aria-hidden="true" className={`calm-dot ${calm ? 'is-calm' : ''}`} />
          <span className="nav-calm-label">{calm ? 'Calm' : 'Motion'}</span>
        </button>
        <button
          type="button"
          className="nav-burger"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span aria-hidden="true" className={`burger ${open ? 'is-open' : ''}`}>
            <i />
            <i />
          </span>
        </button>
      </div>
    </header>
  );
}
