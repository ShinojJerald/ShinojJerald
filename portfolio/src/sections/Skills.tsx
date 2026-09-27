import { useState } from 'react';
import { skillClusters } from '../content';
import { Reveal, SectionHead } from '../components/SectionHead';
import { world } from '../lib/world';

/**
 * The toolset drawn as one connected system: every branch feeds the same hub.
 * No proficiency bars or percentages — only what I actually use.
 */
export function Skills() {
  const [active, setActive] = useState<string | null>(null);
  const n = skillClusters.length;
  const focus = (id: string | null) => {
    setActive(id);
    // Lights up the matching cluster in the 3D network behind this section.
    world.skillFocus = id ? skillClusters.findIndex((c) => c.id === id) : -1;
  };

  return (
    <section id="skills" className="section skills" aria-labelledby="skills-title">
      <div className="container">
        <SectionHead
          index="03"
          kicker="Technology"
          title={
            <span id="skills-title">
              One ecosystem, <em>many currents.</em>
            </span>
          }
          lede="The tools I work with, grouped by what they do between source and insight. Explore a group to light up its cluster."
        />

        <Reveal className={`eco ${active ? 'has-focus' : ''}`}>
          <div className="eco-hub">
            <span className="eco-hub-ring" aria-hidden="true" />
            <span className="mono-label">Hub</span>
            <strong>Insight &amp; decisions</strong>
          </div>

          <svg className="eco-links" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
            {skillClusters.map((c, i) => {
              const x = ((i + 0.5) / n) * 100;
              return (
                <path
                  key={c.id}
                  d={`M50 0 C50 34 ${x} 26 ${x} 60`}
                  className={`eco-link ${active === c.id ? 'is-on' : ''}`}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          <div className="eco-cols" style={{ ['--cols' as string]: n }}>
            {skillClusters.map((c) => (
              <div
                key={c.id}
                className={`eco-col ${active === c.id ? 'is-on' : ''}`}
                onMouseEnter={() => focus(c.id)}
                onMouseLeave={() => focus(null)}
                onFocus={() => focus(c.id)}
                onBlur={() => focus(null)}
              >
                <div className="eco-head" tabIndex={0} aria-label={`${c.label}: ${c.skills.join(', ')}`}>
                  <span className="eco-node" aria-hidden="true" />
                  <span className="eco-label">{c.label}</span>
                  <span className="eco-caption">{c.caption}</span>
                </div>
                <ul className="eco-leaves" aria-label={c.label}>
                  {c.skills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
