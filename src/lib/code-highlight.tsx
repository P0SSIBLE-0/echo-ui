import { type ReactNode } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark.css";

// Register only the languages we need instead of all 190+
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

export function highlightCode(code: string): ReactNode {
  const highlighted = hljs.highlight(code, { language: "typescript" }).value;
  return (
    <span
      className="hljs bg-transparent! p-0! block"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}
