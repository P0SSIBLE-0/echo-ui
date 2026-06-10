"use client";

import { motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

interface CurvedTextMarqueeProps {
  text?: string;
  speed?: number;
  fontSize?: string;
  letterSpacing?: string;
  pathD?: string;
  showPath?: boolean;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

export function CurvedTextMarquee({
  text = "Design in motion • Code in flow • Echo UI Components • ",
  speed = 18,
  fontSize = "20px",
  letterSpacing = "0.15em",
  pathD = "M 0,100 C 150,180 350,20 500,100 C 650,180 850,20 1000,100",
  showPath = true,
  backgroundColor = "#111",
  textColor = "#ffffff",
  className = "",
}: CurvedTextMarqueeProps) {
  const textRef = useRef<SVGTextElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [offsetRange, setOffsetRange] = useState<[string, string]>(["0%", "-100%"]);

  const repeatedText = React.useMemo(() => {
    return Array(20).fill(text).join(" ");
  }, [text]);

  const strokeWidth = React.useMemo(() => {
    const num = parseFloat(fontSize);
    if (isNaN(num)) return 24;
    const isRelative = fontSize.includes("rem") || fontSize.includes("em");
    const pxVal = isRelative ? num * 16 : num;
    return Math.round(pxVal * 1.35);
  }, [fontSize]);

  useEffect(() => {
    if (textRef.current && pathRef.current) {
      const totalTextLength = textRef.current.getComputedTextLength();
      const pathLength = pathRef.current.getTotalLength();
      const oneSegmentLength = totalTextLength / 20;
      const percent = (oneSegmentLength / pathLength) * 100;
      setOffsetRange(["0%", `-${percent}%`]);
    }
  }, [text, fontSize, letterSpacing]);

  return (
    <div className={`relative flex items-center justify-center w-full max-w-4xl overflow-hidden py-10 ${className}`}>
      <svg
        viewBox="0 0 1000 200"
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <path ref={pathRef} id="marquee-path" d={pathD} />
          <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {showPath && (
          <path
            d={pathD}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="opacity-90"
          />
        )}

        <text
          ref={textRef}
          style={{ fontSize, letterSpacing }}
          fill={textColor}
          dy="0.35em"
          className="font-semibold uppercase tracking-widest font-sans"
        >
          <motion.textPath
            href="#marquee-path"
            startOffset="0%"
            animate={{ startOffset: offsetRange }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: speed,
            }}
          >
            {repeatedText}
          </motion.textPath>
        </text>
      </svg>
    </div>
  );
}
