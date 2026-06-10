"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { VideoOff } from "lucide-react";

export type AsciiVideoProps = {
  /** Video source URL. Default is a stable high-contrast Pexels video link of ocean waves. */
  src?: string;
  /** Width of the component container. */
  width?: string | number;
  /** Height of the component container. */
  height?: string | number;
  /** Number of columns for ASCII density. */
  columns?: number;
  /** Font size for ASCII characters. */
  fontSize?: number;
};

const ASCII_CHARS = " .:-=+*#$%@";

export function AsciiVideo({
  src = "https://cdn.pixabay.com/video/2022/10/15/135025-760679997_large.mp4",
  width = 540,
  height = "auto",
  columns = 90,
  fontSize = 8
}: AsciiVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || hasError) return;

    let animationId: number;
    let isCancelled = false;

    const handleError = () => {
      setHasError(true);
    };

    video.addEventListener("error", handleError);

    // Measurement canvas to find character width
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) return;

    measureCtx.font = `bold ${fontSize}px monospace`;
    const charWidth = Math.ceil(measureCtx.measureText("M").width) || 5;
    const charHeight = fontSize;

    // Create offscreen canvas for sampling video frames
    const offscreenCanvas = document.createElement("canvas");
    const offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
    if (!offscreenCtx) return;

    // Render loop
    const render = () => {
      if (isCancelled) return;

      animationId = requestAnimationFrame(render);

      if (video.readyState < 2) return;

      const videoW = video.videoWidth;
      const videoH = video.videoHeight;
      if (videoW === 0 || videoH === 0) return;

      const aspect = videoW / videoH;
      const charAspect = charWidth / charHeight;
      const rows = Math.round((columns * charAspect) / aspect);

      const dpr = window.devicePixelRatio || 2;
      const targetWidth = columns * charWidth;
      const targetHeight = rows * charHeight;

      if (canvas.width !== targetWidth * dpr || canvas.height !== targetHeight * dpr) {
        canvas.width = targetWidth * dpr;
        canvas.height = targetHeight * dpr;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clean black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // White text for all characters
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textBaseline = "top";

      // Scale offscreen canvas and draw current video frame
      if (offscreenCanvas.width !== columns || offscreenCanvas.height !== rows) {
        offscreenCanvas.width = columns;
        offscreenCanvas.height = rows;
      }
      offscreenCtx.drawImage(video, 0, 0, columns, rows);

      const frameData = offscreenCtx.getImageData(0, 0, columns, rows);
      const pixels = frameData.data;
      const totalPixels = columns * rows;

      const charsLen = ASCII_CHARS.length;

      for (let i = 0; i < totalPixels; i++) {
        const pIndex = i * 4;
        const r = pixels[pIndex];
        const g = pixels[pIndex + 1];
        const b = pixels[pIndex + 2];

        // Luma formula to calculate pixel brightness (0.0 to 1.0)
        const brightnessValue = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const charIndex = Math.min(
          charsLen - 1,
          Math.floor(brightnessValue * charsLen)
        );
        const char = ASCII_CHARS[charIndex];

        // Skip space drawing to optimize performance
        if (char === " " || char === "") continue;

        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = col * charWidth;
        const y = row * charHeight;

        ctx.fillText(char, x, y);
      }

      ctx.restore();
    };

    // Play the video programmatically
    video.play().catch(() => { });

    // Kickoff loop
    animationId = requestAnimationFrame(render);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationId);
      video.removeEventListener("error", handleError);
    };
  }, [columns, fontSize, hasError, src]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden bg-black text-white shadow-2xl flex items-center justify-center rounded-2xl border border-neutral-900 w-full"
      style={{
        width: "100%",
        maxWidth: width,
        height,
        aspectRatio: "16 / 9"
      }}
    >
      <video
        ref={videoRef}
        src={src}
        crossOrigin="anonymous"
        loop
        muted
        autoPlay
        playsInline
        className="hidden"
      />
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none bg-neutral-950 text-neutral-400">
          <VideoOff className="w-8 h-8 mb-3 text-neutral-500 stroke-[1.5]" />
          <span className="text-[13px] font-medium text-neutral-300">Failed to load video</span>
          <span className="text-[11px] text-neutral-500 mt-1 max-w-[280px] truncate" title={src}>
            {src}
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <canvas ref={canvasRef} className="h-full w-full object-contain" />
        </div>
      )}
    </motion.div>
  );
}
