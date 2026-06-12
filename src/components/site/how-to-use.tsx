"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Copy, Terminal, FileCode2, Code, ArrowRight } from "lucide-react";
import type { RegistryItem } from "@/registry/registry";
import { cn } from "@/lib/utils";

type HowToUseProps = {
  item: RegistryItem;
};

const PKG_MANAGERS = [
  { id: "npm", label: "npm", cmd: "npm i" },
  { id: "pnpm", label: "pnpm", cmd: "pnpm add" },
  { id: "yarn", label: "yarn", cmd: "yarn add" },
  { id: "bun", label: "bun", cmd: "bun add" },
] as const;

type PkgManager = typeof PKG_MANAGERS[number]["id"];

export function HowToUse({ item }: HowToUseProps) {
  const [activePkg, setActivePkg] = useState<PkgManager>("npm");
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Convert kebab-case id to PascalCase export name
  const componentName = item.id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  // Map dependencies to install, translating framer-motion to motion
  const rawDeps = item.dependencies || [];
  const depsToInstall = rawDeps
    .map((d) => (d === "framer-motion" ? "motion" : d))
    .filter((d) => d !== "tailwindcss");

  const selectedPkg = PKG_MANAGERS.find((p) => p.id === activePkg) || PKG_MANAGERS[0];
  const installCommand = depsToInstall.length > 0
    ? `${selectedPkg.cmd} ${depsToInstall.join(" ")}`
    : "";

  const componentPath = `components/echo-ui/${item.sourceFile}`;

  const handleCopyCmd = useCallback(async () => {
    if (!installCommand) return;
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopiedCmd(true);
      window.setTimeout(() => setCopiedCmd(false), 2000);
    } catch (err) {
      console.error("Failed to copy command", err);
    }
  }, [installCommand]);

  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(componentPath);
      setCopiedPath(true);
      window.setTimeout(() => setCopiedPath(false), 2000);
    } catch (err) {
      console.error("Failed to copy path", err);
    }
  }, [componentPath]);

  // Animated checkmark vs copy icon
  const renderCopyButtonIcon = (isCopied: boolean) => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={isCopied ? "copied" : "copy"}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className="flex items-center justify-center"
      >
        {isCopied ? (
          <Check size={14} className="text-accent dark:text-accent" />
        ) : (
          <Copy size={14} className="text-ink-muted group-hover/btn:text-foreground" />
        )}
      </motion.span>
    </AnimatePresence>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-12 border-t border-border-soft mt-12 bg-background/50 backdrop-blur-xs rounded-3xl">
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">How to use</h2>
        <p className="text-sm text-ink-muted">
          Integrate the {item.name} component into your React or Next.js application in three simple steps.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Step 1: Install Dependencies */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full border border-border-soft bg-surface text-xs font-mono">
              1
            </span>
            <span>Install dependencies</span>
          </div>

          <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl border border-border-soft bg-surface/40 hover:bg-surface/60 transition-all duration-300">
            <div>
              {depsToInstall.length > 0 ? (
                <>
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    {depsToInstall.map((dep) => (
                      <span
                        key={dep}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium border border-border-soft bg-surface-muted text-foreground"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>

                  {/* Package Manager Selection Tabs */}
                  <div
                    role="tablist"
                    aria-label="Package Manager"
                    className="relative flex rounded-lg border border-border-soft bg-surface-muted/60 p-[3px] mb-3"
                  >
                    {PKG_MANAGERS.map((pkg) => {
                      const isSelected = activePkg === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          role="tab"
                          aria-selected={isSelected}
                          onClick={() => setActivePkg(pkg.id)}
                          className={cn(
                            "relative flex-1 py-1 text-center font-mono text-[11px] font-semibold transition-colors duration-250 select-none outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-md",
                            isSelected ? "text-foreground" : "text-ink-muted hover:text-foreground"
                          )}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="active-pkg-tab"
                              className="absolute inset-0 bg-surface rounded-md shadow-xs border border-border-soft/60"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10">{pkg.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Copy command box */}
                  <div className="relative flex items-center justify-between rounded-xl border border-border-soft bg-surface-muted/40 p-2 pl-3 font-mono text-xs text-foreground/90 overflow-hidden">
                    <span className="truncate pr-8 select-all font-variant-numeric-tabular-nums">
                      {installCommand}
                    </span>
                    <motion.button
                      type="button"
                      onClick={handleCopyCmd}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Copy installation command"
                      className="group/btn absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg border border-border-soft bg-surface transition-colors hover:bg-surface-muted shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-accent outline-none"
                    >
                      {renderCopyButtonIcon(copiedCmd)}
                    </motion.button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-ink-muted mt-2">
                  No additional external dependencies required besides standard Tailwind CSS setup.
                </p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border-soft/40 flex items-center justify-between text-[11px] text-ink-muted font-medium">
              <span className="flex items-center gap-1">
                <Terminal size={12} /> Package setup
              </span>
              <span>Ready</span>
            </div>
          </div>
        </div>

        {/* Step 2: Copy Component Code */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full border border-border-soft bg-surface text-xs font-mono">
              2
            </span>
            <span>Copy the component code</span>
          </div>

          <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl border border-border-soft bg-surface/40 hover:bg-surface/60 transition-all duration-300">
            <div className="space-y-3">
              <p className="text-xs text-ink-muted leading-relaxed">
                Open the source code panel using the code button in the toolbar, copy the source, and paste it into your local directory.
              </p>

              <div className="relative flex items-center justify-between rounded-xl border border-border-soft bg-surface-muted/40 p-2 pl-3 font-mono text-xs text-foreground/90 overflow-hidden">
                <span className="truncate pr-8 select-all">
                  {componentPath}
                </span>
                <motion.button
                  type="button"
                  onClick={handleCopyPath}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Copy component destination path"
                  className="group/btn absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg border border-border-soft bg-surface transition-colors hover:bg-surface-muted shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-accent outline-none"
                >
                  {renderCopyButtonIcon(copiedPath)}
                </motion.button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border-soft/40 flex items-center justify-between text-[11px] text-ink-muted font-medium">
              <span className="flex items-center gap-1">
                <FileCode2 size={12} /> Create local file
              </span>
              <span>Paste ready</span>
            </div>
          </div>
        </div>

        {/* Step 3: Usage Example */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full border border-border-soft bg-surface text-xs font-mono">
              3
            </span>
            <span>Usage</span>
          </div>

          <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl border border-border-soft bg-surface/40 hover:bg-surface/60 transition-all duration-300">
            <div className="space-y-2.5 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                  Example Import
                </span>
                <Code size={12} className="text-ink-muted" />
              </div>
              <div className="rounded-xl border border-border-soft bg-surface-muted/40 p-3 font-mono text-xs text-foreground/90 overflow-x-auto whitespace-pre leading-relaxed select-all">
{`import { ${componentName} } from "@/components/echo-ui/${item.id}";

export default function Page() {
  return (
    <div className="p-8">
      <${componentName} />
    </div>
  );
}`}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border-soft/40 flex items-center justify-between text-[11px] text-ink-muted font-medium">
              <span className="flex items-center gap-1">
                <ArrowRight size={12} /> Import and render
              </span>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
