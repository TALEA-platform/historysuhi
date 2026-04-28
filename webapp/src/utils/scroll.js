// Smooth-scroll the page to the element with the given id, then move keyboard focus to it
// without triggering a second scroll (preventScroll). The setTimeout waits for the scroll
// animation to settle so the focus does not interrupt it.

export function scrollToInfo(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => target.focus({ preventScroll: true }), 250);
}
