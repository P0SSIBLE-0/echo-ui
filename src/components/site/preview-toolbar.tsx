"use client";

import { motion } from "motion/react";
import { Code2, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PreviewToolbarProps = {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onReplay: () => void;
  onOpenSource: () => void;
};

export function PreviewToolbar({
  isFullscreen,
  onToggleFullscreen,
  onReplay,
  onOpenSource,
}: PreviewToolbarProps) {
  return (
    <div className="absolute right-[20px] top-[19px] z-20 flex rounded-full border border-border-soft bg-surface p-[7px] text-foreground shadow-xl space-x-2 shadow-black/5 dark:shadow-black/10">
      <ToolbarButton
        label={isFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
        onClick={onToggleFullscreen}
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </ToolbarButton>
      <ToolbarButton label="Replay animation" onClick={onReplay}>
        <RefreshCw size={18} />
      </ToolbarButton>
      <ToolbarButton
        label="Open source code"
        onClick={onOpenSource}
        highlight
      >
        <Code2 size={18} />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
  highlight = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      className={cn(
        "grid size-10 place-items-center rounded-full transition",
        highlight
          ? "bg-foreground text-background"
          : "bg-foreground/6 text-foreground hover:bg-foreground/12",
      )}
    >
      {children}
    </motion.button>
  );
}
