import React from "react";
import * as FramerMotion from "framer-motion";
import * as Motion from "motion";
import * as LucideReact from "lucide-react";
import * as Three from "three";

export function evaluateCode(compiledCode: string): React.ComponentType {
  const exports: Record<string, unknown> = {};
  const mockModule = { exports };

  const customRequire = (name: string) => {
    const canonicalName = name.toLowerCase();
    if (canonicalName === "react") {
      return { ...React, default: React, React };
    }
    if (canonicalName === "framer-motion") {
      return { ...FramerMotion, default: FramerMotion };
    }
    if (canonicalName === "motion") {
      return { ...Motion, default: Motion };
    }
    if (canonicalName === "lucide-react") {
      return { ...LucideReact, default: LucideReact };
    }
    if (canonicalName === "three") {
      return { ...Three, default: Three };
    }
    throw new Error(`Module "${name}" is not installed in this playground. Use react, framer-motion, or lucide-react.`);
  };

  // Evaluate the transformed code in the sandbox context
  const runCode = new Function("require", "exports", "module", "React", compiledCode);
  runCode(customRequire, exports, mockModule, React);

  const component = (mockModule.exports.default || Object.values(mockModule.exports)[0]) as React.ComponentType | undefined;

  if (!component) {
    throw new Error("No component was exported! Make sure to 'export default' or 'export' your component.");
  }
  if (typeof component !== "function") {
    throw new Error("The exported item is not a valid React functional component.");
  }

  return component;
}
