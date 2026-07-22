"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface PaperBurnProps {
  title?: string;
  content?: string;
  author?: string;
  date?: string;
  burnCorner?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  onDelete?: () => void;
  onBurnComplete?: () => void;
  width?: number;
  height?: number;
  burnDuration?: number;
  className?: string;
}

type ParticleKind = "ember" | "ash" | "smoke";

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  rot: number;
  rotV: number;
  heat: number;
  alpha: number;
  color: string;
}

/* ── Lightweight Procedural Noise ── */
function hash2(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, seed), b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed), d = hash2(x0 + 1, y0 + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, seed: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) {
    v += a * valueNoise(x * f, y * f, seed + i * 19);
    a *= 0.5; f *= 2.05;
  }
  return v;
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
    </svg>
  );
}

/* ── Burn Map & Raymarching Helpers ── */
interface BurnMap {
  data: Float32Array;
  mw: number;
  mh: number;
  scale: number;
  maxDist: number;
  ix: number;
  iy: number;
}

function createBurnMap(w: number, h: number, ix: number, iy: number, seed: number): BurnMap {
  const scale = 2;
  const mw = Math.ceil(w / scale), mh = Math.ceil(h / scale);
  const data = new Float32Array(mw * mh);
  const maxDist = Math.hypot(w, h);

  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const px = x * scale + scale * 0.5, py = y * scale + scale * 0.5;
      const dx = px - ix, dy = py - iy;
      const dist = Math.hypot(dx, dy) / maxDist;
      const angle = Math.atan2(dy, dx);
      const ca = Math.cos(angle), sa = Math.sin(angle);

      const nAng = fbm(ca * 2.6, sa * 2.6, seed);
      const nAng2 = fbm(ca * 5.1 + 1.7, sa * 5.1, seed + 11);
      const nAng3 = fbm(ca * 9.4 - 0.8, sa * 9.4, seed + 23);
      const nSpat = fbm(px * 0.019 + seed * 0.1, py * 0.019, seed + 3);
      const nSpat2 = fbm(px * 0.055, py * 0.055 + 12, seed + 19);
      const wind = 0.08 * Math.sin(angle * 2.0 + seed * 0.45) + 0.05 * Math.sin(angle * 5.3 - seed);

      const warp = (nAng - 0.5) * 0.42 + (nAng2 - 0.5) * 0.22 + (nAng3 - 0.5) * 0.1 + (nSpat - 0.5) * 0.14 + wind;
      const freckle = (nSpat - 0.5) * 0.05 + (nSpat2 - 0.5) * 0.028;

      data[y * mw + x] = Math.max(0.001, Math.min(0.998, dist * (1.0 + warp) + freckle));
    }
  }
  return { data, mw, mh, scale, maxDist, ix, iy };
}

function sampleBurn(map: BurnMap, px: number, py: number): number {
  const { data, mw, mh, scale } = map;
  const x = px / scale - 0.5, y = py / scale - 0.5;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  if (x0 < 0 || y0 < 0 || x0 >= mw - 1 || y0 >= mh - 1) {
    return data[Math.max(0, Math.min(mh - 1, y0)) * mw + Math.max(0, Math.min(mw - 1, x0))];
  }
  const fx = x - x0, fy = y - y0;
  const i = y0 * mw + x0;
  return data[i] * (1 - fx) * (1 - fy) + data[i + 1] * fx * (1 - fy) + data[i + mw] * (1 - fx) * fy + data[i + mw + 1] * fx * fy;
}

interface FrontPoint {
  x: number;
  y: number;
  angle: number;
  variance: number;
}

function sampleFront(map: BurnMap, progress: number, w: number, h: number, steps: number, time = 0): FrontPoint[] {
  const pts: FrontPoint[] = [];
  const { ix, iy, maxDist } = map;
  const pad = 10;

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    let lo = 0, hi = maxDist * 1.15;

    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) * 0.5;
      if (sampleBurn(map, ix + cos * mid, iy + sin * mid) < progress) lo = mid;
      else hi = mid;
    }
    let r = (lo + hi) * 0.5;
    const flicker = Math.sin(time * 17 + angle * 11) * 1.1 + Math.sin(time * 29 + angle * 3.7) * 0.55 + (hash2(i * 1.7, time * 2.1, 4.2) - 0.5) * 1.4;
    r = Math.max(0, r + flicker);

    const curl = (0.6 + 0.4 * Math.sin(angle * 4.2 + time * 3.5)) * (1.2 + hash2(angle, 2.2, 1.1) * 2.4);
    const x = ix + cos * r - cos * curl * 0.35;
    const y = iy + sin * r - sin * curl * 0.35;

    if (x >= -pad && x <= w + pad && y >= -pad && y <= h + pad) {
      if (x >= -3 && x <= w + 3 && y >= -3 && y <= h + 3) {
        const variance = 0.35 + 0.65 * (0.5 * hash2(Math.cos(angle) * 8, Math.sin(angle) * 8, 9.1) + 0.5 * (0.5 + 0.5 * Math.sin(angle * 7.3 + 1.2)));
        pts.push({ x, y, angle, variance });
      }
    }
  }
  return pts;
}

export function PaperBurn({
  title = "Project Note",
  content = "This task has been completed and verified. Click delete to burn and remove this paper sheet from the document list.",
  author = "Team",
  date = "July 22, 2026",
  burnCorner = "bottom-right",
  onDelete,
  onBurnComplete,
  width = 380,
  height = 460,
  burnDuration = 3.5,
  className = "",
}: PaperBurnProps) {
  const [isBurning, setIsBurning] = useState(false);
  const [isConsumed, setIsConsumed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pristineRef = useRef<HTMLCanvasElement | null>(null);
  const burnMapRef = useRef<BurnMap | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskUpscaleRef = useRef<HTMLCanvasElement | null>(null);
  const scorchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scorchImgRef = useRef<ImageData | null>(null);
  const maskImgRef = useRef<ImageData | null>(null);
  const completedRef = useRef(false);

  const MAX_EMBERS = 90, MAX_ASH = 70, MAX_SMOKE = 55;

  const countKind = (kind: ParticleKind) => {
    let n = 0;
    const arr = particlesRef.current;
    for (let i = 0; i < arr.length; i++) if (arr[i].kind === kind) n++;
    return n;
  };

  /* ── Pristine Paper Render ── */
  const renderPristinePaper = useCallback(() => {
    const offscreen = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    offscreen.width = Math.round(width * dpr);
    offscreen.height = Math.round(height * dpr);
    const ctx = offscreen.getContext("2d");
    if (!ctx) return null;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const radius = 2;

    const bgGrad = ctx.createLinearGradient(0, 0, width * 0.3, height);
    bgGrad.addColorStop(0, "#fbf7f0");
    bgGrad.addColorStop(0.55, "#f5efe4");
    bgGrad.addColorStop(1, "#efe6d6");
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.clip();
    for (let i = 0; i < 900; i++) {
      const gx = hash2(i, 1, 3.1) * width, gy = hash2(i, 2, 7.7) * height;
      ctx.fillStyle = `rgba(90, 70, 40, ${0.03 + hash2(i, 3, 1.2) * 0.05})`;
      ctx.fillRect(gx, gy, 1 + (hash2(i, 4, 2) > 0.7 ? 1 : 0), 1);
    }
    ctx.strokeStyle = "rgba(160, 140, 110, 0.08)";
    ctx.lineWidth = 1;
    for (let ly = 118; ly < height - 48; ly += 26) {
      ctx.beginPath(); ctx.moveTo(28, ly); ctx.lineTo(width - 28, ly); ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.roundRect(0, 0, width, height, radius); ctx.clip();
    const vig = ctx.createRadialGradient(width * 0.5, height * 0.45, Math.min(width, height) * 0.2, width * 0.5, height * 0.5, Math.hypot(width, height) * 0.55);
    vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(90,70,40,0.07)");
    ctx.fillStyle = vig; ctx.fillRect(0, 0, width, height); ctx.restore();

    ctx.strokeStyle = "rgba(170, 150, 120, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(0.5, 0.5, width - 1, height - 1, radius); ctx.stroke();

    ctx.fillStyle = "#8a7b6a";
    ctx.font = "500 11px 'Segoe UI', Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(date.toUpperCase(), 32, 40);

    ctx.fillStyle = "#1c1612";
    ctx.font = "600 22px 'Segoe Script', 'Apple Chancery', 'Bradley Hand', cursive, Georgia, serif";
    ctx.fillText(title, 32, 74);

    ctx.strokeStyle = "rgba(130, 110, 85, 0.2)";
    ctx.beginPath(); ctx.moveTo(32, 92); ctx.lineTo(width - 32, 92); ctx.stroke();

    ctx.fillStyle = "#3d342c";
    ctx.font = "400 15px 'Segoe Script', 'Apple Chancery', 'Bradley Hand', cursive, Georgia, serif";

    const lines = content.split("\n");
    let y = 128;
    const maxW = width - 64;

    lines.forEach((line) => {
      if (!line.trim()) { y += 12; return; }
      const words = line.split(" ");
      let current = "";
      for (let i = 0; i < words.length; i++) {
        const test = current + words[i] + " ";
        if (ctx.measureText(test).width > maxW && i > 0) {
          ctx.fillText(current.trimEnd(), 32 + Math.sin(y * 0.15) * 0.8, y);
          current = words[i] + " "; y += 26;
        } else { current = test; }
      }
      if (current.trim()) {
        ctx.fillText(current.trimEnd(), 32 + Math.sin(y * 0.15) * 0.8, y);
        y += 26;
      }
    });

    if (author) {
      ctx.fillStyle = "#6b5f52";
      ctx.font = "italic 14px 'Segoe Script', 'Apple Chancery', cursive, Georgia, serif";
      ctx.fillText(`— ${author}`, 32, height - 36);
    }
    return offscreen;
  }, [width, height, title, content, author, date]);

  /* ── Burn Mask Canvas Painting ── */
  const paintBurnMask = (map: BurnMap, progress: number, dpr: number): HTMLCanvasElement | null => {
    let mask = maskCanvasRef.current;
    if (!mask) { mask = document.createElement("canvas"); maskCanvasRef.current = mask; }
    const mw = map.mw, mh = map.mh;
    if (mask.width !== mw || mask.height !== mh) {
      mask.width = mw; mask.height = mh; maskImgRef.current = null;
    }
    const mctx = mask.getContext("2d", { willReadFrequently: false });
    if (!mctx) return null;

    let img = maskImgRef.current;
    if (!img || img.width !== mw || img.height !== mh) {
      img = mctx.createImageData(mw, mh); maskImgRef.current = img;
    }
    const data = img.data, burn = map.data, soft = 0.055;

    for (let i = 0, p = 0; i < burn.length; i++, p += 4) {
      const t = burn[i];
      const localSoft = soft * (0.72 + 0.55 * hash2(i % mw, (i / mw) | 0, 6.3));
      let a = 0;
      if (progress >= t + localSoft) a = 255;
      else if (progress > t) {
        const u = (progress - t) / localSoft;
        a = u * u * (3 - 2 * u) * 255;
      }
      data[p + 3] = a | 0;
    }
    mctx.putImageData(img, 0, 0);

    let full = maskUpscaleRef.current;
    const fw = Math.round(width * dpr), fh = Math.round(height * dpr);
    if (!full || full.width !== fw || full.height !== fh) {
      full = document.createElement("canvas"); full.width = fw; full.height = fh; maskUpscaleRef.current = full;
    }
    const fctx = full.getContext("2d");
    if (!fctx) return mask;
    fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fw, fh);
    fctx.imageSmoothingEnabled = true; fctx.imageSmoothingQuality = "high";
    fctx.drawImage(mask, 0, 0, fw, fh);
    return full;
  };

  /* ── Scorch Pre-Burn Overlay ── */
  const paintScorchOverlay = (map: BurnMap, progress: number): HTMLCanvasElement | null => {
    let scorch = scorchCanvasRef.current;
    if (!scorch) { scorch = document.createElement("canvas"); scorchCanvasRef.current = scorch; }
    const mw = map.mw, mh = map.mh;
    if (scorch.width !== mw || scorch.height !== mh) {
      scorch.width = mw; scorch.height = mh; scorchImgRef.current = null;
    }
    const sctx = scorch.getContext("2d");
    if (!sctx) return null;

    let img = scorchImgRef.current;
    if (!img || img.width !== mw || img.height !== mh) {
      img = sctx.createImageData(mw, mh); scorchImgRef.current = img;
    }
    const data = img.data, burn = map.data, band = 0.12;

    for (let i = 0, p = 0; i < burn.length; i++, p += 4) {
      const t = burn[i], ahead = t - progress;
      let a = 0;
      if (ahead > 0 && ahead < band) {
        const u = 1 - ahead / band;
        a = Math.min(255, u * u * (0.35 + 0.65 * u) * (0.55 + 0.45 * hash2(i % mw, (i / mw) | 0, 5.5)) * 210);
      } else if (ahead <= 0 && ahead > -0.04) {
        a = Math.min(255, (1 + ahead / 0.04) * 180 * (0.5 + 0.5 * hash2(i, 3, 2.2)));
      }
      const heat = a / 255;
      data[p] = (28 + heat * 40) | 0; data[p + 1] = (14 + heat * 12) | 0; data[p + 2] = (6 + heat * 4) | 0; data[p + 3] = a | 0;
    }
    sctx.putImageData(img, 0, 0);
    return scorch;
  };

  /* ── Particle Spawning ── */
  const spawnAlongFront = (front: FrontPoint[], progress: number, intensity: number) => {
    if (front.length === 0 || progress >= 0.99) return;
    const embers = countKind("ember"), ashes = countKind("ash"), smokes = countKind("smoke");

    const emberBudget = Math.min(5, Math.floor(2 + intensity * 4), MAX_EMBERS - embers);
    for (let i = 0; i < emberBudget; i++) {
      const p = front[(Math.random() * front.length) | 0];
      particlesRef.current.push({
        kind: "ember", x: p.x + (Math.random() - 0.5) * 6, y: p.y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 1.8, vy: -1.4 - Math.random() * 3.2,
        size: 0.8 + Math.random() * 2.4, life: 1, maxLife: 0.35 + Math.random() * 0.65,
        rot: 0, rotV: 0, heat: 0.55 + Math.random() * 0.45, alpha: 1, color: "",
      });
    }

    const ashBudget = Math.min(3, Math.floor(1 + intensity * 2), MAX_ASH - ashes);
    for (let i = 0; i < ashBudget; i++) {
      if (Math.random() > 0.55) continue;
      const p = front[(Math.random() * front.length) | 0];
      particlesRef.current.push({
        kind: "ash", x: p.x + (Math.random() - 0.5) * 8, y: p.y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.9, vy: -0.35 - Math.random() * 1.1,
        size: 1.2 + Math.random() * 2.8, life: 1, maxLife: 0.9 + Math.random() * 1.4,
        rot: Math.random() * Math.PI, rotV: (Math.random() - 0.5) * 0.08,
        heat: 0, alpha: 0.55 + Math.random() * 0.35, color: Math.random() > 0.5 ? "#2a2420" : "#4a4038",
      });
    }

    const smokeBudget = Math.min(2, Math.floor(intensity * 2.5), MAX_SMOKE - smokes);
    for (let i = 0; i < smokeBudget; i++) {
      if (Math.random() > 0.5) continue;
      const p = front[(Math.random() * front.length) | 0];
      particlesRef.current.push({
        kind: "smoke", x: p.x + (Math.random() - 0.5) * 10, y: p.y - 2,
        vx: (Math.random() - 0.5) * 0.5, vy: -0.5 - Math.random() * 1.2,
        size: 6 + Math.random() * 14, life: 1, maxLife: 1.2 + Math.random() * 1.8,
        rot: Math.random() * Math.PI, rotV: (Math.random() - 0.5) * 0.02,
        heat: 0, alpha: 0.12 + Math.random() * 0.16, color: "",
      });
    }
  };

  /* ── Main Burn Loop ── */
  const handleBurn = () => {
    if (isBurning || isConsumed || completedRef.current) return;
    setIsBurning(true); onDelete?.();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);

    const pristine = pristineRef.current ?? renderPristinePaper();
    if (!pristine) return;
    pristineRef.current = pristine;

    let ix = width, iy = height;
    if (burnCorner === "bottom-left") { ix = 0; iy = height; }
    else if (burnCorner === "top-right") { ix = width; iy = 0; }
    else if (burnCorner === "top-left") { ix = 0; iy = 0; }

    const seed = Math.random() * 100;
    const burnMap = createBurnMap(width, height, ix, iy, seed);
    burnMapRef.current = burnMap;
    particlesRef.current = [];
    startTimeRef.current = performance.now();
    completedRef.current = false;

    const animate = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = (now - startTimeRef.current) / 1000;
      const raw = Math.min(elapsed / burnDuration, 1);
      const progress = raw * raw * (3 - 2 * raw);
      const burnP = Math.min(1, progress * 1.02);
      const intensity = burnP < 0.08 ? burnP / 0.08 : burnP > 0.92 ? Math.max(0, (1 - burnP) / 0.08) : 1;

      const burnMask = paintBurnMask(burnMap, burnP, dpr);
      const scorch = paintScorchOverlay(burnMap, burnP);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(pristine, 0, 0, canvas.width, canvas.height);

      if (scorch) {
        ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.imageSmoothingEnabled = true;
        ctx.drawImage(scorch, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-atop"; ctx.globalAlpha = 0.22;
        ctx.drawImage(scorch, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1; ctx.restore();
      }

      if (burnMask) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(burnMask, 0, 0);
        ctx.globalCompositeOperation = "source-over";
      }

      const front = sampleFront(burnMap, burnP, width, height, 112, elapsed);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (front.length > 2 && burnP < 0.995) {
        ctx.save(); ctx.globalCompositeOperation = "source-atop";

        const drawFrontStroke = (widthPx: number, color: string, blur: number) => {
          ctx.strokeStyle = color; ctx.lineJoin = "round"; ctx.lineCap = "round";
          if (blur > 0) { ctx.shadowBlur = blur; ctx.shadowColor = color; } else { ctx.shadowBlur = 0; }
          ctx.beginPath();
          let started = false, prev: FrontPoint | null = null;
          for (let i = 0; i < front.length; i++) {
            const p = front[i];
            if (p.x < -4 || p.x > width + 4 || p.y < -4 || p.y > height + 4) { started = false; prev = null; continue; }
            if (!started || !prev) { ctx.moveTo(p.x, p.y); started = true; }
            else {
              if (Math.hypot(p.x - prev.x, p.y - prev.y) > 52) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
            prev = p;
          }
          ctx.lineWidth = widthPx; ctx.stroke();
        };

        drawFrontStroke(18, "rgba(12, 6, 3, 0.88)", 0);
        drawFrontStroke(12, "rgba(32, 14, 6, 0.82)", 0);
        drawFrontStroke(8, "rgba(90, 32, 8, 0.55)", 2);
        ctx.shadowBlur = 0;

        const rimStep = Math.max(1, (front.length / 64) | 0);
        for (let i = 0; i < front.length; i += rimStep) {
          const p = front[i];
          if (p.x < -2 || p.x > width + 2 || p.y < -2 || p.y > height + 2) continue;
          const flick = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(elapsed * 22 + p.angle * 13 + p.variance * 9) * Math.sin(elapsed * 11 + p.angle * 4));
          const local = p.variance * flick * intensity;
          if (local < 0.08) continue;

          const charR = 5 + local * 10 + p.variance * 4;
          const charG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, charR);
          const charA = 0.35 + local * 0.5;
          charG.addColorStop(0, `rgba(22, 10, 4, ${charA})`);
          charG.addColorStop(0.45, `rgba(48, 22, 8, ${charA * 0.55})`);
          charG.addColorStop(1, "rgba(30, 14, 6, 0)");
          ctx.fillStyle = charG; ctx.beginPath(); ctx.arc(p.x, p.y, charR, 0, Math.PI * 2); ctx.fill();

          const er = 2.2 + local * 5.5;
          const ex = p.x + Math.sin(p.angle * 3 + elapsed * 6) * 0.8;
          const ey = p.y - 0.6 - local * 1.8;
          const ember = ctx.createRadialGradient(ex, ey, 0, ex, ey, er * 2.1);
          if (local > 0.7) {
            ember.addColorStop(0, `rgba(255, 250, 220, ${0.75 * local})`);
            ember.addColorStop(0.25, `rgba(255, 200, 80, ${0.7 * local})`);
            ember.addColorStop(0.55, `rgba(255, 110, 20, ${0.55 * local})`);
            ember.addColorStop(1, "rgba(180, 40, 0, 0)");
          } else {
            ember.addColorStop(0, `rgba(255, 170, 50, ${0.55 * local})`);
            ember.addColorStop(0.4, `rgba(230, 80, 15, ${0.4 * local})`);
            ember.addColorStop(1, "rgba(80, 20, 0, 0)");
          }
          ctx.fillStyle = ember; ctx.beginPath(); ctx.arc(ex, ey, er * 2.1, 0, Math.PI * 2); ctx.fill();
        }

        drawFrontStroke(6, "rgba(255, 115, 15, 0.95)", 14);
        drawFrontStroke(3.2, "rgba(255, 195, 60, 0.95)", 8);
        drawFrontStroke(1.4, "rgba(255, 250, 210, 0.92)", 4);

        const sparkStep = Math.max(1, (front.length / 42) | 0);
        for (let i = 0; i < front.length; i += sparkStep) {
          const p = front[i];
          if (p.x < -2 || p.x > width + 2 || p.y < -2 || p.y > height + 2) continue;
          const pulse = 0.4 + 0.6 * Math.max(0, Math.sin(elapsed * 14 + p.angle * 9 + p.variance * 6));
          if (pulse * p.variance * intensity < 0.22) continue;

          const flick = (5 + p.variance * 12 * intensity) * pulse;
          const lean = (Math.random() - 0.5) * 5;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x + lean, p.y - flick, flick * 1.1);
          g.addColorStop(0, `rgba(255, 245, 190, ${0.9 * pulse})`);
          g.addColorStop(0.3, `rgba(255, 140, 25, ${0.65 * pulse})`);
          g.addColorStop(0.7, `rgba(210, 45, 8, ${0.25 * pulse})`);
          g.addColorStop(1, "rgba(40, 10, 0, 0)");
          ctx.fillStyle = g; ctx.beginPath();
          ctx.ellipse(p.x + lean * 0.3, p.y - flick * 0.35, 2.2 + p.variance * 2.5, flick * 0.5, lean * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.globalCompositeOperation = "source-over";
      if (burnP < 0.97) spawnAlongFront(front, burnP, intensity);

      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const e = parts[i];
        const lifeRatio = e.life / e.maxLife;

        if (e.kind === "ember") {
          e.vx += (Math.random() - 0.5) * 0.15; e.vy -= 0.02;
          e.x += e.vx + Math.sin(elapsed * 7 + e.y * 0.05) * 0.35; e.y += e.vy; e.life -= 0.016;
        } else if (e.kind === "ash") {
          e.vx += (Math.random() - 0.5) * 0.06;
          e.x += e.vx + Math.sin(elapsed * 3 + e.y * 0.08) * 0.55; e.y += e.vy; e.rot += e.rotV; e.life -= 0.01;
        } else {
          e.vx += (Math.random() - 0.5) * 0.04; e.size += 0.08;
          e.x += e.vx + Math.sin(elapsed * 2 + e.y * 0.03) * 0.4; e.y += e.vy; e.life -= 0.008;
        }

        if (e.life <= 0 || e.y < -40) { parts.splice(i, 1); continue; }

        if (e.kind === "ember") {
          const h = e.heat * lifeRatio;
          let r = 255, g = 80, b = 10;
          if (h > 0.75) { r = 255; g = 240; b = 200; }
          else if (h > 0.45) { r = 255; g = 170; b = 40; }
          else if (h > 0.2) { r = 255; g = 90; b = 15; }
          else { r = 180; g = 40; b = 10; }

          ctx.globalAlpha = Math.min(1, lifeRatio * 1.2);
          const rad = e.size * (1.2 + lifeRatio);
          const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, rad * 2.2);
          grd.addColorStop(0, `rgba(${r},${g},${b},1)`);
          grd.addColorStop(0.4, `rgba(${r},${g},${b},0.55)`);
          grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(e.x, e.y, rad * 2.2, 0, Math.PI * 2); ctx.fill();
        } else if (e.kind === "ash") {
          ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot);
          ctx.globalAlpha = e.alpha * lifeRatio; ctx.fillStyle = e.color;
          ctx.fillRect(-e.size * 0.5, -e.size * 0.35, e.size, e.size * 0.7);
          ctx.restore();
        } else {
          ctx.globalAlpha = e.alpha * lifeRatio;
          const sg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size);
          sg.addColorStop(0, "rgba(60, 55, 50, 0.55)");
          sg.addColorStop(0.45, "rgba(80, 75, 70, 0.22)");
          sg.addColorStop(1, "rgba(90, 90, 90, 0)");
          ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      const particlesLeft = parts.length;
      if (raw < 1 || particlesLeft > 0) {
        if (raw >= 1 && particlesLeft > 0 && elapsed > burnDuration + 1.2) parts.length = 0;
        if (raw < 1 || particlesLeft > 0) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
      }

      if (!completedRef.current) {
        completedRef.current = true; setIsBurning(false); setIsConsumed(true); onBurnComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isBurning || isConsumed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const paper = renderPristinePaper();
    if (!ctx || !paper) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(paper, 0, 0, canvas.width, canvas.height);
    pristineRef.current = paper;
  }, [renderPristinePaper, width, height, isBurning, isConsumed]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isConsumed && (
        <motion.div
          initial={{ opacity: 1, scale: 1, height: "auto" }}
          exit={{
            opacity: 0,
            scale: 0.94,
            transition: { duration: 0.3, ease: "easeInOut" },
          }}
          className={`relative group inline-block ${className}`}
          style={{ width }}
        >
          {!isBurning && (
            <button
              type="button"
              onClick={handleBurn}
              title="Burn note"
              aria-label="Burn and delete note"
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-900/5 hover:bg-red-500/10 text-stone-600 hover:text-red-600 transition-all cursor-pointer border border-stone-900/10 hover:border-red-500/20"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}

          <canvas
            ref={canvasRef}
            style={{
              width,
              height,
              background: "transparent",
              filter: isBurning
                ? "drop-shadow(0 0px 6px 24px rgba(28, 20, 12, 0.22))"
                : "drop-shadow(0 0px 6px 24px rgba(28, 20, 12, 0.18)) drop-shadow(0 0px 6px 13px rgba(28, 20, 12, 0.1))",
            }}
            className="block bg-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PaperBurn;
