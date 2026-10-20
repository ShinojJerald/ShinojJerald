import { useEffect, useRef, useState } from 'react';
import { foldex, links } from '../content';
import { FORGE, forgeTime, kickForge, world } from '../lib/world';
import { CountUp } from '../components/CountUp';

type EditStage = 'idle' | 'select' | 'type' | 'done';

/**
 * Foldex — the second flagship. The copy waits, dim, while the 3D page edits
 * itself; on the shared FORGE clock the tagline below is selected and retyped
 * ("scattered across four apps" → "one place") exactly as the page's heading
 * is, and the panel lights up. Focus, reduced motion, the Run button or a short
 * timeout reveal everything immediately, so nothing is ever hidden.
 */
export function Foldex({ webgl }: { webgl: boolean }) {
  const section = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [stage, setStage] = useState<EditStage>('idle');
  const [typed, setTyped] = useState(0);
  const [running, setRunning] = useState(false);
  const runTimer = useRef(0);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let raf = 0;
    let seenAt = 0;
    let done = false;
    const maxWait = window.innerWidth < 700 ? 1800 : 4600;
    const tick = () => {
      if (world.reducedMotion) {
        setStage('done');
        setTyped(foldex.editTo.length);
        setRevealed(true);
        return;
      }
      if (!done) {
        const t = forgeTime();
        if (t < FORGE.select) setStage('idle');
        else if (t < FORGE.type) setStage('select');
        else if (t < FORGE.typed) {
          setStage('type');
          setTyped(Math.max(1, Math.round(((t - FORGE.type) / (FORGE.typed - FORGE.type)) * foldex.editTo.length)));
        } else {
          // The tagline edits once and then stays edited.
          done = true;
          setStage('done');
          setTyped(foldex.editTo.length);
          setRevealed(true);
        }
        if (performance.now() - seenAt > maxWait) setRevealed(true);
      }
      el.style.setProperty('--forge', Math.min(1, forgeTime() / FORGE.typed).toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!seenAt) {
            seenAt = performance.now();
            // Without WebGL there's no 3D page to start the clock, so start it here.
            if (!webgl) kickForge();
          }
          if (!raf) raf = requestAnimationFrame(tick);
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0, rootMargin: '-30% 0px -30% 0px' },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [webgl]);

  useEffect(() => () => window.clearTimeout(runTimer.current), []);

  const run = () => {
    kickForge();
    setRevealed(true);
    setRunning(true);
    world.forge = 1;
    window.clearTimeout(runTimer.current);
    runTimer.current = window.setTimeout(() => {
      setRunning(false);
      world.forge = 0;
    }, 4200);
  };

  const line = stage === 'idle' || stage === 'select' ? foldex.editFrom : foldex.editTo.slice(0, typed);

  return (
    <section
      id="foldex"
      ref={section}
      className={`section fx ${revealed ? 'is-revealed' : ''} ${running ? 'is-running' : ''} ${webgl ? '' : 'fx-flat'}`}
      aria-labelledby="fx-title"
      onFocusCapture={() => setRevealed(true)}
    >
      <div className="fx-aurora" aria-hidden="true" />
      {!webgl && <FlatForge />}
      <div className="container fx-grid">
        <div className="fx-copy">
          <p className="eyebrow">
            <span className="eyebrow-index">06</span>
            <span className="eyebrow-rule" aria-hidden="true" />
            Flagship product · open source
          </p>

          <h2 id="fx-title" className="fx-title">
            <img className="fx-icon" src={`${import.meta.env.BASE_URL}foldex/icon.webp`} alt="" width="64" height="64" />
            <span>
              Fold<span className="fx-grad">ex</span>
            </span>
            <span className="fx-badge">v1.0 · Windows</span>
          </h2>

          {/* The tagline edits itself in sync with the 3D page. */}
          <p className="fx-edit">
            <span className="sr-only">{foldex.editTo}</span>
            <span className={`fx-edit-text ${stage === 'select' ? 'is-selected' : ''}`} aria-hidden="true">
              {line}
              {(stage === 'select' || stage === 'type') && <i className="fx-caret" />}
            </span>
          </p>

          <p className="fx-claim">
            Edit the text in any PDF. <span>Convert any file.</span>
          </p>
          <p className="fx-intro">{foldex.intro}</p>

          <dl className="fx-stats">
            {foldex.stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>
                  <CountUp value={s.value} suffix={s.suffix} />
                </dd>
              </div>
            ))}
            <div>
              <dt>Files uploaded</dt>
              <dd>0</dd>
            </div>
          </dl>

          <div className="fx-ribbon" aria-label="Some of the formats Foldex converts">
            {foldex.formats.map((row, r) => (
              <div key={r} className={`fx-ribbon-row ${r % 2 ? 'is-rev' : ''}`}>
                <ul>
                  {[...row, ...row].map((f, i) => (
                    <li key={`${f}-${i}`} aria-hidden={i >= row.length}>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h3 className="fx-sub">An Adobe-style toolkit, without the subscription</h3>
          <ul className="fx-caps">
            {foldex.capabilities.map((c) => (
              <li key={c.title}>
                <CapIcon name={c.icon} />
                <strong>{c.title}</strong>
                <span>{c.body}</span>
              </li>
            ))}
          </ul>

          <figure className="fx-demo">
            <div className="fx-window">
              <div className="fx-window-bar" aria-hidden="true">
                <img src={`${import.meta.env.BASE_URL}foldex/icon.webp`} alt="" width="14" height="14" />
                <span>Foldex — PDF editor</span>
                <i />
                <i />
                <i />
              </div>
              <img
                className="fx-gif"
                src={`${import.meta.env.BASE_URL}foldex/edit-text.gif`}
                alt="Clicking the heading of a PDF in Foldex, retyping it and saving"
                width="796"
                height="512"
                loading="lazy"
              />
            </div>
            <figcaption>Click a line, retype it, save — the old words are removed, not covered.</figcaption>
          </figure>

          <ul className="fx-stack" aria-label="Built with">
            {foldex.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <div className="fx-ctas">
            <a className="btn btn-primary btn-fx" href={links.foldexDownload} target="_blank" rel="noreferrer">
              <span>Download for Windows</span>
              <span aria-hidden="true">↓</span>
            </a>
            <a className="btn btn-ghost" href={links.foldex} target="_blank" rel="noreferrer">
              <span>View on GitHub</span>
              <span aria-hidden="true">↗</span>
            </a>
            <button
              type="button"
              className="btn btn-run"
              aria-pressed={running}
              onClick={run}
              onMouseEnter={() => (world.forge = 1)}
              onMouseLeave={() => (world.forge = running ? 1 : 0)}
            >
              <span className="run-dot" aria-hidden="true" />
              <span>{running ? 'Converting…' : 'Run the converter'}</span>
            </button>
          </div>

          <ul className="fx-shots" aria-label="Foldex screenshots">
            {foldex.shots.map((s) => (
              <li key={s.file}>
                <img src={`${import.meta.env.BASE_URL}foldex/${s.file}`} alt={s.alt} width={s.w} height={s.h} loading="lazy" />
              </li>
            ))}
          </ul>

          <p className="fx-credit">
            Free and MIT-licensed. Built on{' '}
            <a href={foldex.credit.href} target="_blank" rel="noreferrer">
              {foldex.credit.label}
            </a>{' '}
            by {foldex.credit.author}.
          </p>
        </div>
      </div>
    </section>
  );
}

function CapIcon({ name }: { name: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg className="fx-cap-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {name === 'edit' && (
        <g {...p}>
          <path d="M4 20h4L19 9l-4-4L4 16z" />
          <path d="M13.5 6.5l4 4" />
        </g>
      )}
      {name === 'sign' && (
        <g {...p}>
          <path d="M3 17c2-4 3-9 5-9s-1 9 2 9 3-5 5-5 1 4 3 4 2-2 3-2" />
          <path d="M3 21h18" />
        </g>
      )}
      {name === 'form' && (
        <g {...p}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 9l2 2 4-4M8 15h8" />
        </g>
      )}
      {name === 'pages' && (
        <g {...p}>
          <rect x="3" y="6" width="11" height="14" rx="2" />
          <path d="M8 3h11a2 2 0 0 1 2 2v12" />
        </g>
      )}
      {name === 'merge' && (
        <g {...p}>
          <path d="M5 4v5a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4v3M19 4v5a4 4 0 0 1-4 4" />
          <path d="M16 17l3 3 3-3" />
        </g>
      )}
      {name === 'lock' && (
        <g {...p}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </g>
      )}
      {name === 'convert' && (
        <g {...p}>
          <path d="M4 8h13l-3-3M20 16H7l3 3" />
        </g>
      )}
      {name === 'folder' && (
        <g {...p}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M8 13h8" />
        </g>
      )}
    </svg>
  );
}

/** Flat SVG forge used when WebGL is unavailable. */
function FlatForge() {
  const chips = ['PDF', 'DOCX', 'HEIC', 'MP4', 'XLSX', 'SVG', 'MP3', 'ZIP'];
  return (
    <svg className="fx-flat-art" viewBox="0 0 460 520" aria-hidden="true">
      <defs>
        <linearGradient id="fxG" x1="0" x2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <ellipse className="fx-flat-ring" cx="230" cy="260" rx="210" ry="70" fill="none" stroke="url(#fxG)" strokeOpacity=".5" />
      <g transform="translate(140 110)">
        <rect width="180" height="234" rx="12" fill="#f7f8fd" />
        <rect width="180" height="6" rx="3" fill="url(#fxG)" />
        <text x="16" y="44" fontSize="17" fontWeight="700" fill="#1e3a8a" fontFamily="Inter, Segoe UI, sans-serif">
          Service Agreement
        </text>
        {[64, 78, 92, 116, 130, 144].map((y, i) => (
          <rect key={y} x="16" y={y} width={[148, 130, 140, 70, 146, 120][i]} height="6" rx="3" fill="#cfd5e6" />
        ))}
        <path d="M18 206c6-18 12-18 12-2s10-12 16-6 6 8 12 0 10 6 22-2" fill="none" stroke="#1d3fbf" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="14" y1="214" x2="110" y2="214" stroke="#9aa3bd" />
      </g>
      {chips.map((c, i) => {
        const a = (i / chips.length) * Math.PI * 2;
        const x = 230 + Math.cos(a) * 205 - 26;
        const y = 260 + Math.sin(a) * 68 - 14;
        return (
          <g key={c} className="fx-flat-chip" style={{ animationDelay: `${-i * 0.6}s` }}>
            <rect x={x} y={y} width="52" height="28" rx="8" fill="#141b44" stroke="url(#fxG)" strokeOpacity=".7" />
            <text x={x + 26} y={y + 18.5} fontSize="11.5" fontWeight="700" fill="#e9e5ff" textAnchor="middle" fontFamily="Inter, Segoe UI, sans-serif">
              {c}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
