// Builds a compact list of page entries (numbers + ellipses) for a paginated table.
// Returns an array of items shaped as either { type: "page", index } or { type: "ellipsis", key }.
//
// The strategy: always include the first page, the last page, the current page and its neighbours.
// Near the edges, also pad with the next/previous two so the bar stays balanced. Then walk the
// sorted list and inject an ellipsis whenever there is a gap of more than one page between entries.

export function buildPaginationItems(currentIndex, pageCount) {
  if (pageCount <= 1) return [];

  // Set deduplicates: the same page may be added by multiple branches.
  const pages = new Set([0, pageCount - 1, currentIndex, currentIndex - 1, currentIndex + 1]);
  if (currentIndex <= 1) {
    pages.add(1);
    pages.add(2);
  }
  if (currentIndex >= pageCount - 2) {
    pages.add(pageCount - 2);
    pages.add(pageCount - 3);
  }

  const orderedPages = [...pages]
    .filter((page) => page >= 0 && page < pageCount)
    .sort((a, b) => a - b);

  // flatMap lets each page expand into either [pageItem] or [ellipsis, pageItem]
  // depending on the gap to the previous entry.
  return orderedPages.flatMap((page, index) => {
    const previous = orderedPages[index - 1];
    if (index > 0 && page - previous > 1) {
      return [{ type: "ellipsis", key: `ellipsis-${previous}-${page}` }, { type: "page", index: page }];
    }
    return [{ type: "page", index: page }];
  });
}
