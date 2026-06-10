"use client";

import React from "react";
import { motion } from "motion/react";

interface LetterSwapProps {
  text?: string;
  className?: string;
  hoverColorClass?: string;
  delayStep?: number;
  direction?: "up" | "down";
}

export default function LetterSwap({
  text = "HOVER TO SWAP LETTERS",
  className = "text-xl font-black tracking-tight",
  hoverColorClass = "text-violet-500",
  delayStep = 0.02,
  direction = "up"
}: LetterSwapProps) {
  const letters = Array.from(text);

  return (
    <motion.span
      className={`inline-flex flex-wrap cursor-pointer ${className}`}
      initial="initial"
      whileHover="hover"
      variants={{
        initial: {},
        hover: {}
      }}
    >
      {letters.map((char, index) => {
        if (char === " ") {
          return (
            <span key={index} className="inline-block">
              &nbsp;
            </span>
          );
        }

        const letterVariants = {
          initial: {
            y: "0%"
          },
          hover: {
            y: direction === "up" ? "-100%" : "100%",
            transition: {
              duration: 0.35,
              ease: [0.215, 0.61, 0.355, 1] as const,
              delay: index * delayStep
            }
          }
        };

        return (
          <span
            key={index}
            className="relative inline-block overflow-hidden h-[1.2em] leading-[1.2em]"
            style={{ verticalAlign: "top" }}
          >
            {/* Primary letter (slides out) */}
            <motion.span
              variants={letterVariants}
              className="inline-block"
            >
              {char}
            </motion.span>

            {/* Swapped letter (slides in) */}
            <motion.span
              className={`absolute left-0 inline-block ${hoverColorClass}`}
              style={{
                top: direction === "up" ? "100%" : "-100%"
              }}
              variants={letterVariants}
            >
              {char}
            </motion.span>
          </span>
        );
      })}
    </motion.span>
  );
}
