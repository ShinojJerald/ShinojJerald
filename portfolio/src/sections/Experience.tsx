import { useEffect, useRef, useState } from 'react';
import { education, experience } from '../content';
import { CountUp } from '../components/CountUp';
import { Reveal, SectionHead } from '../components/SectionHead';
import { world } from '../lib/world';

/**
 * Professional journey. The current role is a prominent panel at the head of
 * the current; earlier roles are nodes further along it. The line fills as the
 * visitor scrolls, and each node lights up as the fill reaches it.
 */
export function ExperienceSection() {
  const stream = useRef<HTMLDivElement>(null);
  const [openCurrent, setOpenCurrent] = useState(false);
  const [open, setOpen] = useState<number>(-1);
  const [current, ...earlier] = experience;

  useEffect(() => {
    const el = stream.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / Math.max(1, r.height)));
      el.style.setProperty('--prog', world.reducedMotion ? '1' : p.toFixed(4));
      el.querySelectorAll<HTMLElement>('[data-node]').forEach((n) => {
        const nr = n.getBoundingClientRect();
        n.classList.toggle('is-passed', world.reducedMotion || nr.top < vh * 0.62);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section id="experience" className="section experience" aria-labelledby="exp-title">
      <div className="container">
        <SectionHead
          index="02"
          kicker="Professional journey"
          title={
            <span id="exp-title">
              The current <em>I follow.</em>
            </span>
          }
          lede="Since 2016 — data analysis, machine learning and teaching, then analytics at Capital One, and now business intelligence at Navy Federal."
        />

        <div className="journey" ref={stream}>
          <span className="journey-line" aria-hidden="true">
            <i className="journey-fill" />
            <i className="journey-spark" />
          </span>

          <ol className="journey-list">
            <li className="journey-item journey-current" data-node>
              <span className="journey-node is-current" aria-hidden="true" />
              <Reveal className="now-card glass">
                <div className="now-top">
                  <span className="tag-live">Now</span>
                  {current.period && <span className="now-period">{current.period}</span>}
                </div>
                <h3 className="now-role">{current.role}</h3>
                <p className="now-org">
                  {current.org}
                  {current.place && <span> · {current.place}</span>}
                </p>
                {current.summary && <p className="now-summary">{current.summary}</p>}
                {current.capabilities && (
                  <ul className="now-caps" aria-label="Capabilities">
                    {current.capabilities.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}
                {current.points && current.points.length > 0 && (
                  <>
                    <button type="button" className="now-toggle" aria-expanded={openCurrent} aria-controls="now-points" onClick={() => setOpenCurrent((o) => !o)}>
                      {openCurrent ? 'Hide responsibilities' : 'View responsibilities'}
                      <span className={`chev ${openCurrent ? 'is-open' : ''}`} aria-hidden="true" />
                    </button>
                    <ul id="now-points" className="now-points" hidden={!openCurrent}>
                      {current.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </>
                )}
              </Reveal>
            </li>

            {earlier.map((e, i) => {
              const expandable = Boolean(e.points?.length || e.highlights?.length);
              const isOpen = open === i;
              const head = (
                <>
                  {e.period && <span className="past-period">{e.period}</span>}
                  <span className="past-role">{e.role}</span>
                  <span className="past-org">
                    {e.org}
                    {e.place && <span className="stream-place"> · {e.place}</span>}
                  </span>
                  {e.summary && <span className="past-summary">{e.summary}</span>}
                  {expandable && <span className={`chev ${isOpen ? 'is-open' : ''}`} aria-hidden="true" />}
                </>
              );
              return (
                <li key={e.org + e.role} className="journey-item" data-node>
                  <span className="journey-node" aria-hidden="true" />
                  <Reveal className="past" delay={i * 70}>
                    {expandable ? (
                      <button type="button" className="past-head" aria-expanded={isOpen} aria-controls={`past-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                        {head}
                      </button>
                    ) : (
                      <div className="past-head">{head}</div>
                    )}
                    {expandable && (
                      <div id={`past-${i}`} className="past-panel" hidden={!isOpen}>
                        {e.highlights && (
                          <dl className="past-stats">
                            {e.highlights.map((h) => (
                              <div key={h.label}>
                                <dt>{h.label}</dt>
                                <dd>{isOpen ? <CountUp value={h.value} suffix={h.suffix} duration={1100} /> : `${h.value}${h.suffix ?? ''}`}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        {e.points && (
                          <ul>
                            {e.points.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>

        <Reveal className="edu">
          <span className="mono-label">Education</span>
          <ul>
            {education.map((ed) => (
              <li key={ed.school}>
                <span className="edu-degree">{ed.degree}</span>
                <span className="edu-school">{ed.school}</span>
                {ed.period && <span className="edu-period">{ed.period}</span>}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
