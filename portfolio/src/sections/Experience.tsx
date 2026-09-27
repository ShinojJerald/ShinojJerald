import { useState } from 'react';
import { experience } from '../content';
import { Reveal, SectionHead } from '../components/SectionHead';

export function ExperienceSection() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section id="experience" className="section experience" aria-labelledby="exp-title">
      <div className="container">
        <SectionHead
          index="02"
          kicker="Experience"
          title={
            <span id="exp-title">
              The current <em>I follow.</em>
            </span>
          }
          lede="Select a node to open it."
        />
        <div className="stream">
          <span className="stream-line" aria-hidden="true">
            <i />
          </span>
          <ol className="stream-list">
          {experience.map((e, i) => {
            const isOpen = open === i;
            return (
              <Reveal as="li" key={e.org} className={`stream-item ${isOpen ? 'is-open' : ''}`} delay={i * 90}>
                <span className={`stream-node ${e.current ? 'is-current' : ''}`} aria-hidden="true" />
                <button
                  type="button"
                  className="stream-head"
                  aria-expanded={isOpen}
                  aria-controls={`exp-panel-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span className="stream-period">
                    {e.current && <span className="tag-live">Now</span>}
                    {e.period}
                  </span>
                  <span className="stream-role">{e.role}</span>
                  <span className="stream-org">
                    {e.org}
                    {e.place ? <span className="stream-place"> · {e.place}</span> : null}
                  </span>
                  <span className="stream-chevron" aria-hidden="true" />
                </button>
                <div className="stream-panel" id={`exp-panel-${i}`} hidden={!isOpen}>
                  <div className="stream-panel-inner glass">
                    <p className="stream-summary">{e.summary}</p>
                    <ul>
                      {e.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
          </ol>
        </div>
      </div>
    </section>
  );
}
