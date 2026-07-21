"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { PreviewToolbar } from "@/components/site/preview-toolbar";
import { RegistryComponentRenderer } from "@/registry/component-renderer";
import type { RegistryItem } from "@/registry/registry";
import { cn } from "@/lib/utils";

const SourceDrawer = dynamic(
  () =>
    import("@/components/site/source-drawer").then((m) => ({
      default: m.SourceDrawer,
    })),
  { ssr: false }
);

type PreviewFrameProps = {
  item: RegistryItem;
};

export function PreviewFrame({ item }: PreviewFrameProps) {
  const [previewKey, setPreviewKey] = useState(0);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && sourceOpen) {
        setSourceOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sourceOpen]);

  useEffect(() => {
    setSourceOpen(false);
    setCopied(false);
    setDownloaded(false);
  }, [item.id]);

  const handleReplay = useCallback(() => {
    setPreviewKey((value) => value + 1);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(item.code || "");
    } catch {
      // Some embedded browsers block clipboard writes; the code remains visible.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [item.code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([item.code || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = item.sourceFile;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1800);
  }, [item.code, item.sourceFile]);

  const handleToggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }, []);

  return (
    <>
      <PreviewToolbar
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onReplay={handleReplay}
        onOpenSource={() => setSourceOpen(true)}
      />

      <div
        className={cn(
          "relative grid h-full rounded-2xl place-items-center md:px-4 pb-8 pt-.5 transition-transform duration-300 ease-out z-10",
          sourceOpen ? "lg:translate-x-60" : "translate-x-0"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${item.id}-${previewKey}`}
            initial={{ opacity: 0, y: 26, filter: 'blur(8px)', scale: 0.85 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.2, ease: [0.8, .45, 0.36, 1] }}
            className="size-full flex items-center justify-center @container"
          >
            <RegistryComponentRenderer itemId={item.id} />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {sourceOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close source drawer"
              className="absolute inset-0 z-25 bg-black/50 backdrop-blur-xs rounded-none cursor-pointer border-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSourceOpen(false)}
            />
            <SourceDrawer
              item={item}
              onClose={() => setSourceOpen(false)}
              onCopy={handleCopy}
              onDownload={handleDownload}
              copied={copied}
              downloaded={downloaded}
            />
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
