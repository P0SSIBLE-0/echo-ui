"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";

// --- Web Audio API Synth click sound (Self-contained, no external audio files required) ---
let audioCtx: AudioContext | null = null;

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const synthTone = (ctx: AudioContext, type: OscillatorType, freq: number, target: number, vol: number, dur: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(target, ctx.currentTime + dur);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.005);
};

const playClick = (isRelease = false) => {
  try {
    const AudioCtx =
      window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();

    synthTone(audioCtx, "sine", isRelease ? 700 : 1100, isRelease ? 250 : 400, isRelease ? 0.08 : 0.15, 0.01);
    synthTone(audioCtx, "triangle", isRelease ? 140 : 180, 50, isRelease ? 0.04 : 0.08, 0.02);
  } catch { }
};

export interface ClickyButtonProps extends HTMLMotionProps<"button"> {
  children?: React.ReactNode;
  led?: boolean | "blinking";
  soundEnabled?: boolean;
}

// --- Reusable Component ---
export function ClickyButton({
  children = "Click me",
  led = true,
  soundEnabled = true,
  className = "",
  ...props
}: ClickyButtonProps) {
  const play = (isRelease: boolean) => soundEnabled && playClick(isRelease);

  const ledClass = led === "blinking"
    ? "bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse"
    : led
      ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]"
      : "bg-neutral-800 border border-neutral-700/50 shadow-none";

  return (
    <motion.button
      type="button"
      onPointerDown={(e) => { play(false); props.onPointerDown?.(e); }}
      onPointerUp={(e) => { play(true); props.onPointerUp?.(e); }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") play(false);
        props.onKeyDown?.(e);
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") play(true);
        props.onKeyUp?.(e);
      }}
      whileHover="hover"
      whileTap="press"
      className={`relative select-none cursor-pointer p-0 border-none bg-transparent outline-none ${className}`}
      {...props}
    >
      {/* 3D Depth Base */}
      <div className="absolute inset-x-0 top-0 bottom-[-2px] rounded-xl bg-slate-400 border-b-2 border-slate-600 shadow-sm" />

      {/* Button Cap */}
      <motion.div
        variants={{ hover: { y: -8 }, press: { y: 0 } }}
        initial={{ y: -6 }}
        transition={{ type: "spring", stiffness: 390, damping: 25 }}
        className="relative flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-xl border bg-linear-to-b from-white to-slate-200 text-slate-800 border-slate-100 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.6)] hover:from-white hover:to-slate-100 hover:text-slate-900"
      >
        {led !== false ? (
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${ledClass}`}
          />
        ) : null}
        {children}
      </motion.div>
    </motion.button>
  );
}

export default ClickyButton;
