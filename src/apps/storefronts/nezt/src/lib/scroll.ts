export function smoothScrollTo(element: HTMLElement, offset: number = 100) {
  const startY = window.scrollY;
  const targetY = element.offsetTop - offset;
  const distance = targetY - startY;
  const duration = 800; // milliseconds
  let start: number | null = null;

  function step(timestamp: number) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const progressPercent = Math.min(progress / duration, 1);

    // Easing function: ease-in-out cubic
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const easedProgress = easeInOutCubic(progressPercent);
    window.scrollTo(0, startY + easedProgress * distance);

    if (progress < duration) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}
