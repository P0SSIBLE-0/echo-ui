"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// --- Global Configurations & Utilities ---
const ASCII_CHARS = " .:,-+*=%@##XX@@##**";
const denseChars = ASCII_CHARS.slice(1).split("");
const denseCharsLen = denseChars.length;

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export type AsciiRevealProps = {
  src: string;
  alt?: string;
  className?: string;
  staggerDelay?: number;
  revealDelay?: number;
  columns?: number;
  aspectWidth?: number;
  aspectHeight?: number;
  fontSize?: number;
  cellAppearDelay?: number;
  scrambleCount?: number;
  scrambleSpeed?: number;
};

export function AsciiReveal({
  src,
  alt = "Ascii Reveal Image",
  className = "",
  staggerDelay = 0,
  revealDelay = 200,
  columns = 40,
  aspectWidth = 4,
  aspectHeight = 5,
  fontSize = 14,
  cellAppearDelay = 2,
  scrambleCount = 20,
  scrambleSpeed = 40,
}: AsciiRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let reqId: number;
    let startTimeoutId: NodeJS.Timeout;
    let revealTimeoutId: NodeJS.Timeout;
    let isCancelled = false;

    const mountTime = performance.now();

    const samplingCanvas = document.createElement("canvas");
    const samplingCtx = samplingCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!samplingCtx) return;

    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) return;

    measureCtx.font = `${fontSize}px monospace`;
    const charWidth = Math.ceil(measureCtx.measureText("M").width);
    const charHeight = fontSize;
    const rows = Math.round(
      columns * (aspectHeight / aspectWidth) * (charWidth / charHeight)
    );
    const totalCells = columns * rows;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      if (isCancelled) return;

      const imageAspect = img.width / img.height;
      const itemAspect = aspectWidth / aspectHeight;
      let cropX = 0,
        cropY = 0,
        cropW = img.width,
        cropH = img.height;

      if (imageAspect > itemAspect) {
        cropW = img.height * itemAspect;
        cropX = (img.width - cropW) / 2;
      } else {
        cropH = img.width / itemAspect;
        cropY = (img.height - cropH) / 2;
      }

      samplingCanvas.width = columns;
      samplingCanvas.height = rows;
      samplingCtx.drawImage(
        img,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        columns,
        rows
      );
      const data = samplingCtx.getImageData(0, 0, columns, rows).data;

      const asciiGrid = new Array<string>(totalCells);
      const isDarkGrid = new Uint8Array(totalCells);

      for (let i = 0; i < totalCells; i++) {
        const p = i * 4;
        const brightness =
          (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114) / 255;
        const charIndex = Math.min(
          ASCII_CHARS.length - 1,
          Math.floor((1 - brightness) * ASCII_CHARS.length)
        );
        asciiGrid[i] = ASCII_CHARS[charIndex];
        isDarkGrid[i] = charIndex > 0 ? 1 : 0;
      }

      const dpr = window.devicePixelRatio || 2;
      canvas.width = columns * charWidth * dpr;
      canvas.height = rows * charHeight * dpr;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      ctx.font = `${charHeight}px monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      function drawCharacter(char: string, index: number) {
        if (!ctx) return;
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = col * charWidth;
        const y = row * charHeight;

        ctx.fillStyle = "#111";
        ctx.fillRect(x, y, charWidth, charHeight);
        ctx.fillStyle = "#8c8c8c";
        ctx.fillText(char, x, y);
      }

      const scrambleState = new Int8Array(totalCells).fill(-1);
      const cellOrder = shuffleArray(
        Array.from({ length: totalCells }, (_, i) => i)
      );

      const timeSinceMount = performance.now() - mountTime;
      const delayToStart = Math.max(0, staggerDelay - timeSinceMount);

      startTimeoutId = setTimeout(() => {
        if (isCancelled) return;

        let settledCount = 0;
        let activeScrambleCount = 0;
        let cellsActivated = 0;
        let startTime: number | null = null;
        let lastScrambleTime: number | null = null;

        function frame(timestamp: number) {
          if (isCancelled) return;

          if (!startTime) {
            startTime = timestamp;
            lastScrambleTime = timestamp;
          }

          const elapsed = timestamp - startTime;

          const targetActivated = Math.min(
            totalCells,
            Math.floor(elapsed / cellAppearDelay) + 1
          );

          while (cellsActivated < targetActivated) {
            const cellIndex = cellOrder[cellsActivated];
            if (isDarkGrid[cellIndex]) {
              scrambleState[cellIndex] = scrambleCount;
              activeScrambleCount++;
              drawCharacter(
                denseChars[Math.floor(Math.random() * denseCharsLen)],
                cellIndex
              );
            } else {
              scrambleState[cellIndex] = 0;
              settledCount++;
              drawCharacter(asciiGrid[cellIndex], cellIndex);
            }
            cellsActivated++;
          }

          if (
            activeScrambleCount > 0 &&
            lastScrambleTime !== null &&
            timestamp - lastScrambleTime >= scrambleSpeed
          ) {
            lastScrambleTime = timestamp;
            activeScrambleCount = 0;

            for (let i = 0; i < totalCells; i++) {
              let state = scrambleState[i];
              if (state > 0) {
                state--;
                scrambleState[i] = state;

                if (state === 0) {
                  drawCharacter(asciiGrid[i], i);
                  settledCount++;
                } else {
                  drawCharacter(
                    denseChars[Math.floor(Math.random() * denseCharsLen)],
                    i
                  );
                  activeScrambleCount++;
                }
              }
            }
          }

          if (settledCount < totalCells) {
            reqId = requestAnimationFrame(frame);
          } else {
            revealTimeoutId = setTimeout(() => {
              if (!isCancelled) setIsRevealed(true);
            }, revealDelay);
          }
        }

        reqId = requestAnimationFrame(frame);
      }, delayToStart);
    };

    return () => {
      isCancelled = true;
      if (reqId) cancelAnimationFrame(reqId);
      if (startTimeoutId) clearTimeout(startTimeoutId);
      if (revealTimeoutId) clearTimeout(revealTimeoutId);
    };
  }, [
    src,
    staggerDelay,
    columns,
    aspectWidth,
    aspectHeight,
    fontSize,
    cellAppearDelay,
    scrambleCount,
    scrambleSpeed,
    revealDelay,
  ]);

  return (
    <div
      className={`relative overflow-hidden bg-[#111] ${className}`}
      style={{ aspectRatio: `${aspectWidth} / ${aspectHeight}` }}
    >
      <motion.img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isRevealed ? 1 : 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <motion.canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ opacity: 1 }}
        animate={{ opacity: isRevealed ? 0 : 1 }}
        transition={{ duration: 0.85, ease: "easeInOut" }}
      />
    </div>
  );
}
