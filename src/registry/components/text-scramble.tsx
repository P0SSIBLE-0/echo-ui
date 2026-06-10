"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TextScrambleProps {
  children?: string;
  speed?: number;
  autoStart?: boolean;
  className?: string;
  symbols?: string;
}

export default function TextScramble({
  children = "TEXT SCRAMBLE EFFECT",
  speed = 40,
  autoStart = true,
  className = "text-xl font-mono font-bold tracking-wider text-black",
  symbols = "!@#$%^&*()_+~}{[]|:;?><"
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(() => (autoStart ? "" : children));
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  const startScramble = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsAnimating(true);
    const length = children.length;
    const startTime = Date.now();

    const tick = () => {
      const timePassed = Date.now() - startTime;
      const revealedCount = Math.floor(timePassed / speed);

      if (revealedCount >= length) {
        setDisplayText(children);
        setIsAnimating(false);
        return;
      }

      let currentText = "";
      for (let i = 0; i < length; i++) {
        if (i < revealedCount) {
          currentText += children[i];
        } else if (children[i] === " ") {
          currentText += " ";
        } else {
          const randIndex = Math.floor(Math.random() * symbols.length);
          currentText += symbols[randIndex];
        }
      }

      setDisplayText(currentText);
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
  }, [children, speed, symbols]);

  useEffect(() => {
    if (!autoStart) return;

    const frameId = requestAnimationFrame(() => {
      startScramble();
    });
    return () => {
      cancelAnimationFrame(frameId);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [children, autoStart, startScramble]);

  return (
    <span
      className={`${className} cursor-pointer`}
      onClick={!isAnimating ? startScramble : undefined}
      title="Click to scramble again"
    >
      {displayText}
    </span>
  );
}
