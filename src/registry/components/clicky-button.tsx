"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { Sparkles } from "lucide-react";

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
  icon?: React.ReactNode;
  rounded?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  soundEnabled?: boolean;
}

export function ClickyButton({
  children = "Click me",
  icon = <Sparkles className="size-3.5 text-white-400" />,
  soundEnabled = true,
  rounded = "xl",
  className = "",
  ...props
}: ClickyButtonProps) {
  const play = (isRelease: boolean) => soundEnabled && playClick(isRelease);

  return (
    <motion.button
      type="button"
      onPointerDown={(e) => {
        play(false);
        props.onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        play(true);
        props.onPointerUp?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") play(false);
        props.onKeyDown?.(e);
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") play(true);
        props.onKeyUp?.(e);
      }}
      className={`relative inline-flex select-none cursor-pointer p-0 border-none bg-transparent outline-none group ${className}`}
      {...props}
    >
      {/* 3D Depth Base Layer */}
      <div className={`absolute inset-0 bg-zinc-900/70 border border-zinc-700/60 shadow-md rounded-${rounded}`} />

      {/* Button Front Cap */}
      <motion.div
        initial={{ y: -3 }}
        whileHover={{ y: -4 }}
        whileTap={{ y: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={`relative flex items-center justify-center gap-2 text-sm font-semibold border border-zinc-800/90 bg-linear-to-b from-zinc-700 to-zinc-950 text-zinc-100 shadow-[inset_0_1px_3px_1px_rgba(255,255,255,0.15),0_1px_5px_rgba(0,0,0,0.4)] group-hover:border-zinc-700 transition-colors px-6 py-2.5 rounded-${rounded}`}
      >
        {icon && (
          <span className="inline-flex items-center justify-center shrink-0">
            {icon}
          </span>
        )}
        {children}
      </motion.div>
    </motion.button>
  );
}

export default ClickyButton;
