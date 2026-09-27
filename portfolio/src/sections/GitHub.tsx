import { useEffect, useState } from 'react';
import { links } from '../content';
import { Reveal, SectionHead } from '../components/SectionHead';

type Repo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  stargazers_count: number;
};

type State = { status: 'loading' } | { status: 'ok'; repos: Repo[] } | { status: 'error' };

const CACHE_KEY = 'sj-gh-repos-v1';

/**
 * Public repositories are read live from GitHub's unauthenticated REST API —
 * no token, no secrets. Results are cached for the session to stay far under
 * the anonymous rate limit. If the API is unreachable, only verified static
 * links are shown; nothing is ever made up.
 */
function useRepos(user: string): State {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        setState({ status: 'ok', repos: JSON.parse(cached) as Repo[] });
        return;
      }
    } catch {
      /* storage unavailable — fetch instead */
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 6000);
    fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=30`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<Repo[]>) : Promise.reject(new Error(String(r.status)))))
      .then((all) => {
        const repos = all.filter((r) => !r.fork && !r.archived).slice(0, 6);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(repos));
        } catch {
          /* ignore */
        }
        if (!cancelled) setState({ status: 'ok', repos });
      })
      .catch(() => !cancelled && setState({ status: 'error' }))
      .finally(() => window.clearTimeout(timer));
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [user]);
  return state;
}

const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

export function GitHub() {
  const state = useRepos(links.githubUser);
  return (
    <section id="github" className="section gh" aria-labelledby="gh-title">
      <div className="container">
        <SectionHead
          index="07"
          kicker="GitHub · Open source"
          title={
            <span id="gh-title">
              Working <em>in the open.</em>
            </span>
          }
        />

        <div className="gh-grid">
          <Reveal className="gh-profile glass">
            <img
              className="gh-avatar"
              src={`https://github.com/${links.githubUser}.png?size=160`}
              alt=""
              width={72}
              height={72}
              loading="lazy"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
            <div>
              <span className="mono-label">GitHub</span>
              <p className="gh-handle">{links.githubUser}</p>
              <a className="card-link" href={links.github} target="_blank" rel="noreferrer">
                github.com/{links.githubUser} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </Reveal>

          <Reveal className="gh-repos" delay={100}>
            <div className="gh-repos-head">
              <span className="mono-label">Public repositories</span>
              <span className="gh-source">
                <span className={`gh-status gh-status-${state.status}`} aria-hidden="true" />
                {state.status === 'loading' ? 'Reading GitHub API…' : state.status === 'ok' ? 'Live from the GitHub API' : 'GitHub API unavailable'}
              </span>
            </div>

            {state.status === 'ok' && state.repos.length > 0 ? (
              <ul className="repo-list">
                {state.repos.map((r) => (
                  <li key={r.name}>
                    <a href={r.html_url} target="_blank" rel="noreferrer" className="repo">
                      <span className="repo-name">{r.name}</span>
                      {r.description && <span className="repo-desc">{r.description}</span>}
                      <span className="repo-meta">
                        {r.language && <span>{r.language}</span>}
                        <span>Updated {fmt.format(new Date(r.pushed_at))}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : state.status === 'loading' ? (
              <ul className="repo-list is-loading" aria-hidden="true">
                <li className="repo-skeleton" />
                <li className="repo-skeleton" />
              </ul>
            ) : (
              <ul className="repo-list">
                <li>
                  <a href={links.profileRepo} target="_blank" rel="noreferrer" className="repo">
                    <span className="repo-name">ShinojJerald</span>
                    <span className="repo-desc">Profile README and the source code of this 3D portfolio.</span>
                  </a>
                </li>
              </ul>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
