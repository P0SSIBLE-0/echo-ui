"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

// Change this hex code to update the color theme of the button and primary actions (default: "#3b82f6" for Blue-500)
const THEME_COLOR = "#3b82f6";

// High-fidelity easeOutExpo curve and duration for aligned, synchronized exit/entrance animations
const TRANSITION_CONFIG = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.35,
} as const;

export interface GenieModalProps {
  /** The text shown on the trigger button. */
  triggerText?: string;
  /** The main title of the modal dialog. */
  title?: string;
  /** The description text or custom React nodes. */
  description?: React.ReactNode;
  /** Optional text for the primary button. If set to null, the button is hidden. */
  primaryButtonText?: string | null;
  /** Callback executed when the primary button is clicked. */
  onPrimaryAction?: () => void;
  /** Optional text for the secondary button. If set to null, the button is hidden. */
  secondaryButtonText?: string | null;
  /** Callback executed when the secondary button is clicked. */
  onSecondaryAction?: () => void;
  /** Custom children elements to render within the modal body. */
  children?: React.ReactNode;
}

export function GenieModal({
  triggerText = "Open dialog",
  title = "Genie modal",
  description = "A spring-loaded entrance that respects the source.",
  primaryButtonText = "Confirm",
  onPrimaryAction,
  secondaryButtonText = "Cancel",
  onSecondaryAction,
  children,
}: GenieModalProps) {
  const [open, setOpen] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handlePrimaryClick = () => {
    onPrimaryAction?.();
    setOpen(false);
  };

  const handleSecondaryClick = () => {
    onSecondaryAction?.();
    setOpen(false);
  };

  const showPrimary = primaryButtonText !== null && primaryButtonText !== undefined;
  const showSecondary = secondaryButtonText !== null && secondaryButtonText !== undefined;

  return (
    <>
      {/* Trigger Button (Remains in DOM at opacity 0 to preserve layout dimensions) */}
      <motion.button
        layoutId="genie-modal-container"
        type="button"
        whileHover={{ filter: "brightness(1.05)" }}
        whileTap={{ scale: 0.96, filter: "brightness(0.95)" }}
        onClick={() => setOpen(true)}
        style={{
          backgroundColor: THEME_COLOR,
          backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(0,0,0,0.15))",
          opacity: open ? 0 : 1,
          pointerEvents: open ? "none" : "auto",
        }}
        className="rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.35),inset_0_-1.5px_0_rgba(0,0,0,0.15),0_4px_12px_-2px_rgba(0,0,0,0.15)] cursor-pointer focus:outline-none"
        transition={TRANSITION_CONFIG}
      >
        <motion.span layoutId="genie-modal-title" className="block text-sm font-semibold text-white">
          {triggerText}
        </motion.span>
      </motion.button>

      {/* Modal Overlay and Dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION_CONFIG}
            className="fixed inset-0 z-50 grid place-items-center bg-black/45 backdrop-blur-xs p-5"
            onClick={() => setOpen(false)}
          >
            <motion.div
              layoutId="genie-modal-container"
              role="dialog"
              aria-modal="true"
              aria-labelledby="genie-title"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-white p-6 text-[#151515] shadow-2xl flex flex-col items-start"
              transition={TRANSITION_CONFIG}
            >
              {/* Fade in content gracefully while layout expands */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{
                  duration: 0.18,
                  delay: 0.04,
                  ease: "easeOut",
                }}
                className="w-full"
              >
                <div className="flex w-full items-center justify-between">
                  <h3 id="genie-title" className="text-xl font-semibold text-[#151515]">
                    <motion.span layoutId="genie-modal-title" className="font-semibold text-[#151515]">
                      {title}
                    </motion.span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-slate-100 hover:bg-slate-200 p-1.5 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-300"
                    aria-label="Close dialog"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {description && (
                  <p className="mt-3 text-sm leading-6 text-[#64645f]">
                    {description}
                  </p>
                )}

                {children}

                {(showPrimary || showSecondary) && (
                  <div className="mt-6 flex justify-end gap-2 w-full">
                    {showSecondary && (
                      <button
                        type="button"
                        onClick={handleSecondaryClick}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                      >
                        {secondaryButtonText}
                      </button>
                    )}
                    {showPrimary && (
                      <motion.button
                        type="button"
                        whileHover={{ filter: "brightness(1.05)" }}
                        whileTap={{ scale: 0.97, filter: "brightness(0.95)" }}
                        onClick={handlePrimaryClick}
                        style={{
                          backgroundColor: THEME_COLOR,
                        }}
                        className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors focus:outline-none"
                      >
                        {primaryButtonText}
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
