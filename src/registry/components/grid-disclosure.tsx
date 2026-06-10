"use client";

import { useState, useId, useCallback, useMemo, memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronRight } from "lucide-react";
import {
  Palette,
  Headphones,
  Wrench,
  Moon,
  Tv,
  Music,
  Sparkles,
  Globe,
  Code,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubItem {
  id: string;
  name: string;
  detail: string;
  price?: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

export interface GridDisclosureItemData {
  id: string;
  title: string;
  count: string;
  icons: Array<React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>>;
  items: SubItem[];
}

export interface GridDisclosureProps {
  /** The disclosure items to display. */
  items?: GridDisclosureItemData[];
  /** Optional initial active item ID. */
  defaultActiveId?: string;
  /** Callback triggered when the active item changes. */
  onItemChange?: (id: string | null) => void;
  /** Custom class name for the container. */
  className?: string;
}

const DEFAULT_ITEMS: GridDisclosureItemData[] = [
  {
    id: "subscriptions",
    title: "Subscriptions",
    count: "3 items",
    icons: [Tv, Music, Sparkles],
    items: [
      {
        id: "sub-1",
        name: "Netflix",
        detail: "Premium 4K Plan",
        price: "$19.99/mo",
        icon: Tv,
      },
      {
        id: "sub-2",
        name: "Spotify",
        detail: "Family Premium",
        price: "$16.99/mo",
        icon: Music,
      },
      {
        id: "sub-3",
        name: "Cursor AI",
        detail: "Pro Subscription",
        price: "$20.00/mo",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "services",
    title: "Services",
    count: "3 items",
    icons: [Palette, Headphones, Globe],
    items: [
      {
        id: "srv-1",
        name: "Adobe CC",
        detail: "All Apps Suite",
        price: "$54.99/mo",
        icon: Palette,
      },
      {
        id: "srv-2",
        name: "SoundCloud",
        detail: "Audio Mastering",
        price: "$45.00/hr",
        icon: Headphones,
      },
      {
        id: "srv-3",
        name: "Vercel Pro",
        detail: "Team Workspace",
        price: "$20.00/mo",
        icon: Globe,
      },
    ],
  },
  {
    id: "products",
    title: "Products",
    count: "4 items",
    icons: [Wrench, Package, Moon, Code],
    items: [
      {
        id: "prd-1",
        name: "DevTool Pro",
        detail: "Browser Debugger",
        price: "$29.00",
        icon: Wrench,
      },
      {
        id: "prd-2",
        name: "Asset Pack",
        detail: "3D Models & Textures",
        price: "$49.00",
        icon: Package,
      },
      {
        id: "prd-3",
        name: "Luna Theme",
        detail: "IDE Dark Palette",
        price: "$8.00",
        icon: Moon,
      },
      {
        id: "prd-4",
        name: "NextJS Template",
        detail: "SaaS Boilerplate",
        price: "$99.00",
        icon: Code,
      },
    ],
  },
];

interface GridDisclosureItemProps {
  item: GridDisclosureItemData;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

const GridDisclosureItem = memo(function GridDisclosureItem({
  item,
  isOpen,
  onToggle,
}: GridDisclosureItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const titleId = useId();

  const springTransition = useMemo(
    () =>
      shouldReduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 270, damping: 20 },
    [shouldReduceMotion]
  );

  const handleToggleClick = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      onToggle(item.id);
    },
    [onToggle, item.id]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle(item.id);
      }
    },
    [onToggle, item.id]
  );

  return (
    <div className="relative flex justify-center w-full min-h-[80px]">
      <AnimatePresence mode="popLayout" initial={false}>
        {isOpen ? (
          <motion.div
            key="expanded"
            layoutId={`card-${item.id}-container`}
            transition={springTransition}
            className="bg-surface border border-border-soft p-5 flex flex-col gap-5 w-[450px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-none relative will-change-transform z-10"
          >
            {/* Expanded Header */}
            <div className="flex items-center justify-between w-full">
              <motion.span
                layoutId={`card-${item.id}-title`}
                transition={springTransition}
                className="font-sans text-[18px] font-semibold tracking-tight text-foreground leading-snug"
              >
                {item.title}
              </motion.span>

              {/* Close Button */}
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleToggleClick}
                aria-label="Collapse details"
                className="grid h-[32px] w-[32px] place-items-center border border-border-soft bg-foreground text-background hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <span className="text-[11px] font-semibold leading-none">✕</span>
              </motion.button>
            </div>

            {/* Sub-items list */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="border-t border-border-soft pt-4 flex flex-col gap-1.5 w-full"
            >
              {item.items.map((subItem) => {
                const SubIcon = subItem.icon;
                return (
                  <div
                    key={subItem.id}
                    className="group/item flex items-center gap-3.5 border border-transparent p-2 hover:border-border-soft hover:bg-surface-muted/20 transition-all duration-200 cursor-pointer rounded-none"
                  >
                    {/* Sub-Item Icon wrapper (shares layoutId with mini icon) */}
                    <motion.div
                      layoutId={`card-${item.id}-${subItem.id}-icon-wrap`}
                      transition={springTransition}
                      className="flex h-9 w-9 items-center justify-center bg-surface-muted text-foreground/75 group-hover/item:bg-accent/10 group-hover/item:text-accent transition-colors rounded-none"
                    >
                      <SubIcon size={18} strokeWidth={2} aria-hidden="true" />
                    </motion.div>

                    {/* Sub-Item Labels */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans text-sm font-medium text-foreground truncate">
                        {subItem.name}
                      </h4>
                      <p className="font-sans text-[12px] text-ink-muted truncate">
                        {subItem.detail}
                      </p>
                    </div>

                    {/* Sub-Item Price */}
                    {subItem.price ? (
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-none bg-surface-muted border border-border-soft text-foreground/80 group-hover/item:bg-accent group-hover/item:text-white group-hover/item:border-transparent transition-colors">
                        {subItem.price}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            layoutId={`card-${item.id}-container`}
            transition={springTransition}
            onClick={handleToggleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-expanded={false}
            aria-labelledby={`title-${item.id}`}
            className="bg-surface border border-border-soft p-5 flex items-center justify-between w-[440px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer select-none rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 relative will-change-transform hover:bg-surface-muted/10 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              {/* Mini-Icons Grid */}
              <div className="grid grid-cols-2 gap-[5px] w-[42px]">
                {item.items.slice(0, 4).map((subItem) => {
                  const Icon = subItem.icon;
                  return (
                    <motion.div
                      key={subItem.id}
                      layoutId={`card-${item.id}-${subItem.id}-icon-wrap`}
                      transition={springTransition}
                      className="grid h-[20px] w-[20px] place-items-center bg-foreground text-background rounded-none"
                    >
                      <Icon size={11} strokeWidth={2.4} aria-hidden="true" />
                    </motion.div>
                  );
                })}
              </div>

              {/* Title & Count */}
              <div className="flex flex-col pl-3.5">
                <motion.span
                  layoutId={`card-${item.id}-title`}
                  transition={springTransition}
                  className="font-sans text-[18px] font-semibold tracking-tight text-foreground leading-snug"
                  id={`title-${item.id}`}
                >
                  {item.title}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-mono text-[13px] text-ink-muted leading-none mt-[3px]"
                >
                  {item.count}
                </motion.span>
              </div>
            </div>

            {/* Chevron Icon button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid h-[32px] w-[32px] place-items-center border border-border-soft text-ink-muted bg-surface-muted/50 rounded-none"
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export function GridDisclosure({
  items = DEFAULT_ITEMS,
  defaultActiveId = "subscriptions",
  onItemChange,
  className,
}: GridDisclosureProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultActiveId);

  const handleToggle = useCallback(
    (id: string) => {
      setActiveId((prevId) => {
        const nextId = prevId === id ? null : id;
        onItemChange?.(nextId);
        return nextId;
      });
    },
    [onItemChange]
  );

  return (
    <motion.div
      layout
      className={cn("flex flex-col items-center gap-4 w-full max-w-lg", className)}
    >
      {items.map((item) => (
        <motion.div key={item.id} layout className="w-full flex justify-center">
          <GridDisclosureItem
            item={item}
            isOpen={activeId === item.id}
            onToggle={handleToggle}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
