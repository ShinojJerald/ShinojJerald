import { useState } from 'react';
import { aboutPipeline, aboutPrinciples, experience } from '../content';
import { Reveal, SectionHead } from '../components/SectionHead';

export function About() {
  const [active, setActive] = useState(0);
  const current = experience[0];
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="container">
        <SectionHead
          index="01"
          kicker="Profile"
          title={
            <span id="about-title">
              From raw signal <em>to decision.</em>
            </span>
          }
          lede="My work sits between the data and the people who need to act on it. Every report starts as noise and has to end as something a stakeholder can trust."
        />

        <Reveal className="pipeline">
          <div className="pipeline-track" aria-hidden="true">
            <svg viewBox="0 0 1000 8" preserveAspectRatio="none">
              <line x1="0" y1="4" x2="1000" y2="4" className="pipeline-base" />
              <line x1="0" y1="4" x2="1000" y2="4" className="pipeline-flow" />
            </svg>
          </div>
          <ol className="pipeline-steps">
            {aboutPipeline.map((p, i) => (
              <li key={p.step} className={i === active ? 'is-active' : undefined}>
                <button
                  type="button"
                  className="pipe-node"
                  aria-expanded={i === active}
                  aria-controls={`pipe-detail-${i}`}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                >
                  <span className="pipe-dot" aria-hidden="true" />
                  <span className="pipe-step">{p.step}</span>
                  <span className="pipe-title">{p.title}</span>
                  <span className="pipe-lede">{p.lede}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="pipe-detail glass" id={`pipe-detail-${active}`} role="region" aria-live="polite">
            <span className="mono-label">
              Stage {aboutPipeline[active].step} — {aboutPipeline[active].title}
            </span>
            <p>{aboutPipeline[active].detail}</p>
          </div>
        </Reveal>

        <div className="about-grid">
          <Reveal className="about-now glass" delay={80}>
            <span className="mono-label">Currently</span>
            <p className="about-now-role">{current.role}</p>
            <p className="about-now-org">{current.org}</p>
            <p className="about-now-meta">
              {current.place} · {current.period}
            </p>
          </Reveal>
          <Reveal className="about-principles" delay={160}>
            <span className="mono-label">How I work</span>
            <ul>
              {aboutPrinciples.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
