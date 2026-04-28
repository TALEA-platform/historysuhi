// Lightweight markdown-ish renderer for **bold** spans inside the panel copy.
// We deliberately avoid pulling in a real markdown library: the only construct in
// use is the **double-star** wrapper, and it is needed in dozens of small strings.
//
// RichTextInline returns an array of strings/<strong> nodes (no wrapper element)
// so callers can compose it inside <p>, <small>, <li>, ... without extra divs.
//
// RichText is the convenience wrapper: pick the wrapper tag with `as`, optionally
// pass a className.

export function RichTextInline({ text }) {
  // The capturing parens inside the regex make split() include the matched
  // delimiters in the result, so we can identify which chunks were bold.
  return String(text).split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function RichText({ as: Component = "p", text, className }) {
  return (
    <Component className={className}>
      <RichTextInline text={text} />
    </Component>
  );
}
