"use client";

import { motion } from "framer-motion";
import { Check, ChevronLeft, Copy, Download, PanelLeft, X } from "lucide-react";
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

export function SourceDrawer({
  item,
  onClose,
  onCopy,
  onDownload,
  copied,
  downloaded,
}: SourceDrawerProps) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close source drawer"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.aside
        key="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-drawer-title"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-2xl flex-col border-l border-white/10 bg-zinc-900 text-white shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-white/2 px-5 py-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ChevronLeft size={16} />
            Source Code
          </button>
          <p
            id="source-drawer-title"
            className="font-mono text-[13px] text-white/70"
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
                "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
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

        <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-[#7ee787]">
            <PanelLeft size={14} />
            {item.category} · {item.name}
          </p>
          {item.dependencies.map((dependency) => (
            <span
              key={dependency}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-[#a5d6ff]"
            >
              {dependency}
            </span>
          ))}
        </div>

        <pre className="min-h-0 flex-1 overflow-auto bg-[#0d1117] p-5 font-mono text-[13px] leading-6">
          <code>{highlightCode(item.code || "")}</code>
        </pre>
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
        "grid h-9 w-9 place-items-center rounded-full text-white transition",
        active ? "bg-[#2dd4bf] text-[#0b0f14]" : "bg-white/8 hover:bg-white/14",
      )}
    >
      {children}
    </motion.button>
  );
}
