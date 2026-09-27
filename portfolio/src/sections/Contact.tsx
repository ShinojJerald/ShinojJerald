import { links, profile } from '../content';
import { Reveal } from '../components/SectionHead';

export function Contact() {
  const items = [
    { label: 'GitHub', value: `github.com/${links.githubUser}`, href: links.github },
    links.linkedin && { label: 'LinkedIn', value: links.linkedin.replace(/^https?:\/\/(www\.)?/, ''), href: links.linkedin },
    links.email && { label: 'Email', value: links.email, href: `mailto:${links.email}` },
    { label: 'TuneKadal', value: 'tunekadal.com', href: links.tunekadal },
    { label: 'Source', value: 'This portfolio on GitHub', href: links.profileRepo },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container contact-inner">
        <Reveal>
          <p className="eyebrow">
            <span className="eyebrow-index">08</span>
            <span className="eyebrow-rule" aria-hidden="true" />
            Contact
          </p>
          <h2 id="contact-title" className="contact-title">
            Let’s make the data <em>speak.</em>
          </h2>
          <p className="section-lede">Open to conversations about analytics, business intelligence and building useful things.</p>
        </Reveal>
        <Reveal as="div" className="contact-links" delay={120}>
          <ul>
            {items.map((it) => (
              <li key={it.label}>
                <a href={it.href} target={it.href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
                  <span className="contact-label">{it.label}</span>
                  <span className="contact-value">{it.value}</span>
                  <span className="contact-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <footer className="footer">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Built with React, TypeScript &amp; Three.js</span>
        <a href="#home">Back to the surface ↑</a>
      </footer>
    </section>
  );
}
