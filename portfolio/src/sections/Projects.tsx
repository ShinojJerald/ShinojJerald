import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { labRepos, projectKinds, projects, type Project, type ProjectKind } from '../content';
import { Reveal, SectionHead } from '../components/SectionHead';
import { world } from '../lib/world';

const KIND_ORDER: ProjectKind[] = ['analytics', 'viz', 'ml', 'nlp', 'product'];

/** Small line glyph per project type — gives each category its own silhouette. */
function KindGlyph({ kind }: { kind: ProjectKind }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" className="kind-glyph">
      {kind === 'analytics' && (
        <g {...common}>
          <path d="M5 27h22" />
          <rect x="7" y="16" width="4" height="11" />
          <rect x="14" y="10" width="4" height="17" />
          <rect x="21" y="5" width="4" height="22" />
        </g>
      )}
      {kind === 'viz' && (
        <g {...common}>
          <path d="M5 27V5M5 27h22" />
          <circle cx="11" cy="19" r="1.6" />
          <circle cx="16" cy="13" r="2.4" />
          <circle cx="23" cy="9" r="1.6" />
          <circle cx="20" cy="20" r="1.2" />
          <path d="M8 23c5-3 9-9 17-15" strokeDasharray="2 3" />
        </g>
      )}
      {kind === 'ml' && (
        <g {...common}>
          {[8, 16, 24].map((y) => (
            <circle key={`a${y}`} cx="6" cy={y} r="2" />
          ))}
          {[11, 21].map((y) => (
            <circle key={`b${y}`} cx="16" cy={y} r="2" />
          ))}
          <circle cx="26" cy="16" r="2" />
          <path d="M8 8l6 3M8 8l6 13M8 16l6-5M8 16l6 5M8 24l6-13M8 24l6-3M18 11l6 5M18 21l6-5" opacity=".7" />
        </g>
      )}
      {kind === 'nlp' && (
        <g {...common}>
          <path d="M5 8h16a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-9l-5 4v-4H5z" />
          <path d="M9 13h10M9 17h6" />
          <circle cx="25" cy="7" r="3" />
        </g>
      )}
      {kind === 'product' && (
        <g {...common}>
          <path d="M13 27l1.5-15h3L19 27z" />
          <path d="M12 12h8M14 12V9h4v3M16 9V7" />
          <path d="M20 10l8-3M20 11l8 3" opacity=".7" />
          <path d="M3 28c3-1.5 5 1.5 8 0s5 1.5 8 0 5 1.5 8 0" />
        </g>
      )}
    </svg>
  );
}

function tilt(e: PointerEvent<HTMLElement>) {
  if (world.reducedMotion || e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty('--mx', `${x * 100}%`);
  el.style.setProperty('--my', `${y * 100}%`);
  el.style.setProperty('--rx', `${(0.5 - y) * 5}deg`);
  el.style.setProperty('--ry', `${(x - 0.5) * 6}deg`);
}
function untilt(e: PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty('--rx', '0deg');
  e.currentTarget.style.setProperty('--ry', '0deg');
}

function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (project && !d.open) d.showModal();
    if (!project && d.open) d.close();
  }, [project]);
  return (
    <dialog
      ref={ref}
      className={`pdialog ${project ? `k-${project.kind}` : ''}`}
      aria-labelledby="pdialog-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {project && (
        <div className="pdialog-inner">
          <button type="button" className="pdialog-close" onClick={onClose} aria-label="Close project">
            <span aria-hidden="true" />
          </button>
          <div className="pdialog-kind">
            <KindGlyph kind={project.kind} />
            <span className="mono-label">{projectKinds[project.kind].label}</span>
          </div>
          <h3 id="pdialog-title" className="pdialog-title">
            {project.title}
          </h3>
          <p className="pdialog-text">{project.detail ?? project.blurb}</p>
          <ul className="chips" aria-label="Tags">
            {project.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="pdialog-links">
            {project.links.map((l) => (
              <a key={l.href} className="btn btn-ghost" href={l.href} target="_blank" rel="noreferrer">
                <span>{l.label}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
            {project.anchor && (
              <a className="btn btn-primary" href={project.anchor} onClick={onClose}>
                <span>Explore</span>
                <span aria-hidden="true">→</span>
              </a>
            )}
            {project.links.length === 0 && !project.anchor && <p className="pdialog-note">No public repository for this project.</p>}
          </div>
        </div>
      )}
    </dialog>
  );
}

export function Projects() {
  const flagship = projects.find((p) => p.id === 'tunekadal')!;
  const universe = projects.filter((p) => p.id !== 'tunekadal');
  const [filter, setFilter] = useState<ProjectKind | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const counts = useMemo(() => {
    const c: Partial<Record<ProjectKind, number>> = {};
    universe.forEach((p) => (c[p.kind] = (c[p.kind] ?? 0) + 1));
    return c;
  }, [universe]);
  const shown = universe.filter((p) => filter === 'all' || p.kind === filter);
  const opened = projects.find((p) => p.id === openId) ?? null;

  return (
    <section id="projects" className="section projects" aria-labelledby="projects-title">
      <div className="container">
        <SectionHead
          index="04"
          kicker="Project universe"
          title={
            <span id="projects-title">
              Things I have <em>built.</em>
            </span>
          }
          lede="A shipped product, analytics and machine-learning work, and the code for this site. Hover to preview a project, then open it for the details."
        />

        {/* Flagship */}
        <Reveal className="cards-featured">
          <article className="card card-featured" onPointerMove={tilt} onPointerLeave={untilt}>
            <div className="card-art" aria-hidden="true">
              <svg viewBox="0 0 320 200" className="card-lighthouse">
                <defs>
                  <linearGradient id="beamG" x1="0" x2="1">
                    <stop offset="0" stopColor="#fff4dc" stopOpacity=".55" />
                    <stop offset="1" stopColor="#6fdcff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon className="card-beam" points="210,62 330,20 330,110" fill="url(#beamG)" />
                <path d="M40 176 Q120 160 200 172 T330 168 V200 H0 V180 Z" fill="#0a2238" />
                <path d="M196 170 L201 78 H219 L224 170 Z" fill="#dbe7f1" />
                <path d="M199.4 120 L200.6 98 H219.4 L220.6 120 Z M198 150 L199 132 H221 L222 150 Z" fill="#1e5f8c" />
                <rect x="197" y="74" width="26" height="4" fill="#0e2740" />
                <rect x="203" y="60" width="14" height="14" fill="#fff4dc" />
                <path d="M200 60 L210 50 L220 60 Z" fill="#0e2740" />
                {[0, 1, 2].map((i) => (
                  <circle key={i} className="card-wave" cx="210" cy="66" r="14" style={{ animationDelay: `${i * 1.1}s` }} />
                ))}
                <path className="card-signal" d="M20 120 q10-18 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" />
              </svg>
            </div>
            <div className="card-body">
              <span className="mono-label">Flagship product · live</span>
              <h3 className="card-title">{flagship.title}</h3>
              <p className="card-text">{flagship.blurb}</p>
              <ul className="chips" aria-label="Technology">
                {flagship.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="card-actions">
                <a className="card-link" href="#tunekadal">
                  Enter the lighthouse <span aria-hidden="true">→</span>
                </a>
                <a className="card-link" href={flagship.links[0].href} target="_blank" rel="noreferrer">
                  tunekadal.com <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </article>
        </Reveal>

        {/* Filters */}
        <div className="pfilter" role="group" aria-label="Filter projects by type">
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All <span>{universe.length}</span>
          </button>
          {KIND_ORDER.filter((k) => counts[k]).map((k) => (
            <button key={k} type="button" className={`k-${k}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>
              <i aria-hidden="true" />
              {projectKinds[k].label} <span>{counts[k]}</span>
            </button>
          ))}
        </div>

        {/* Universe */}
        <ul className="universe" aria-live="polite">
          {shown.map((p, i) => (
            <li key={p.id} className="universe-cell" style={{ ['--i' as string]: i }}>
              <button
                type="button"
                className={`pnode k-${p.kind}`}
                onClick={() => setOpenId(p.id)}
                onPointerMove={tilt}
                onPointerLeave={untilt}
                aria-haspopup="dialog"
              >
                <span className="pnode-top">
                  <KindGlyph kind={p.kind} />
                  <span className="pnode-kind">{projectKinds[p.kind].short}</span>
                  {p.links.some((l) => l.href.includes('github.com')) && <span className="pnode-repo">Repo</span>}
                </span>
                <span className="pnode-title">{p.title}</span>
                <span className="pnode-blurb">{p.blurb}</span>
                <span className="pnode-open" aria-hidden="true">
                  Open <span>→</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Lab */}
        <Reveal className="lab">
          <div className="lab-head">
            <span className="mono-label">More in the lab · public repositories</span>
          </div>
          <ul className="lab-list">
            {labRepos.map((r) => (
              <li key={r.name}>
                <a href={r.href} target="_blank" rel="noreferrer">
                  <span>{r.name.replace(/-+/g, ' ').trim()}</span>
                  <em>{r.lang}</em>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <ProjectDialog project={opened} onClose={() => setOpenId(null)} />
    </section>
  );
}
