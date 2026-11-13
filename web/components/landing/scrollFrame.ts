/**
 * Un único listener de scroll/resize para toda la landing (client-event-listeners): los efectos se suscriben
 * y se ejecutan juntos una vez por frame con requestAnimationFrame, en vez de tener un listener cada uno.
 */
type Fn = () => void;
const subs = new Set<Fn>();
let raf = 0;
const run = () => { raf = 0; subs.forEach((f) => f()); };
const schedule = () => { if (!raf) raf = requestAnimationFrame(run); };

export function onScrollFrame(fn: Fn) {
  if (subs.size === 0) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }
  subs.add(fn);
  fn();
  return () => {
    subs.delete(fn);
    if (subs.size === 0) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}
