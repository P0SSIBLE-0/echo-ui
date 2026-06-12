"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronLeft, Copy, Download, PanelLeft, X, Terminal, FileCode2, Code, ArrowRight } from "lucide-react";
import { highlightCode } from "@/lib/code-highlight";
import type { RegistryItem } from "@/registry/registry";
import { cn } from "@/lib/utils";

type SourceDrawerProps = {
  item: RegistryItem;
  onClose: () => void;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
  downloaded: boolean;
};

const PKG_MANAGERS = [
  { id: "npm", label: "npm", cmd: "npm i" },
  { id: "pnpm", label: "pnpm", cmd: "pnpm add" },
  { id: "yarn", label: "yarn", cmd: "yarn add" },
  { id: "bun", label: "bun", cmd: "bun add" },
] as const;

type PkgManager = typeof PKG_MANAGERS[number]["id"];

type ActiveTab = "code" | "docs";

export function SourceDrawer({
  item,
  onClose,
  onCopy,
  onDownload,
  copied,
  downloaded,
}: SourceDrawerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("code");
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

  const renderCopyBtnIcon = (isCopied: boolean) => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={isCopied ? "copied" : "copy"}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.12, ease: "easeInOut" }}
        className="flex items-center justify-center"
      >
        {isCopied ? (
          <Check size={14} className="text-[#2dd4bf]" />
        ) : (
          <Copy size={14} className="text-white/40 group-hover/btn:text-white" />
        )}
      </motion.span>
    </AnimatePresence>
  );

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close source drawer"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs rounded-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={onClose}
      />
      <motion.aside
        key="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-drawer-title"
        initial={{ x: "105%", opacity: 0.95 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "105%", opacity: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="fixed right-0 top-0 z-50 flex h-dvh w-full md:max-w-2xl flex-col border-l border-white/10 bg-[#0c0f13]/96 backdrop-blur-md text-white shadow-[0_24px_70px_rgba(0,0,0,0.6)] overflow-hidden rounded-none"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/2 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs text-white/60 transition hover:text-white cursor-pointer"
          >
            <ChevronLeft size={16} />
            Source Code
          </button>
          <p
            id="source-drawer-title"
            className="font-mono text-[11px] text-white/70"
          >
            {item.sourceFile}
          </p>
          <div className="flex items-center gap-2">
            <DrawerIconButton
              label="Download source"
              onClick={onDownload}
              active={downloaded}
            >
              {downloaded ? <Check size={16} /> : <Download size={16} />}
            </DrawerIconButton>
            <motion.button
              type="button"
              onClick={onCopy}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Copy source"
              className={cn(
                "inline-flex h-9 items-center gap-2 px-4 text-xs font-semibold transition rounded-3xl cursor-pointer",
                copied
                  ? "bg-[#2dd4bf] text-[#0b0f14]"
                  : "bg-white text-[#0b0f14] hover:bg-[#d2a8ff]",
              )}
            >
              {copied ? (
                <>
                  <Check size={15} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={15} />
                  Copy
                </>
              )}
            </motion.button>
            <DrawerIconButton label="Close drawer" onClick={onClose}>
              <X size={16} />
            </DrawerIconButton>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-white/2 select-none">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "code"}
            onClick={() => setActiveTab("code")}
            className={cn(
              "relative flex-1 py-3 text-center text-xs font-semibold transition-colors focus-visible:outline-none cursor-pointer",
              activeTab === "code" ? "text-white" : "text-white/40 hover:text-white"
            )}
          >
            {activeTab === "code" && (
              <motion.div
                layoutId="drawer-active-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-none"
                transition={{ type: "spring", stiffness: 380, damping: 35 }}
              />
            )}
            Source Code
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "docs"}
            onClick={() => setActiveTab("docs")}
            className={cn(
              "relative flex-1 py-3 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 cursor-pointer",
              activeTab === "docs" ? "text-white" : "text-white/40 hover:text-white"
            )}
          >
            {activeTab === "docs" && (
              <motion.div
                layoutId="drawer-active-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-none"
                transition={{ type: "spring", stiffness: 380, damping: 35 }}
              />
            )}
            How to Use
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === "code" ? (
          <>
            <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3 rounded-none">
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-[#2dd4bf]">
                <PanelLeft size={14} />
                {item.category} · {item.name}
              </p>
              {item.dependencies.map((dependency) => (
                <span
                  key={dependency}
                  className="border border-white/10 bg-white/10 px-3 py-1 font-mono text-xs text-[#a5d6ff] rounded-none"
                >
                  {dependency}
                </span>
              ))}
            </div>

            <pre className="min-h-0 flex-1 overflow-auto bg-black/35 p-5 font-mono text-[13px] leading-6 border-t border-white/5 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent rounded-none">
              <code>{highlightCode(item.code || "")}</code>
            </pre>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin rounded-none">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">How to use</h3>
              <p className="text-xs text-white/50">
                Integrate the {item.name} component into your local application in three steps.
              </p>
            </div>

            {/* Step 1: Install Dependencies */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2dd4bf]">
                <span className="flex items-center justify-center w-5 h-5 border border-white/20 bg-white/5 font-mono text-[10px] rounded-none">
                  1
                </span>
                <span>Install Dependencies</span>
              </div>
              <div className="p-4 border border-white/10 bg-white/2 rounded-none">
                {depsToInstall.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {depsToInstall.map((dep) => (
                        <span
                          key={dep}
                          className="px-2 py-0.5 font-mono text-xs border border-white/10 bg-white/5 text-[#a5d6ff] rounded-none"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>

                    {/* Package selection tabs */}
                    <div
                      role="tablist"
                      aria-label="Package Manager"
                      className="relative flex border border-white/10 bg-white/5 p-[2px] rounded-none"
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
                              "relative flex-1 py-1.5 text-center font-mono text-[11px] font-semibold transition-colors duration-250 select-none outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none cursor-pointer",
                              isSelected ? "text-[#0c0f13]" : "text-white/40 hover:text-white"
                            )}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="drawer-pkg-tab"
                                className="absolute inset-0 bg-blue-500 border border-blue-500 rounded-none"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              />
                            )}
                            <span className="relative z-10">{pkg.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Copy command bar */}
                    <div className="relative flex items-center justify-between border border-white/10 bg-black/40 p-2.5 pl-3 font-mono text-xs text-white/90 overflow-hidden rounded-none">
                      <span className="truncate pr-8 select-all font-variant-numeric-tabular-nums">
                        {installCommand}
                      </span>
                      <motion.button
                        type="button"
                        onClick={handleCopyCmd}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Copy installation command"
                        className="group/btn absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer outline-none rounded-none"
                      >
                        {renderCopyBtnIcon(copiedCmd)}
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-white/45">
                    No external dependencies required besides standard Tailwind CSS setup.
                  </p>
                )}
              </div>
            </div>

            {/* Step 2: Component File */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                <span className="flex items-center justify-center w-5 h-5 border border-white/20 bg-white/5 font-mono text-[10px] rounded-none">
                  2
                </span>
                <span>Copy Component Code</span>
              </div>
              <div className="p-4 border border-white/10 bg-white/2 rounded-none space-y-3">
                <p className="text-xs text-white/60 leading-relaxed">
                  Toggle back to the <strong className="text-white">Source Code</strong> tab, copy the entire file contents, and save it in your project folder:
                </p>
                <div className="relative flex items-center justify-between border border-white/10 bg-black/40 p-2.5 pl-3 font-mono text-xs text-white/90 overflow-hidden rounded-none">
                  <span className="truncate pr-8 select-all">
                    {componentPath}
                  </span>
                  <motion.button
                    type="button"
                    onClick={handleCopyPath}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Copy component destination path"
                    className="group/btn absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer  outline-none rounded-none"
                  >
                    {renderCopyBtnIcon(copiedPath)}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Step 3: Usage Example */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                <span className="flex items-center justify-center w-5 h-5 border border-white/20 bg-white/5 font-mono text-[10px] rounded-none">
                  3
                </span>
                <span>Usage</span>
              </div>
              <div className="p-4 border border-white/10 bg-white/2 rounded-none space-y-2.5 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                    Import and Render
                  </span>
                  <Code size={12} className="text-white/40" />
                </div>
                <div className="border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/80 overflow-x-auto whitespace-pre leading-relaxed select-all rounded-none">
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
            </div>
          </div>
        )}
      </motion.aside>
    </>
  );
}

function DrawerIconButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
      className={cn(
        "grid size-7 place-items-center rounded-3xl text-white transition cursor-pointer",
        active ? "bg-blue-500 text-[#0b0f14]" : "bg-white/8 hover:bg-white/14",
      )}
    >
      {children}
    </motion.button>
  );
}
