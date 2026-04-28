import { useI18n } from "../../i18n/useI18n.js";

// Highlights the brand keywords inside view titles by wrapping them in <span class="title-highlight">.
// The split regex captures the keywords so they appear as separate items in the array,
// then each item is checked against the test regex to decide whether to wrap it.

export function HighlightedTitle({ text }) {
  const { data } = useI18n();
  const { highlight, split } = data.titlePatterns;
  return text.split(split).map((part, index) => {
    if (!highlight.test(part)) return part;
    return (
      <span key={`${part}-${index}`} className="title-highlight">
        {part}
      </span>
    );
  });
}
