"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from "react";
import Link from "next/link";
import Script from "next/script";
import Editor from "@monaco-editor/react";
import {
  ChevronLeft,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Terminal,
  Play,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/app/playground/error-boundary";
import {
  registerPlaygroundThemes,
  getMonacoThemeName,
  MonacoInstance,
  ThemeKey,
} from "@/app/playground/playground-themes";
import { evaluateCode } from "@/app/playground/sandbox";

type Preset = {
  id: string;
  name: string;
  sourceFile: string;
  category: string;
  code: string;
};

type PlaygroundClientProps = {
  presets: Preset[];
};

const BLANK_PRESET: Preset = {
  id: "blank",
  name: "Blank Slate",
  sourceFile: "custom-component.tsx",
  category: "Custom",
  code: `"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function CustomComponent() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-6">
      <h1
        className="text-4xl font-extrabold tracking-tight text-black"
      >
        Playground Slate
      </h1>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCount(count + 1)}
        className="px-6 py-3 font-semibold text-white rounded-full bg-linear-to-r from-blue-500 to-blue-600 shadow-lg shadow-emerald-500/25 cursor-pointer hover:shadow-cyan-500/30 transition-all duration-300"
      >
        Count is {count}
      </motion.button>
    </div>
  );
}
`
};

export default function PlaygroundClient({ presets }: PlaygroundClientProps) {
  const allPresets = [BLANK_PRESET, ...presets];
  const [activePresetId, setActivePresetId] = useState<string>("blank");
  const [code, setCode] = useState<string>(BLANK_PRESET.code);
  const [debouncedCode, setDebouncedCode] = useState<string>(BLANK_PRESET.code);

  // Determine if Babel is already loaded globally
  const [babelReady, setBabelReady] = useState(() => {
    return typeof window !== "undefined" && typeof (window as unknown as { Babel?: unknown }).Babel !== "undefined";
  });

  const [compileError, setCompileError] = useState<string | null>(null);
  const [CompiledComponent, setCompiledComponent] = useState<React.ComponentType | null>(null);
  const [, startTransition] = useTransition();

  const [copied, setCopied] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  // Layout states
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState(50); // percentage (0 to 100)
  const [isResizing, setIsResizing] = useState(false);

  // Console states
  const [showConsole, setShowConsole] = useState(false);

  const themeKey: ThemeKey = "dracula";

  // Load Fira Code font dynamically from Google Fonts
  useEffect(() => {
    if (typeof document === "undefined") return;
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Debounce editor code input to avoid lagging compile
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(code);
    }, 250);
    return () => clearTimeout(timer);
  }, [code]);

  // Handle live JSX compiling using Babel
  useEffect(() => {
    if (!babelReady) return;

    let isMounted = true;
    try {
      const babel = (window as unknown as { Babel?: { transform: (code: string, config: unknown) => { code?: string } } }).Babel;
      if (!babel) throw new Error("Babel is not loaded yet.");

      // Compile using standard presets
      const transformed = babel.transform(debouncedCode, {
        presets: ["react", ["env", { modules: "commonjs" }]],
        filename: "playground.tsx",
      });

      if (!transformed || !transformed.code) {
        throw new Error("Babel compiler returned an empty output.");
      }

      const Comp = evaluateCode(transformed.code);

      if (isMounted) {
        startTransition(() => {
          setCompiledComponent(() => Comp);
          setCompileError(null);
        });
      }
    } catch (err) {
      if (isMounted) {
        startTransition(() => {
          setCompileError(err instanceof Error ? err.message : String(err));
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [debouncedCode, babelReady]);

  // Automatically show console when compileError becomes active
  useEffect(() => {
    if (compileError) {
      setShowConsole(true);
    }
  }, [compileError]);

  // Register editor themes and suppress import warnings in Monaco
  const handleEditorDidMount = (_editor: unknown, monaco: MonacoInstance) => {
    registerPlaygroundThemes(monaco);

    // Configure typescript compiler options in Monaco to ignore missing modules (semantic errors)
    // while keeping syntax validation active for formatting/typos.
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
  };

  // Switch preset code template
  const handlePresetChange = (presetId: string) => {
    const selected = allPresets.find((p) => p.id === presetId);
    if (selected) {
      setActivePresetId(presetId);
      setCode(selected.code);
      setDebouncedCode(selected.code);
    }
  };

  // Reset editor state
  const handleReset = () => {
    const selected = allPresets.find((p) => p.id === activePresetId);
    if (selected) {
      setCode(selected.code);
      setDebouncedCode(selected.code);
    }
  };

  // Copy code to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  // Re-run animations in preview
  const handleReplay = () => {
    setIsReplaying(true);
    setReplayKey((k) => k + 1);
    setTimeout(() => setIsReplaying(false), 300);
  };

  // Drag handlers for resizable panels
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;

      // Calculate mouse position relative to container
      const mouseX = e.clientX - containerRect.left;

      // Calculate the editor width percentage (editor is on the left side)
      let newEditorWidth = (mouseX / containerWidth) * 100;

      // Limit widths between 25% and 75%
      if (newEditorWidth < 25) newEditorWidth = 25;
      if (newEditorWidth > 75) newEditorWidth = 75;

      setEditorWidth(newEditorWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.0/babel.min.js"
        strategy="afterInteractive"
        onLoad={() => setBabelReady(true)}
      />

      <div
        ref={containerRef}
        className={cn(
          "flex h-screen w-screen overflow-hidden bg-background text-foreground relative",
          isResizing && "select-none cursor-col-resize"
        )}
      >

        {/* Left Panel: Monaco Code Editor */}
        <div
          style={{ width: `${editorWidth}%` }}
          className="flex flex-col h-full min-w-0 bg-[#1e1e1e] relative"
        >
          {/* Editor Header Toolbar */}
          <div className="flex h-8 shrink-0 items-center justify-between border-b border-white/5 bg-[#181818] px-4 select-none">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                title="Back to components"
                className="flex h-5 w-5 items-center justify-center rounded-full text-white/40 hover:text-white transition hover:bg-white/5 cursor-pointer"
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
              </Link>

              <span className="h-3.5 w-px bg-white/10" />

              <span className="font-mono text-[10px] text-white/45 uppercase tracking-wider font-bold">
                playground.tsx
              </span>

              <span className="h-3.5 w-px bg-white/10" />

              {/* Preset Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/35 font-medium uppercase tracking-wider">Preset:</span>
                <select
                  value={activePresetId}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="h-5 rounded bg-transparent border-0 text-[11px] font-semibold text-white/65 outline-none cursor-pointer hover:text-white pr-1"
                >
                  {allPresets.map((preset) => (
                    <option key={preset.id} value={preset.id} className="bg-[#181818] text-white text-xs border-0">
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="h-3.5 w-px bg-white/10" />

              {/* Reset code template */}
              <button
                onClick={handleReset}
                title="Reset code template"
                className="flex h-5 w-5 items-center justify-center rounded-full text-white/40 hover:text-white transition hover:bg-white/5 cursor-pointer"
              >
                <RotateCcw size={12} strokeWidth={2.2} />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                !babelReady
                  ? "bg-amber-500 animate-pulse"
                  : compileError
                    ? "bg-red-500"
                    : "bg-emerald-500"
              )} />
              <span className="font-mono text-[9px] text-white/35 uppercase tracking-wider">
                {!babelReady ? "loading compiler" : compileError ? "compilation error" : "compiled"}
              </span>
            </div>
          </div>

          {/* Monaco Wrapper */}
          <div className="flex-1 min-h-0 w-full relative">
            <Editor
              height="100%"
              language="typescript"
              theme={getMonacoThemeName(themeKey)}
              value={code}
              onChange={(val) => setCode(val || "")}
              onMount={handleEditorDidMount}
              loading={
                <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-xs text-white/40 font-mono">
                  Loading Monaco Editor...
                </div>
              }
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 22,
                fontFamily: "'Fira Code', var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontLigatures: true,
                padding: { top: 12 },
                scrollbar: {
                  vertical: "auto",
                  horizontal: "auto",
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10
                },
                wordWrap: "off",
                automaticLayout: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnType: true,
                formatOnPaste: true,
                tabSize: 2,
                insertSpaces: true
              }}
            />
          </div>

          {/* Details Footer */}
          <div className="h-8 border-t border-white/5 bg-[#181818] px-4 flex items-center justify-between text-[10px] text-white/40 shrink-0 select-none">
            <div className="flex items-center gap-1">
              <Sparkles size={10} className="text-[#ff3d12]" />
              <span>Imports: <b>react</b>, <b>framer-motion</b>, <b>lucide-react</b></span>
            </div>
            <div>TypeScript (TSX) Compiler Active</div>
          </div>
        </div>

        {/* Drag separator handle */}
        <div
          onMouseDown={startResize}
          className={cn(
            "w-1 shrink-0 bg-border-soft hover:bg-primary/50 transition-colors cursor-col-resize relative z-20 flex items-center justify-center group",
            isResizing && "bg-primary"
          )}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 flex flex-col justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-1 rounded-full bg-foreground/30" />
            <div className="w-1 h-1 rounded-full bg-foreground/30" />
            <div className="w-1 h-1 rounded-full bg-foreground/30" />
          </div>
        </div>

        {/* Right Panel: Render Canvas Preview */}
        <div
          style={{ width: `${100 - editorWidth}%` }}
          className="flex flex-col h-full bg-surface-muted relative border-l border-border-soft overflow-hidden"
        >
          {/* Preview Header */}
          <div className="flex h-8 shrink-0 items-center justify-between border-b border-border-soft bg-surface/35 px-4 select-none">
            <span className="font-mono text-[10px] text-foreground/45">
              live-preview
            </span>
            <div className="flex items-center gap-3">
              {/* Toggle Console Button */}
              <button
                onClick={() => setShowConsole(!showConsole)}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded transition hover:text-foreground cursor-pointer font-medium",
                  showConsole ? "bg-surface text-foreground font-semibold" : "text-foreground/50"
                )}
              >
                <Terminal size={10} />
                <span>Console</span>
                {compileError && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
              </button>

              {/* Replay animations */}
              <button
                onClick={handleReplay}
                disabled={isReplaying || !CompiledComponent}
                className="flex items-center gap-1 text-[10px] text-foreground/50 transition hover:text-foreground disabled:opacity-40 cursor-pointer font-medium"
              >
                <Play size={10} className={cn(isReplaying && "animate-ping")} />
                Replay Animation
              </button>

              {/* Copy code button */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-foreground/50 transition hover:text-foreground cursor-pointer font-medium"
              >
                {copied ? (
                  <>
                    <Check size={10} className="text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={10} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live output preview frame */}
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
            {/* Dots Overlay */}
            <div className="absolute inset-0 pointer-events-none transition-all duration-300 bg-[radial-gradient(var(--border-soft)_1.5px,transparent_1.5px)] bg-size-[24px_24px] opacity-40" />

            {/* Component mount slot */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto relative z-10">
              {!babelReady ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/25 border-t-foreground" />
                  <span className="text-xs text-foreground/50 font-medium">Loading compiler...</span>
                </div>
              ) : compileError ? (
                <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={14} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-red-600 dark:text-red-400">Compilation Error</h3>
                      <pre className="mt-2 overflow-auto font-mono text-[10px] leading-4 text-red-700 dark:text-red-300 max-h-[180px] bg-red-500/10 p-2.5 rounded-lg border border-red-500/10 select-text">
                        {compileError}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : CompiledComponent ? (
                <ErrorBoundary
                  key={`${activePresetId}-${replayKey}`}
                  fallback={(renderErr) => (
                    <div className="w-full max-w-md rounded-md border border-rose-500/20 bg-rose-500/5 p-4 text-left shadow-xs">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="mt-0.5 shrink-0 text-rose-500" size={14} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">Render Crash</h3>
                          <pre className="mt-2 overflow-auto font-mono text-[10px] leading-4 text-rose-700 dark:text-rose-300 max-h-[180px] bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/10 select-text">
                            {renderErr.message || String(renderErr)}
                            {renderErr.stack && `\n\nStack:\n${renderErr.stack}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <div className="relative">
                    <CompiledComponent />
                  </div>
                </ErrorBoundary>
              ) : (
                <div className="text-xs text-foreground/45">Loading preview canvas...</div>
              )}
            </div>
          </div>

          {/* Interactive Console Drawer */}
          {showConsole && (
            <div className="h-44 shrink-0 border-t border-border-soft bg-black/95 text-[11px] font-mono text-foreground flex flex-col z-20">
              <div className="flex h-7 shrink-0 items-center justify-between border-b border-white/5 bg-[#181818] px-3 select-none">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Console Window</span>
                <button
                  onClick={() => setShowConsole(false)}
                  className="text-[10px] text-white/35 hover:text-white transition cursor-pointer"
                >
                  Hide Drawer
                </button>
              </div>
              <div className="flex-1 overflow-auto p-3.5 select-text leading-5">
                {compileError ? (
                  <div className="text-red-400">
                    <span className="text-red-500 font-bold">Error:</span> {compileError}
                  </div>
                ) : (
                  <div className="text-emerald-400/80">
                    ✓ Compiled successfully. Ready to test React code.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
