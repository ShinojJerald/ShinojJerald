import { useEffect, useRef } from 'react';
import { SECTION_IDS, world } from '../lib/world';

/**
 * A quiet instrument readout in the corner. Every number is live telemetry from
 * the page itself (scroll depth, current, cursor bearing) — nothing is a claim.
 */
export function Hud() {
  const depth = useRef<HTMLSpanElement>(null);
  const cur = useRef<HTMLSpanElement>(null);
  const brg = useRef<HTMLSpanElement>(null);
  const sec = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = '';
    let lastDeg = -1;
    const tick = () => {
      const d = Math.round(world.progress * 1200);
      const idx = Math.min(SECTION_IDS.length - 1, Math.floor(world.section));
      const line = `${d}|${world.velocity.toFixed(2)}|${idx}`;
      if (line !== last) {
        last = line;
        if (depth.current) depth.current.textContent = `−${String(d).padStart(4, '0')} m`;
        if (cur.current) cur.current.textContent = world.velocity.toFixed(2);
        if (sec.current) sec.current.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(SECTION_IDS.length).padStart(2, '0')}  ${SECTION_IDS[idx].toUpperCase()}`;
        if (bar.current) bar.current.style.transform = `scaleY(${world.progress})`;
      }
      const deg = Math.round(((Math.atan2(world.pointerX, world.pointerY) * 180) / Math.PI + 360) % 360);
      if (brg.current && deg !== lastDeg) {
        lastDeg = deg;
        brg.current.textContent = `${String(deg).padStart(3, '0')}°`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <aside className="hud" aria-hidden="true">
      <div className="hud-gauge">
        <span className="hud-gauge-fill" ref={bar} />
      </div>
      <div className="hud-body">
      <dl className="hud-read">
        <div>
          <dt>Depth</dt>
          <dd ref={depth}>−0000 m</dd>
        </div>
        <div>
          <dt>Current</dt>
          <dd ref={cur}>0.00</dd>
        </div>
        <div>
          <dt>Bearing</dt>
          <dd ref={brg}>000°</dd>
        </div>
      </dl>
      <span className="hud-sec" ref={sec}>
        01 / 08 HOME
      </span>
      </div>
    </aside>
  );
}
