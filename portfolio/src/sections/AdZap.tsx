import { useEffect, useRef, useState } from 'react';
import { adzap, links } from '../content';
import { world } from '../lib/world';
import { CountUp } from '../components/CountUp';

/** The demo's own playback: switch sites on one by one, hold, then clear. */
const AUTO: number[] = [0, 0b000001, 0b000101, 0b001101, 0b001101, 0b001101, 0];
const AUTO_STEP = 1700; // ms per step
/** What reduced motion (or no animation) shows: three of six sites zapped. */
const STILL = 0b001101;

const bits = (m: number) => adzap.sites.reduce((n, _, i) => n + ((m >> i) & 1), 0);

/**
 * AdZap — the third flagship. A row of example sites with per-site switches,
 * shared with the 3D "zap field": switching a site on strikes its window with
 * the bolt and its ad boxes burn away; every other window keeps its ads. The
 * demo plays itself until the visitor takes over the switches.
 */
export function AdZap({ webgl }: { webgl: boolean }) {
  const section = useRef<HTMLElement>(null);
  const [mask, setMask] = useState(0);
  const [touched, setTouched] = useState(false);
  const [inView, setInView] = useState(false);

  // Share the switch state with the 3D scene.
  useEffect(() => {
    world.zapMask = mask;
  }, [mask]);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0, rootMargin: '-25% 0px -25% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Self-playing demo while in view, until the visitor uses a switch.
  useEffect(() => {
    if (touched || !inView) return;
    if (world.reducedMotion) {
      setMask(STILL);
      return;
    }
    let step = 0;
    setMask(AUTO[0]);
    const id = window.setInterval(() => {
      step = (step + 1) % AUTO.length;
      setMask(AUTO[step]);
    }, AUTO_STEP);
    return () => window.clearInterval(id);
  }, [touched, inView]);

  const toggle = (i: number) => {
    setTouched(true);
    setMask((m) => m ^ (1 << i));
  };

  const n = bits(mask);

  return (
    <section id="adzap" ref={section} className={`section az ${webgl ? '' : 'az-flat'}`} aria-labelledby="az-title">
      <div className="az-aurora" aria-hidden="true" />
      {!webgl && <FlatZap mask={mask} />}
      <div className="container az-grid">
        <div className="az-copy">
          <p className="eyebrow">
            <span className="eyebrow-index">07</span>
            <span className="eyebrow-rule" aria-hidden="true" />
            Flagship product · Chrome extension
          </p>

          <h2 id="az-title" className="az-title">
            <img className="az-icon" src={`${import.meta.env.BASE_URL}adzap/icon.svg`} alt="" width="64" height="64" />
            <span>
              Ad<span className="az-grad">Zap</span>
            </span>
            <span className="az-badge">v1.3 · Chrome</span>
          </h2>

          <p className="az-claim">
            Choose the sites. <span>Zap the ads.</span>
          </p>
          <p className="az-intro">{adzap.intro}</p>

          <div className="az-demo">
            <div className="az-demo-head">
              <span className="mono-label">Try it · pick the sites to zap</span>
              <span className="az-count" aria-live="polite">
                {n} of {adzap.sites.length} zapped
              </span>
            </div>
            <ul className="az-sites">
              {adzap.sites.map((s, i) => {
                const on = ((mask >> i) & 1) === 1;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`Zap ${s}`}
                      className={`az-site ${on ? 'is-on' : ''}`}
                      onClick={() => toggle(i)}
                      onPointerEnter={() => (world.zapHover = i)}
                      onPointerLeave={() => (world.zapHover = -1)}
                      onFocus={() => (world.zapHover = i)}
                      onBlur={() => (world.zapHover = -1)}
                    >
                      <span className="az-site-name">{s}</span>
                      <span className="az-site-state" aria-hidden="true">
                        {on ? 'Zapped' : 'Ads'}
                      </span>
                      <span className="az-switch" aria-hidden="true">
                        <i />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="az-demo-note">
              A demo using example addresses. In Chrome, a site is zapped from the AdZap bolt in the toolbar; sites you leave off are not filtered.
            </p>
          </div>

          <dl className="az-stats">
            {adzap.stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>
                  <CountUp value={s.value} suffix={s.suffix} group />
                </dd>
              </div>
            ))}
          </dl>

          <ul className="az-feats">
            {adzap.features.map((f) => (
              <li key={f.title}>
                <FeatIcon name={f.icon} />
                <strong>{f.title}</strong>
                <span>{f.body}</span>
              </li>
            ))}
          </ul>

          <ul className="az-stack" aria-label="Built with">
            {adzap.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <div className="az-ctas">
            <a className="btn btn-primary btn-az" href={links.adzapDownload} target="_blank" rel="noreferrer">
              <span>Add to Chrome</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a className="btn btn-ghost" href={links.adzap} target="_blank" rel="noreferrer">
              <span>Product page</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a className="btn btn-ghost" href={links.adzapRepo} target="_blank" rel="noreferrer">
              <span>GitHub</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <p className="az-credit">
            Free · in the Chrome Web Store, published by TuneKadal. Blocking rules are compiled from EasyList and EasyPrivacy by{' '}
            <a href={adzap.credit.href} target="_blank" rel="noreferrer">
              {adzap.credit.label}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

function FeatIcon({ name }: { name: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg className="az-feat-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {name === 'ads' && (
        <g {...p}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M4 4l16 16" />
        </g>
      )}
      {name === 'track' && (
        <g {...p}>
          <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" />
          <circle cx="12" cy="12" r="2.6" />
          <path d="M4 4l16 16" />
        </g>
      )}
      {name === 'bell' && (
        <g {...p}>
          <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z" />
          <path d="M10 21h4M3 3l18 18" />
        </g>
      )}
      {name === 'hide' && (
        <g {...p}>
          <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />
          <path d="M9 12h6" />
        </g>
      )}
      {name === 'undo' && (
        <g {...p}>
          <path d="M9 7H4V2" />
          <path d="M4 7a9 9 0 1 1-1 7" />
        </g>
      )}
      {name === 'local' && (
        <g {...p}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
          <path d="M9 10l2 2 4-4" />
        </g>
      )}
    </svg>
  );
}

/** Flat SVG version of the zap field, used when WebGL is unavailable. */
function FlatZap({ mask }: { mask: number }) {
  const spots = [
    [40, 60],
    [250, 30],
    [40, 220],
    [250, 200],
    [40, 380],
    [250, 370],
  ];
  return (
    <svg className="az-flat-art" viewBox="0 0 460 520" aria-hidden="true">
      <defs>
        <linearGradient id="azG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#a35cff" />
        </linearGradient>
      </defs>
      {spots.map(([x, y], i) => {
        const on = ((mask >> i) & 1) === 1;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <rect width="170" height="118" rx="10" fill="#120d28" stroke={on ? '#34d399' : '#3a3168'} />
            <rect width="170" height="20" rx="10" fill="#1d1640" />
            <text x="12" y="14" fontSize="9" fill="#9d97c0" fontFamily="JetBrains Mono, monospace">
              {adzap.sites[i]}
            </text>
            {[34, 46, 58].map((ly) => (
              <rect key={ly} x="12" y={ly} width="80" height="5" rx="2.5" fill="#2a2350" />
            ))}
            <g className="az-flat-ads" style={{ opacity: on ? 0 : 1 }}>
              <rect x="104" y="30" width="54" height="34" rx="5" fill="#241c48" stroke="#f87171" strokeDasharray="3 3" />
              <rect x="104" y="72" width="54" height="34" rx="5" fill="#241c48" stroke="#f87171" strokeDasharray="3 3" />
            </g>
            {on && <rect x="110" y="6" width="50" height="10" rx="5" fill="#34d399" />}
          </g>
        );
      })}
      <g transform="translate(200 230) scale(2.6)">
        <path d="M13 2 4.5 13.5h5.2L8.6 22l9.9-12.2h-5.6L13 2z" fill="url(#azG)" />
      </g>
    </svg>
  );
}
