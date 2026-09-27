import { useEffect, useRef, useState } from 'react';
import { links, tunekadal } from '../content';
import { beamFacing, world } from '../lib/world';

/**
 * The lighthouse sequence. The copy waits in the dark; when the sweeping beam
 * (same clock as the 3D lighthouse) passes over the viewer, it is revealed and
 * stays revealed. Keyboard focus, the lamp button, reduced motion, or a short
 * timeout all reveal it immediately, so nothing is ever hidden from anyone.
 */
export function TuneKadal({ webgl }: { webgl: boolean }) {
  const section = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let raf = 0;
    let visible = false;
    let seenAt = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !seenAt) seenAt = performance.now();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    const tick = () => {
      const f = beamFacing();
      el.style.setProperty('--beam', f.toFixed(3));
      if (visible) {
        const waited = performance.now() - seenAt;
        if (world.reducedMotion || f > 0.9 || waited > 4200) setRevealed(true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    world.lighthouse = lit ? 1 : 0;
    if (lit) setRevealed(true);
  }, [lit]);

  return (
    <section
      id="tunekadal"
      ref={section}
      className={`section tk ${revealed ? 'is-revealed' : ''} ${lit ? 'is-lit' : ''} ${webgl ? '' : 'tk-flat'}`}
      aria-labelledby="tk-title"
      onFocusCapture={() => setRevealed(true)}
    >
      <div className="tk-sweep" aria-hidden="true" />
      {!webgl && <FlatLighthouse />}
      <div className="container tk-grid">
        <div className="tk-copy">
          <p className="eyebrow">
            <span className="eyebrow-index">05</span>
            <span className="eyebrow-rule" aria-hidden="true" />
            Featured product
          </p>
          <h2 id="tk-title" className="tk-title">
            {tunekadal.name}
            <span className="tk-tamil" lang="ta" title="kadal — ocean">
              {tunekadal.tamil}
            </span>
          </h2>
          <p className="tk-tagline">{tunekadal.tagline}</p>
          <p className="tk-intro">{tunekadal.intro}</p>

          <dl className="tk-stats">
            {tunekadal.stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="tk-wave" aria-hidden="true">
            {Array.from({ length: 48 }).map((_, i) => (
              <i key={i} style={{ animationDelay: `${-(i * 0.09).toFixed(2)}s`, height: `${20 + ((i * 37) % 60)}%` }} />
            ))}
          </div>

          <ul className="tk-features">
            {tunekadal.features.map((f) => (
              <li key={f.title}>
                <strong>{f.title}</strong>
                <span>{f.body}</span>
              </li>
            ))}
          </ul>

          <div className="tk-ctas">
            <a className="btn btn-primary" href={links.tunekadal} target="_blank" rel="noreferrer">
              <span>Visit tunekadal.com</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a className="btn btn-ghost" href={links.tunekadalAppStore} target="_blank" rel="noreferrer">
              <span>App Store</span>
              <span aria-hidden="true">↗</span>
            </a>
            <button
              type="button"
              className="btn btn-lamp"
              aria-pressed={lit}
              onClick={() => setLit((l) => !l)}
              onMouseEnter={() => (world.lighthouse = 1)}
              onMouseLeave={() => (world.lighthouse = lit ? 1 : 0)}
            >
              <span className="lamp-dot" aria-hidden="true" />
              <span>{lit ? 'Lamp lit' : 'Light the lamp'}</span>
            </button>
          </div>

          {tunekadal.screenshots.length > 0 && (
            <ul className="tk-shots" aria-label="TuneKadal screenshots">
              {tunekadal.screenshots.map((s) => (
                <li key={s}>
                  <img src={`${import.meta.env.BASE_URL}tunekadal/${s}`} alt={`TuneKadal screenshot: ${s.replace(/\.[a-z]+$/, '')}`} loading="lazy" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/** Flat SVG lighthouse used when WebGL is unavailable. */
function FlatLighthouse() {
  return (
    <svg className="tk-flat-art" viewBox="0 0 400 520" aria-hidden="true">
      <defs>
        <linearGradient id="fBeam" x1="0" x2="1">
          <stop offset="0" stopColor="#fff4dc" stopOpacity=".45" />
          <stop offset="1" stopColor="#6fdcff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="tk-flat-beam">
        <polygon points="220,150 620,40 620,260" fill="url(#fBeam)" />
        <polygon points="220,150 -180,40 -180,260" fill="url(#fBeam)" />
      </g>
      <path d="M40 470 Q140 430 220 450 T400 440 V520 H0 V480Z" fill="#0a2238" />
      <path d="M198 452 L206 170 H234 L242 452 Z" fill="#dbe7f1" />
      <path d="M201.5 330 L203.3 262 H236.7 L238.5 330 Z M199.5 420 L200.7 380 H239.3 L240.5 420 Z" fill="#1e5f8c" />
      <rect x="196" y="164" width="48" height="8" fill="#0e2740" />
      <rect x="208" y="134" width="24" height="30" fill="#fff4dc" />
      <path d="M202 134 L220 112 L238 134 Z" fill="#0e2740" />
    </svg>
  );
}
