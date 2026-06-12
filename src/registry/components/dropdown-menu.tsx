"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown, Edit3, Settings, BarChart2, Share2, Copy, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownItem = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  shortcut?: string;
  isDanger?: boolean;
};

export interface DropdownMenuProps {
  items?: DropdownItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

const DEFAULT_DROPDOWN_ITEMS: DropdownItem[] = [
  { id: "edit", label: "Edit Project", icon: Edit3, shortcut: "⌘E" },
  { id: "settings", label: "Settings", icon: Settings, shortcut: "⌘S" },
  { id: "analytics", label: "Analytics", icon: BarChart2, shortcut: "⌘A" },
  { id: "share", label: "Share...", icon: Share2 },
  { id: "duplicate", label: "Duplicate", icon: Copy, shortcut: "⌘D" },
  { id: "delete", label: "Delete", icon: Trash2, shortcut: "⌘⌫", isDanger: true },
];

export function DropdownMenu({
  items = DEFAULT_DROPDOWN_ITEMS,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select option",
  className,
  triggerClassName,
  contentClassName,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const [localValue, setLocalValue] = useState<string>(defaultValue ?? items[0]?.id ?? "");
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : localValue;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Find the selected item
  const selectedItem = items.find((item) => item.id === activeValue);

  // Toggle open
  const toggleMenu = () => setIsOpen((prev) => !prev);

  // Close menu
  const closeMenu = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
    setHoveredIndex(null);
    triggerRef.current?.focus();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus effect for keyboard nav
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Keyboard handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === "Space") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeMenu();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
      case "Tab":
        closeMenu();
        break;
      default:
        break;
    }
  };

  const handleSelect = (itemId: string) => {
    if (!isControlled) {
      setLocalValue(itemId);
    }
    if (onValueChange) {
      onValueChange(itemId);
    }
    closeMenu();
  };

  return (
    <div className={cn("relative inline-block font-sans text-left", className)} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={cn(
          "inline-flex items-center justify-between gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-50 transition-colors focus-visible:outline-none dark:focus-visible:ring-offset-zinc-950 min-w-[160px]",
          triggerClassName
        )}
      >
        <span className="flex items-center gap-2 text-left truncate">
          {selectedItem?.icon && (
            <selectedItem.icon
              size={16}
              className={cn(
                "text-zinc-500 shrink-0",
                selectedItem.isDanger && "text-red-500"
              )}
            />
          )}
          <span className="truncate">
            {selectedItem ? selectedItem.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-zinc-500 transition-transform duration-200 shrink-0 ml-2",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Popover Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            role="menu"
            onMouseLeave={() => setHoveredIndex(null)}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={cn(
              "absolute left-0 mt-2 z-50 w-56 origin-top-left rounded-xl border border-zinc-200 bg-white/95 p-1 text-zinc-950 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/96 dark:text-zinc-50 focus-visible:outline-none",
              contentClassName
            )}
          >
            <div className="flex flex-col gap-0.5">
              {items.map((item, idx) => {
                const isHovered = hoveredIndex === idx || (focusedIndex === idx && hoveredIndex === null);
                const isSelected = item.id === activeValue;

                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    type="button"
                    role="menuitem"
                    aria-selected={isSelected}
                    tabIndex={idx === focusedIndex ? 0 : -1}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      "group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none",
                      isSelected
                        ? "text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/25"
                        : item.isDanger
                          ? "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    {/* Hover highlight background sliding pill */}
                    {isHovered && (
                      <motion.div
                        layoutId="dropdownHover"
                        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 28 }}
                        className={cn(
                          "absolute inset-0 z-0 rounded-lg",
                          item.isDanger
                            ? "bg-red-50 dark:bg-red-950/30"
                            : isSelected
                              ? "bg-purple-100/70 dark:bg-purple-900/40"
                              : "bg-zinc-100 dark:bg-zinc-900"
                        )}
                      />
                    )}

                    <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                      {item.icon && (
                        <item.icon
                          size={16}
                          className={cn(
                            "transition-colors shrink-0",
                            isSelected
                              ? "text-purple-600 dark:text-purple-400"
                              : item.isDanger
                                ? "text-red-400 group-hover:text-red-500"
                                : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                          )}
                        />
                      )}
                      <span className="truncate">{item.label}</span>
                    </span>

                    {/* Right side: show checkmark if selected, or shortcut if not */}
                    {isSelected ? (
                      <Check
                        size={16}
                        className="text-purple-600 dark:text-purple-400 relative z-10 ml-auto shrink-0"
                      />
                    ) : item.shortcut ? (
                      <span className="relative z-10 font-mono text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 ml-auto shrink-0">
                        {item.shortcut}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
