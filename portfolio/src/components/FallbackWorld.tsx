import { useMemo } from 'react';

/**
 * The world without WebGL: layered gradients, soft light shafts and slowly
 * rising motes, all in CSS. It is also what shows for the split second before
 * the 3D scene fades in, so first paint is never an empty black screen.
 */
export function FallbackWorld({ animated }: { animated: boolean }) {
  const motes = useMemo(
    () =>
      Array.from({ length: animated ? 38 : 0 }, (_, i) => ({
        left: (i * 37.7) % 100,
        size: 1 + ((i * 7) % 3),
        dur: 18 + ((i * 13) % 22),
        delay: -((i * 5.3) % 30),
        o: 0.25 + ((i * 11) % 6) / 12,
      })),
    [animated],
  );
  return (
    <div className={`fallback ${animated ? 'is-active' : ''}`}>
      <div className="fb-glow fb-glow-a" />
      <div className="fb-glow fb-glow-b" />
      <div className="fb-rays" />
      {animated && (
        <>
          <div className="fb-core" />
          <div className="fb-motes">
            {motes.map((m, i) => (
              <span
                key={i}
                style={{
                  left: `${m.left}%`,
                  width: m.size,
                  height: m.size,
                  opacity: m.o,
                  animationDuration: `${m.dur}s`,
                  animationDelay: `${m.delay}s`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
