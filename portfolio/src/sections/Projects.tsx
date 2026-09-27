import { useRef, type PointerEvent } from 'react';
import { projects, type Project } from '../content';
import { Reveal, SectionHead } from '../components/SectionHead';
import { world } from '../lib/world';

function Card({ p, featured }: { p: Project; featured?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (world.reducedMotion || e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    el.style.setProperty('--rx', `${(0.5 - y) * 4}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 5}deg`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  const href = p.href ?? p.anchor;
  const external = Boolean(p.href);
  return (
    <article ref={ref} className={`card ${featured ? 'card-featured' : ''}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      {featured && (
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
      )}
      <div className="card-body">
        <span className="mono-label">{p.kicker}</span>
        <h3 className="card-title">{p.title}</h3>
        <p className="card-text">{p.body}</p>
        <ul className="chips" aria-label="Tags">
          {p.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {href && (
          <a className="card-link" href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
            {p.hrefLabel}
            <span aria-hidden="true">{external ? '↗' : '→'}</span>
          </a>
        )}
      </div>
    </article>
  );
}

export function Projects() {
  const [first, ...rest] = projects;
  return (
    <section id="projects" className="section projects" aria-labelledby="projects-title">
      <div className="container">
        <SectionHead
          index="04"
          kicker="Projects"
          title={
            <span id="projects-title">
              Things I have <em>built.</em>
            </span>
          }
          lede="A product I designed and shipped, the professional practice behind my day job, and the code for this site."
        />
        <div className="cards">
          <Reveal className="cards-featured">
            <Card p={first} featured />
          </Reveal>
          {rest.map((p, i) => (
            <Reveal key={p.id} delay={100 + i * 90}>
              <Card p={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
