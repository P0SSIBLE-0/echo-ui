"use client";

import { motion } from "motion/react";
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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.9, .75, 0.36, 1] }}
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
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="fixed right-[8px] top-[10px] z-50 flex h-[calc(100dvh-20px)] w-[calc(100vw-16px)] md:max-w-2xl flex-col rounded-[22px] border border-white/10 bg-[#0c0f13]/96 backdrop-blur-md text-white shadow-[0_24px_70px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-white/2 px-4 py-2">
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
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-purple-400">
            <PanelLeft size={14} />
            {item.category} · {item.name}
          </p>
          {item.dependencies.map((dependency) => (
            <span
              key={dependency}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-xs text-[#a5d6ff]"
            >
              {dependency}
            </span>
          ))}
        </div>

        <pre className="min-h-0 flex-1 overflow-auto bg-black/35 p-5 font-mono text-[13px] leading-6 rounded-b-[22px] border-t border-white/5 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
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
