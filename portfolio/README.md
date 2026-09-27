# Interactive 3D portfolio — source

An "underwater data observatory": a React + TypeScript + Three.js single page,
deployed to **https://shinojjerald.github.io/ShinojJerald/** by the workflow in
`.github/workflows/deploy-portfolio.yml`.

## Run locally

```bash
cd portfolio
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Editing content

Every factual claim lives in **`src/content.ts`** — profile, experience, skills,
projects and TuneKadal. Change text there; components only render it.

- **LinkedIn / email:** fill `links.linkedin` / `links.email` and they appear in Contact.
- **TuneKadal screenshots:** put image files in `public/tunekadal/` and list the
  file names in `tunekadal.screenshots`. A gallery appears automatically.

## Architecture

| Area | Where |
| --- | --- |
| Page shell, lazy 3D loading | `src/App.tsx` |
| DOM → scene bridge (scroll, velocity, pointer; no re-renders) | `src/lib/world.ts` |
| Device tiers, WebGL detection, reduced motion | `src/lib/device.ts` |
| Canvas, camera rig (one keyframe per section), adaptive resolution | `src/scene/Experience.tsx` |
| Data core, particles, network, current, rays, seafloor, lighthouse | `src/scene/*.tsx` |
| Sections | `src/sections/*.tsx` |
| Visual system | `src/styles.css` |

## Performance and graceful degradation

- The 3D engine is a separate chunk (~250 kB gzip) that only downloads when WebGL is available. First load without it is ~80 kB gzip of JS.
- Tiers (`low` / `mid` / `high`) set particle counts, geometry detail, light rays, pixel ratio and camera sway. Resolution drops automatically if frame rate falls.
- No textures or 3D models are loaded. Everything is procedural geometry and GLSL.
- `prefers-reduced-motion` (or the **Motion** toggle in the nav) slows the world to a near-standstill, removes camera sway and CSS animations, and reveals all content at once.
- Without WebGL the page renders a CSS/SVG version of the world with the full content.

### Test switches (URL query)

`?nogl` forces the no-WebGL fallback · `?calm` forces reduced motion · `?tier=low|mid|high` forces a quality tier.
