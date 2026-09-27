/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH FOR EVERY FACTUAL CLAIM ON THE SITE
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything rendered about Shinoj lives here so it can be audited in one place.
 *  Rules followed:
 *   • Only facts supplied by Shinoj (resume / brief) or verifiable publicly
 *     (tunekadal.com) are included.
 *   • No invented metrics, dates, employers, certifications or repositories.
 *   • Optional links (LinkedIn, email) are left empty until Shinoj fills them in —
 *     empty values are simply not rendered.
 */

export const profile = {
  name: 'Shinoj Jerald',
  role: 'Business Intelligence Analyst',
  disciplines: ['Data Analytics', 'BI', 'Python', 'SQL', 'Power BI'],
  statement:
    'I turn raw, messy data into decisions. At Navy Federal Credit Union I build the dashboards, KPI reporting and root-cause analysis that help teams see what is happening and why — and outside of work I design and ship my own products, like TuneKadal.',
  location: 'Virginia, USA',
};

export const links = {
  github: 'https://github.com/ShinojJerald',
  githubUser: 'ShinojJerald',
  profileRepo: 'https://github.com/ShinojJerald/ShinojJerald',
  portfolio: 'https://shinojjerald.github.io/ShinojJerald/',
  tunekadal: 'https://tunekadal.com/',
  tunekadalAppStore: 'https://apps.apple.com/app/id6773931613',
  // Fill these in to have them appear in the Contact section automatically.
  linkedin: '',
  email: '',
};

/* ── ABOUT — the professional story, grouped as a pipeline ─────────────────── */
export const aboutPipeline = [
  {
    step: '01',
    title: 'Collect',
    lede: 'Structured and unstructured data, gathered and aggregated.',
    detail:
      'Collecting, aggregating and analysing data from many sources — the unglamorous groundwork every trustworthy report depends on.',
  },
  {
    step: '02',
    title: 'Analyse',
    lede: 'Trends, patterns and root causes.',
    detail:
      'Identifying trends and patterns, running root-cause analysis, and forecasting potential costs, risks and profits.',
  },
  {
    step: '03',
    title: 'Visualise',
    lede: 'Dashboards and KPI reporting people actually use.',
    detail:
      'Developing and maintaining advanced reports and BI dashboards, and producing the KPI reporting that keeps teams aligned.',
  },
  {
    step: '04',
    title: 'Decide',
    lede: 'Insight translated into business action.',
    detail:
      'Communicating insights to stakeholders, answering ad-hoc reporting requests, and using analytics to support business decisions.',
  },
];

export const aboutPrinciples = [
  'Translating business requirements into precise reporting specifications',
  'Working side by side with subject-matter experts',
  'Leading small projects and initiatives end to end',
];

/* ── EXPERIENCE ─────────────────────────────────────────────────────────────── */
export type ExperienceItem = {
  org: string;
  role: string;
  period: string;
  place?: string;
  current?: boolean;
  summary: string;
  points: string[];
};

export const experience: ExperienceItem[] = [
  {
    org: 'Navy Federal Credit Union',
    role: 'Business Intelligence Analyst',
    period: 'November 2025 — Present',
    place: 'Vienna, Virginia',
    current: true,
    summary:
      'Turning organisational data into reporting, dashboards and analysis that support business decisions.',
    points: [
      'Collect, aggregate and analyse structured and unstructured data',
      'Develop and maintain advanced reports and BI dashboards',
      'Produce KPI reporting and perform root-cause analysis',
      'Forecast potential costs, risks and profits',
      'Translate business requirements into reporting specifications',
      'Respond to ad-hoc reporting requests and communicate insights to stakeholders',
      'Partner with subject-matter experts and lead small projects and initiatives',
    ],
  },
  {
    org: 'TuneKadal',
    role: 'Independent product — design & build',
    period: 'Personal project',
    summary:
      'Designed and shipped a Tamil radio app and website with 244+ stations, available on Android and iOS.',
    points: [
      'Station discovery, favourites and lock-screen / background playback',
      'AI station guide and multiple visual themes',
      'Ocean-inspired visual identity carried from app to web',
    ],
  },
];

/* ── SKILLS — a connected ecosystem. No proficiency levels are claimed. ─────── */
export type SkillCluster = { id: string; label: string; caption: string; skills: string[] };

export const skillClusters: SkillCluster[] = [
  {
    id: 'data',
    label: 'Data',
    caption: 'Storage, querying & shaping',
    skills: ['SQL', 'MySQL', 'Microsoft SQL Server', 'PostgreSQL', 'Oracle', 'NoSQL', 'ETL / ELT', 'Data Modeling', 'JSON'],
  },
  {
    id: 'bi',
    label: 'Business Intelligence',
    caption: 'Reporting & visual storytelling',
    skills: ['Power BI', 'DAX', 'Tableau', 'Excel'],
  },
  {
    id: 'code',
    label: 'Programming & Analysis',
    caption: 'Analysis at scale',
    skills: ['Python', 'R', 'PySpark', 'EDA', 'Statistical Analysis', 'Web Scraping'],
  },
  {
    id: 'cloud',
    label: 'Cloud & Platforms',
    caption: 'Where the data lives',
    skills: ['Databricks', 'AWS S3'],
  },
  {
    id: 'auto',
    label: 'Automation & Microsoft',
    caption: 'Workflows & collaboration',
    skills: ['Power Automate', 'Microsoft Dynamics 365', 'SharePoint', 'Microsoft Lists', 'Microsoft Teams'],
  },
];

/* ── PROJECTS ───────────────────────────────────────────────────────────────── */
export type Project = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  tags: string[];
  href?: string;
  hrefLabel?: string;
  anchor?: string;
};

export const projects: Project[] = [
  {
    id: 'tunekadal',
    kicker: 'Featured product',
    title: 'TuneKadal',
    body: 'An ocean of Tamil radio. 244+ stations, Android and iOS apps, and a companion website.',
    tags: ['Mobile app', 'Web', 'Audio streaming', 'Product design'],
    anchor: '#tunekadal',
    hrefLabel: 'Enter the lighthouse',
  },
  {
    id: 'bi',
    kicker: 'Professional practice',
    title: 'BI dashboards & KPI reporting',
    body: 'Advanced reports, dashboards and KPI reporting built and maintained as a Business Intelligence Analyst at Navy Federal Credit Union. Internal work — described, not shown.',
    tags: ['Power BI', 'SQL', 'KPI reporting', 'Root-cause analysis'],
    anchor: '#experience',
    hrefLabel: 'See the role',
  },
  {
    id: 'observatory',
    kicker: 'Open source',
    title: 'This observatory',
    body: 'The site you are exploring: a React, TypeScript and Three.js scene with custom shaders, device-aware rendering and a full no-WebGL fallback.',
    tags: ['React', 'TypeScript', 'Three.js', 'GLSL'],
    href: 'https://github.com/ShinojJerald/ShinojJerald',
    hrefLabel: 'View the source',
  },
];

/* ── TUNEKADAL (verified against tunekadal.com) ─────────────────────────────── */
export const tunekadal = {
  name: 'TuneKadal',
  tagline: 'Ocean of Tamil Tunes',
  tamil: 'கடல்', // "kadal" — ocean
  intro:
    'A listening experience built around Tamil radio — gathering stations from across the world into one calm, ocean-themed app.',
  stats: [
    { value: '244+', label: 'Tamil radio stations' },
    { value: '2', label: 'Platforms — Android & iOS' },
  ],
  features: [
    { title: 'Station discovery', body: 'Explore Tamil stations from around the world.' },
    { title: 'Favourites', body: 'Keep the stations you love one tap away.' },
    { title: 'Lock-screen playback', body: 'Keep listening in the background and control it from the lock screen.' },
    { title: 'AI station guide', body: 'A guide that helps you find something to listen to.' },
    { title: 'Visual themes', body: 'Multiple themes, all rooted in the ocean.' },
    { title: 'Web presence', body: 'A companion website at tunekadal.com.' },
  ],
  // Drop real screenshots into portfolio/public/tunekadal/ and list the file
  // names here (e.g. ['home.png', 'player.png']) — they will be shown in a gallery.
  screenshots: [] as string[],
};
