import { links, profile } from '../content';

export function Hero() {
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <p className="hero-kicker">
          <span className="pulse" aria-hidden="true" />
          Data observatory · {profile.location}
        </p>
        <h1 id="hero-title" className="hero-title">
          <span className="hero-line">Shinoj</span>{' '}
          <span className="hero-line hero-line-2">Jerald</span>
        </h1>
        <p className="hero-role">{profile.role}</p>
        <ul className="hero-disciplines" aria-label="Disciplines">
          {profile.disciplines.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <a className="hero-now" href="#about">
          <span className="tag-live">Now</span>
          <span className="hero-now-org">{profile.current.org}</span>
          <span className="hero-now-period">{profile.current.period}</span>
        </a>
        <p className="hero-statement">{profile.statement}</p>
        <div className="hero-ctas">
          <a className="btn btn-primary" href="#about">
            <span>Enter the portfolio</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 4v16m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a className="btn btn-ghost" href={links.github} target="_blank" rel="noreferrer">
            <span>View GitHub</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
              <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
        <ul className="hero-links" aria-label="Profiles">
          <li>
            <a href={links.github} target="_blank" rel="noreferrer">GitHub</a>
          </li>
          {links.linkedin && (
            <li>
              <a href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            </li>
          )}
          <li>
            <a href={links.tunekadal} target="_blank" rel="noreferrer">TuneKadal</a>
          </li>
          <li>
            <a href="#certifications">Credentials</a>
          </li>
        </ul>
      </div>

      <div className="hero-scroll" aria-hidden="true">
        <span>Scroll to descend</span>
        <i />
      </div>
    </section>
  );
}
