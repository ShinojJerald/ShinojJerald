import { useMemo, useState, type PointerEvent } from 'react';
import { certifications } from '../content';
import { Reveal, SectionHead } from '../components/SectionHead';
import { CountUp } from '../components/CountUp';
import { world } from '../lib/world';

const AREA_LABEL = { data: 'Data & analytics', ml: 'Machine learning & AI', web: 'Web' } as const;

function monogram(issuer: string) {
  return issuer
    .replace(/[^A-Za-z ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (/^[A-Z]+$/.test(w) ? w : w[0].toUpperCase()))
    .join('')
    .slice(0, 3);
}

function tilt(e: PointerEvent<HTMLElement>) {
  if (world.reducedMotion || e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty('--mx', `${x * 100}%`);
  el.style.setProperty('--my', `${y * 100}%`);
  el.style.setProperty('--rx', `${(0.5 - y) * 6}deg`);
  el.style.setProperty('--ry', `${(x - 0.5) * 8}deg`);
}

/**
 * Credentials as floating panels. Each DOM card is paired with a translucent
 * panel in the 3D scene behind it; hovering or focusing a card lifts its twin.
 */
export function Certifications() {
  const [issuer, setIssuer] = useState<string>('all');
  const issuers = useMemo(() => {
    const m = new Map<string, number>();
    certifications.forEach((c) => m.set(c.issuer, (m.get(c.issuer) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, []);
  const indexed = certifications.map((c, i) => ({ ...c, i }));
  const shown = indexed.filter((c) => issuer === 'all' || c.issuer === issuer);
  const focus = (i: number) => (world.credFocus = i);

  return (
    <section id="certifications" className="section certs" aria-labelledby="certs-title">
      <div className="container">
        <SectionHead
          index="06"
          kicker="Credentials"
          title={
            <span id="certs-title">
              Always <em>calibrating.</em>
            </span>
          }
        />

        <Reveal className="certs-summary">
          <div className="certs-count">
            <CountUp value={certifications.length} className="certs-num" />
            <span className="mono-label">Certifications</span>
          </div>
          <div className="certs-count">
            <CountUp value={issuers.length} className="certs-num" />
            <span className="mono-label">Issuers</span>
          </div>
          <div className="certs-issuers" role="group" aria-label="Filter by issuer">
            <button type="button" aria-pressed={issuer === 'all'} onClick={() => setIssuer('all')}>
              All
            </button>
            {issuers.map(([name, n]) => (
              <button key={name} type="button" aria-pressed={issuer === name} onClick={() => setIssuer(name)}>
                {name} <span>{n}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <ul className="cred-grid">
          {shown.map((c, k) => {
            const inner = (
              <>
                <span className="cred-seal" aria-hidden="true">
                  <span>{monogram(c.issuer)}</span>
                </span>
                <span className="cred-body">
                  <span className="cred-area">{AREA_LABEL[c.area]}</span>
                  <span className="cred-name">{c.name}</span>
                  <span className="cred-issuer">
                    {c.issuer}
                    {c.year && <span> · {c.year}</span>}
                  </span>
                </span>
                {c.url && (
                  <span className="cred-verify" aria-hidden="true">
                    Verify ↗
                  </span>
                )}
              </>
            );
            const handlers = {
              onPointerMove: tilt,
              onPointerEnter: () => focus(c.i),
              onPointerLeave: (e: PointerEvent<HTMLElement>) => {
                e.currentTarget.style.setProperty('--rx', '0deg');
                e.currentTarget.style.setProperty('--ry', '0deg');
                focus(-1);
              },
              onFocus: () => focus(c.i),
              onBlur: () => focus(-1),
            };
            return (
              <li key={c.name} className="cred-cell" style={{ ['--i' as string]: k }}>
                {c.url ? (
                  <a className={`cred a-${c.area}`} href={c.url} target="_blank" rel="noreferrer" {...handlers}>
                    {inner}
                  </a>
                ) : (
                  <div className={`cred a-${c.area}`} tabIndex={0} {...handlers}>
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
