/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH FOR EVERY FACTUAL CLAIM ON THE SITE
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything rendered about Shinoj lives here so it can be audited in one place.
 *
 *  Sources:
 *   • Shinoj's brief (roles, responsibilities, skills, certifications, project names)
 *   • Shinoj's LinkedIn profile export (dates, locations, role descriptions, education)
 *   • Public GitHub repositories of github.com/ShinojJerald (repo links + their own
 *     descriptions, quoted or lightly shortened)
 *   • tunekadal.com (TuneKadal features and store link)
 *
 *  Rules:
 *   • No invented metrics, dates, employers, certifications, URLs or repositories.
 *   • Optional fields (dates, years, credential URLs, LinkedIn, email) stay empty
 *     until verified — empty values are simply not rendered.
 */

export const profile = {
  name: 'Shinoj Jerald',
  role: 'Business Intelligence Analyst',
  disciplines: ['Data Analytics', 'BI', 'Python', 'SQL', 'Power BI'],
  statement:
    'I turn raw, messy data into decisions — the dashboards, KPI reporting and root-cause analysis that show teams what is happening and why.',
  current: { org: 'Navy Federal Credit Union', period: 'Nov 2025 — Present' },
  location: 'Virginia, USA',
};

export const links = {
  github: 'https://github.com/ShinojJerald',
  githubUser: 'ShinojJerald',
  profileRepo: 'https://github.com/ShinojJerald/ShinojJerald',
  portfolio: 'https://shinojjerald.github.io/ShinojJerald/',
  tunekadal: 'https://tunekadal.com/',
  tunekadalAppStore: 'https://apps.apple.com/app/id6773931613',
  // Fill these in to have them appear in the hero and Contact section automatically.
  linkedin: 'https://www.linkedin.com/in/shinoj-kumar-2a1670176',
  email: '',
};

const repo = (name: string) => `https://github.com/ShinojJerald/${name}`;

/* ── CURRENT WORK — the professional story, grouped as a pipeline ──────────── */
export const aboutPipeline = [
  {
    step: '01',
    title: 'Collect',
    lede: 'Structured and unstructured data, gathered and aggregated.',
    detail:
      'Collecting, aggregating and analysing data from multiple structured and unstructured sources — the groundwork every trustworthy report depends on.',
  },
  {
    step: '02',
    title: 'Analyse',
    lede: 'Trends, patterns and root causes.',
    detail:
      'Identifying trends and patterns, supporting root-cause analysis, and spotting opportunities for operational improvement.',
  },
  {
    step: '03',
    title: 'Visualise',
    lede: 'Dashboards and KPI reporting people actually use.',
    detail:
      'Developing and maintaining advanced reporting, dashboards and BI solutions, and producing ongoing KPI reports and data visualisations.',
  },
  {
    step: '04',
    title: 'Decide',
    lede: 'Insight translated into business action.',
    detail:
      'Using analytics and metrics to support process improvement and data-driven forecasts of costs, risks and business initiatives — and communicating findings to stakeholders.',
  },
];

export const aboutPrinciples = [
  'Translating business requirements into report and analysis specifications',
  'Working with team members and subject-matter experts',
  'Supporting ad-hoc reporting requests',
  'Leading small projects and initiatives',
];

/* ── PROFESSIONAL JOURNEY (dates, places and details from LinkedIn) ────────── */
export type Highlight = { value: number; prefix?: string; suffix?: string; label: string };
export type ExperienceItem = {
  org: string;
  role: string;
  /** Leave empty until verified — nothing is rendered for an empty period. */
  period?: string;
  years?: string;
  place?: string;
  current?: boolean;
  summary?: string;
  /** Capabilities shown as chips on the current role. */
  capabilities?: string[];
  /** Figures exactly as stated on LinkedIn. */
  highlights?: Highlight[];
  points?: string[];
};

// Same order as LinkedIn (most recent end date first).
export const experience: ExperienceItem[] = [
  {
    org: 'Navy Federal Credit Union',
    role: 'Business Intelligence Analyst',
    period: 'November 2025 — Present',
    years: '2025 —',
    place: 'Vienna, Virginia',
    current: true,
    summary: 'Reporting, dashboards and analysis that support business decisions.',
    capabilities: ['BI dashboards', 'KPI reporting', 'Root-cause analysis', 'Forecasting', 'Stakeholder insights', 'Requirements → report specs'],
    points: [
      'Collect, aggregate and analyse data from multiple structured and unstructured sources',
      'Develop and maintain advanced reporting, dashboards and BI solutions',
      'Produce KPI reports, identify operational improvement opportunities and support root-cause analysis',
      'Use analytics and metrics to support process improvement and forecasts of costs, risks and initiatives',
      'Translate business requirements into report and analysis specifications',
      'Communicate findings to stakeholders, support ad-hoc requests and lead small initiatives',
    ],
  },
  {
    org: 'Capital One',
    role: 'Data Analyst',
    period: 'March 2022 — November 2025',
    years: '2022 — 2025',
    place: 'McLean, Virginia',
    summary: 'Requirements, data structures, data-quality validation and management reporting.',
    points: [
      'Worked with business users to gather requirements across BI analysis, marketing campaigns and customer account management',
      'Designed, developed and administered transactional and analytical data structures, and moved data across production systems and platforms',
      'Designed and executed validation test cases for data sanity and quality checks through the data pipeline, supporting legal compliance and fair-treatment principles',
      'Created monthly management reports on team activity in support of service-level objectives and product decisions',
      'Collaborated with clients at all levels of the organisation',
    ],
  },
  {
    org: 'Sagence, Inc.',
    role: 'Data Analyst',
    period: 'March 2021 — February 2022',
    years: '2021 — 2022',
    place: 'Chicago, Illinois',
    summary: 'Tableau dashboards, KPI reporting for executive management and a migration to AWS Redshift.',
    highlights: [
      { value: 20, suffix: '+', label: 'Interactive Tableau dashboards' },
      { value: 5, suffix: '+', label: 'Databases consolidated' },
      { value: 15, suffix: '%', label: 'Improvement in data accuracy' },
      { value: 10, suffix: '+', label: 'Sources migrated to AWS Redshift' },
      { value: 20, suffix: '%', label: 'Lower infrastructure costs' },
    ],
    points: [
      'Gathered, analysed and documented business requirements from client input and feedback',
      'Analysed data to detect anomalies and trends and generate insights',
      'Built 20+ interactive Tableau dashboards used by business units to monitor KPIs',
      'Consolidated, validated and cleaned data from 5+ databases into weekly and monthly executive reports — a 15% improvement in data accuracy',
      'Migrated 10+ data sources to AWS Redshift — a 20% reduction in infrastructure costs and faster processing',
      'Developed calculated metrics for multi-dimensional analysis, such as gross margin by geography, practice area and industry',
    ],
  },
  {
    org: 'George Mason University',
    role: 'Graduate Teaching Assistant',
    period: 'May 2019 — January 2021',
    years: '2019 — 2021',
    summary: 'Teaching assistant for analytics: machine learning, big data with Python and R, and database programming.',
    points: [
      'Graduate Teaching Assistant for machine learning, big data to information using Python and R, and database programming',
      'Managed course content for Database Programming and maintained course sections in Blackboard',
      'Mentored students through office hours, proctored tests and one-on-one assignment feedback',
    ],
  },
  {
    org: 'Token Metrics',
    role: 'Machine Learning Engineer · Internship',
    period: 'May 2020 — July 2020',
    years: '2020',
    place: 'Washington, D.C.',
    summary: 'Price-prediction models and NLP sentiment scoring for cryptocurrencies.',
    points: [
      'Developed machine-learning algorithms for price prediction',
      'Used Long Short-Term Memory (LSTM) networks for predictive analysis in price forecasting',
      'Trained and deployed a spaCy NLP model to extract sentiment scores for cryptocurrencies',
      'Wrote complex SQL Server queries to source accurate data for price prediction',
    ],
  },
  {
    org: 'Satvat Infosol Pvt Ltd',
    role: 'Data Analyst',
    period: 'February 2016 — September 2018',
    years: '2016 — 2018',
    place: 'India',
    summary: 'SQL analysis, recurring reporting and dashboards in Excel, Power BI and Tableau.',
    points: [
      'Generated results from raw client data using SQL, including window functions',
      'Interpreted data to draw conclusions for managerial action and strategy',
      'Optimised data-collection procedures and produced weekly, monthly and quarterly reports',
      'Built dashboards in Excel, Power BI and Tableau, using pivot tables for reporting',
      'Researched and resolved data discrepancies with the troubleshooting team',
    ],
  },
];

export const education = [
  { school: 'George Mason University', degree: "Master's degree, Data Analytics", period: 'January 2019 — December 2020' },
  { school: 'Anna University', degree: 'Bachelor of Engineering, Computer Science' },
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
    id: 'ml',
    label: 'Machine Learning',
    caption: 'From my work and GitHub projects',
    skills: ['Classification', 'Regression', 'Clustering', 'Neural Networks', 'LSTM / Time Series', 'NLP (spaCy)', 'Computer Vision', 'PCA / LDA'],
  },
  {
    id: 'cloud',
    label: 'Cloud & Platforms',
    caption: 'Where the data lives',
    skills: ['Azure', 'AWS (S3, Redshift)', 'Databricks'],
  },
  {
    id: 'auto',
    label: 'Automation & Microsoft',
    caption: 'Workflows & collaboration',
    skills: ['Power Automate', 'Microsoft Dynamics 365', 'SharePoint', 'Microsoft Lists', 'Microsoft Teams'],
  },
];

/* ── PROJECT UNIVERSE ───────────────────────────────────────────────────────── */
export type ProjectKind = 'analytics' | 'ml' | 'nlp' | 'viz' | 'product';

export const projectKinds: Record<ProjectKind, { label: string; short: string }> = {
  analytics: { label: 'Analytics & BI', short: 'Analytics' },
  viz: { label: 'Visualisation', short: 'Visualisation' },
  ml: { label: 'Machine learning', short: 'ML' },
  nlp: { label: 'NLP & computer vision', short: 'NLP · Vision' },
  product: { label: 'Product & web', short: 'Product' },
};

export type ProjectLink = { label: string; href: string };
export type Project = {
  id: string;
  kind: ProjectKind;
  title: string;
  /** One line shown on hover. */
  blurb: string;
  /** Longer text shown when opened. Quoted/shortened from the repo where one exists. */
  detail?: string;
  tags: string[];
  links: ProjectLink[];
  anchor?: string;
};

export const projects: Project[] = [
  {
    id: 'tunekadal',
    kind: 'product',
    title: 'TuneKadal',
    blurb: 'An ocean of Tamil radio — 244+ stations on Android and iOS, plus a website.',
    detail:
      'A Tamil radio app and website I designed and built: station discovery, favourites, lock-screen / background playback, an AI station guide and multiple ocean-inspired themes.',
    tags: ['React Native', 'Expo', 'Android', 'iOS', 'Web'],
    links: [
      { label: 'tunekadal.com', href: 'https://tunekadal.com/' },
      { label: 'App Store', href: 'https://apps.apple.com/app/id6773931613' },
    ],
    anchor: '#tunekadal',
  },
  {
    id: 'covid-sentiment',
    kind: 'nlp',
    title: 'Sentiment Analysis on COVID-19 using Twitter Tweets',
    blurb: 'Sentiment analysis of COVID-19 tweets.',
    tags: ['NLP', 'Sentiment analysis', 'Jupyter Notebook'],
    links: [{ label: 'Repository', href: repo('Sentiment-Analysis-on-COVID-19-using-Twitter-Tweets') }],
  },
  {
    id: 'image-captioning',
    kind: 'nlp',
    title: 'Image Recognition and Captioning using Computer Vision and NLP',
    blurb: 'Semantic alignments between images and language for captioning.',
    detail: 'Image recognition semantic alignments for image captioning using computer vision and natural language processing.',
    tags: ['Computer vision', 'NLP', 'Jupyter Notebook'],
    links: [{ label: 'Repository', href: repo('Image-Captioning-Computer-Vision-and-NLP-') }],
  },
  {
    id: 'heart-disease',
    kind: 'ml',
    title: 'Heart Disease Prediction using Classification and Artificial Neural Networks',
    blurb: 'Classification models and an ANN to predict heart disease.',
    detail:
      'Machine-learning classifiers for predicting heart disease, with hypothesis testing on the results — and an artificial neural network that predicts the likelihood of heart disease from various health conditions.',
    tags: ['Classification', 'Neural network', 'Python'],
    links: [
      { label: 'Classification repo', href: repo('Heart-Disease-Prediction') },
      { label: 'ANN repo', href: repo('Artificial-Neural-Networks') },
    ],
  },
  {
    id: 'hospitality-price',
    kind: 'ml',
    title: 'Hospitality Business Price Predictions using Regression',
    blurb: 'Regression on New York City stays — price, reviews, location, host, amenities.',
    detail:
      'Analyses a dataset of reviews from customers around the world who travelled to New York City, predicting price from review, location, host and amenities.',
    tags: ['Regression', 'Jupyter Notebook'],
    links: [{ label: 'Repository', href: repo('The-hospitality-business-Price-Prediction.') }],
  },
  {
    id: 'ny-crime',
    kind: 'viz',
    title: 'New York Crime Rate in the Year 2014',
    blurb: 'Exploring rising crime rates in New York City and the reasons behind them.',
    detail: 'An analysis of the increasing crime rates in New York City and an exploration of the reasons behind it.',
    tags: ['Visualisation', 'Jupyter Notebook'],
    links: [{ label: 'Repository', href: repo('New-York-Crime-Visualization') }],
  },
  {
    id: 'sales-agent',
    kind: 'analytics',
    title: 'Sales Agent Analytics',
    blurb: 'An analytics project on sales-agent data.',
    tags: ['Analytics'],
    links: [],
  },
  {
    id: 'northwind',
    kind: 'analytics',
    title: 'Shipping Analytics — Northwind',
    blurb: 'Shipping analytics on the Northwind dataset.',
    tags: ['Analytics'],
    links: [],
  },
  {
    id: 'hr-report',
    kind: 'analytics',
    title: 'HR Analytical Report',
    blurb: 'An analytical report on HR data.',
    tags: ['Analytics', 'Reporting'],
    links: [],
  },
  {
    id: 'observatory',
    kind: 'product',
    title: 'This observatory',
    blurb: 'The site you are exploring — React, TypeScript and Three.js.',
    detail: 'Custom GLSL shaders, a scroll-driven camera, device-aware rendering, reduced-motion support and a full no-WebGL fallback.',
    tags: ['React', 'TypeScript', 'Three.js', 'GLSL'],
    links: [{ label: 'Source', href: 'https://github.com/ShinojJerald/ShinojJerald' }],
  },
];

/** Other public repositories — practice work in ML and NLP. */
export const labRepos: { name: string; href: string; lang: string }[] = [
  { name: 'Model-Selection', href: repo('Model-Selection'), lang: 'HTML' },
  { name: 'Classification-models', href: repo('Classification-models'), lang: 'Python' },
  { name: 'Regression-Models', href: repo('Regression-Models'), lang: 'Jupyter' },
  { name: 'Clustering-Algorithms', href: repo('Clustering-Algorithms'), lang: 'Python' },
  { name: 'Association-Rule-Learning', href: repo('Association-Rule-Learning'), lang: 'Python' },
  { name: 'Reinforcement-Learning', href: repo('Reinforcement-Learning'), lang: 'Jupyter' },
  { name: 'Deep-Learning', href: repo('Deep-Learning'), lang: 'Jupyter' },
  { name: 'Dimensionality-reduction--PCA', href: repo('Dimensionality-reduction--PCA'), lang: 'R' },
  { name: 'Dimensionality-Reduction--LDA', href: repo('Dimensionality-Reduction--LDA'), lang: 'R' },
  { name: 'Dimensionality-Reduction---Kernel-PCA', href: repo('Dimensionality-Reduction---Kernel-PCA'), lang: 'R' },
  { name: 'Cancer-Prediction', href: repo('Cancer-Prediction'), lang: 'Jupyter' },
  { name: 'Eliza-Chatbot', href: repo('Eliza-Chatbot'), lang: 'Python' },
  { name: 'Natural-Language-Processing', href: repo('Natural-Language-Processing'), lang: 'Jupyter' },
];

/* ── CERTIFICATIONS — names and issuers exactly as supplied ─────────────────── */
export type Certification = {
  name: string;
  issuer: string;
  /** Leave empty until verified. */
  year?: string;
  /** Leave empty until verified — never guessed. */
  url?: string;
  area: 'data' | 'ml' | 'web';
};

export const certifications: Certification[] = [
  { name: 'Advanced Data Science Specialist', issuer: 'IBM', area: 'ml' },
  { name: 'Advanced Data Science with IBM', issuer: 'IBM', area: 'ml' },
  { name: 'Applied AI with DeepLearning', issuer: 'IBM', area: 'ml' },
  { name: 'Advanced Machine Learning and Signal Processing', issuer: 'IBM', area: 'ml' },
  { name: 'Fundamentals of Scalable Data Science', issuer: 'IBM', area: 'data' },
  { name: 'Machine Learning A-Z: Hands-On Python & R in Data Science', issuer: 'SuperDataScience', area: 'ml' },
  { name: 'Master Tableau for Data Science', issuer: 'Udemy', area: 'data' },
  { name: 'Face Recognition AI Using Python', issuer: 'Udemy', area: 'ml' },
  { name: 'SQL Masterclass: SQL for Data Analytics', issuer: 'Start-Tech Academy', area: 'data' },
  { name: 'Time Series Analysis and Forecasting using Python', issuer: 'Start-Tech Academy', area: 'data' },
  { name: 'SQL Badge', issuer: 'HackerRank', area: 'data' },
  { name: 'Responsive Web Design', issuer: 'freeCodeCamp', area: 'web' },
];

/* ── TUNEKADAL (verified against tunekadal.com) ─────────────────────────────── */
export const tunekadal = {
  name: 'TuneKadal',
  tagline: 'Ocean of Tamil Tunes',
  tamil: 'கடல்', // "kadal" — ocean
  intro:
    'A listening experience built around Tamil radio — gathering stations from across the world into one calm, ocean-themed app.',
  stats: [
    { value: 244, suffix: '+', label: 'Tamil radio stations' },
    { value: 2, suffix: '', label: 'Platforms — Android & iOS' },
  ],
  stack: ['React Native', 'Expo', 'Android', 'iOS', 'Web'],
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
