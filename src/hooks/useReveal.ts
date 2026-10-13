import { useEffect, useRef } from "react";

/**
 * Reveal an element when it scrolls into view.
 *
 * Uses IntersectionObserver rather than a scroll listener so there is no
 * per-frame work, and unobserves once the element has appeared — a section
 * should animate once, not every time you scroll past it.
 *
 * Returns a ref to attach to the element. Pair with the `.reveal` class:
 *
 *   const ref = useReveal();
 *   <section ref={ref} className="reveal">…</section>
 *
 * Motion is suppressed automatically by the `prefers-reduced-motion` rule in
 * index.css, so nothing here needs to check for it.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  /** how much of the element must be visible before it animates */
  threshold?: number;
  /** stagger, in ms, applied as a transition-delay */
  delay?: number;
  /** re-run when this changes (e.g. a tab switch rendering fresh content) */
  deps?: unknown[];
}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (options?.delay) {
      el.style.transitionDelay = `${options.delay}ms`;
    }

    // No observer support (or SSR): just show it.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: options?.threshold ?? 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.threshold, options?.delay, ...(options?.deps ?? [])]);

  return ref;
}

/**
 * Reveal a list of children with a stagger.
 * Applies the same observer but increments the delay per index, which is what
 * makes a grid feel like it is assembling rather than appearing all at once.
 */
export function useRevealStagger<T extends HTMLElement = HTMLDivElement>(step = 60, deps: unknown[] = []) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = Array.from(el.querySelectorAll<HTMLElement>(".reveal"));
    if (targets.length === 0) return;

    targets.forEach((t, i) => {
      t.style.transitionDelay = `${Math.min(i * step, 400)}ms`;
    });

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ...deps]);

  return ref;
}
