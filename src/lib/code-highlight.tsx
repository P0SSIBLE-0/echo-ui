import { type ReactNode } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

export function highlightCode(code: string): ReactNode {
  const highlighted = hljs.highlight(code, { language: "typescript" }).value;
  return (
    <span
      className="hljs bg-transparent! p-0! block"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}
