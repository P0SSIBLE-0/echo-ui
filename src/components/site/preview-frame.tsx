"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { PreviewToolbar } from "@/components/site/preview-toolbar";
import { SourceDrawer } from "@/components/site/source-drawer";
import { RegistryComponentRenderer } from "@/registry/component-renderer";
import type { RegistryItem } from "@/registry/registry";

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

  const [prevItemId, setPrevItemId] = useState(item.id);
  if (item.id !== prevItemId) {
    setPrevItemId(item.id);
    setSourceOpen(false);
    setCopied(false);
    setDownloaded(false);
  }

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

      <div className="relative grid h-full place-items-center px-6 pb-12 pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${item.id}-${previewKey}`}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="size-full flex items-center justify-center @container"
          >
            <RegistryComponentRenderer itemId={item.id} />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {sourceOpen ? (
          <SourceDrawer
            item={item}
            onClose={() => setSourceOpen(false)}
            onCopy={handleCopy}
            onDownload={handleDownload}
            copied={copied}
            downloaded={downloaded}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
