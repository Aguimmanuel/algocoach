import { useMemo } from "react";

/**
 * A short confetti burst. Pure CSS, no dependency, disappears on its own.
 *
 * `fire` is a counter rather than a boolean: bumping it re-randomises the
 * pieces, so a second burst inside the same mount still reads as new.
 */
export default function Confetti({ fire }: { fire: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        dx: `${(Math.random() - 0.5) * 340}px`,
        dy: `${-Math.random() * 260 - 40}px`,
        rot: `${Math.random() * 720 - 360}deg`,
        left: `${8 + Math.random() * 84}%`,
        delay: `${Math.random() * 180}ms`,
      })),
    [fire],
  );
  if (!fire) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 h-0 overflow-visible">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti rounded-sm bg-primary"
          style={{
            left: p.left,
            animationDelay: p.delay,
            ["--dx" as string]: p.dx,
            ["--dy" as string]: p.dy,
            ["--rot" as string]: p.rot,
          }}
        />
      ))}
    </div>
  );
}
