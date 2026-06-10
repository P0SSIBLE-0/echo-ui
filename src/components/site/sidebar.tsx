"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, PanelLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { componentGroups } from "@/registry/registry";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activeItemId?: string;
  onToggleCollapse?: () => void;
  onItemClick?: () => void;
};

type SidebarRow =
  | { type: "group-header"; name: string; isActive: boolean }
  | { type: "spacer"; id: string }
  | { type: "item"; label: string; itemId: string; active: boolean };

export function Sidebar({ activeItemId, onToggleCollapse, onItemClick }: SidebarProps) {
  const [isGrouped, setIsGrouped] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-grouped");
    if (stored !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsGrouped(stored !== "false");
    }
  }, []);

  const handleSetGrouped = (val: boolean) => {
    setIsGrouped(val);
    localStorage.setItem("sidebar-grouped", String(val));
  };

  const rows: SidebarRow[] = [];

  if (isGrouped) {
    componentGroups.forEach((group, groupIdx) => {
      const isGroupActive = group.items.some((item) => item.itemId === activeItemId);

      rows.push({
        type: "group-header",
        name: group.name,
        isActive: isGroupActive,
      });

      rows.push({
        type: "spacer",
        id: `spacer-header-${group.name}`,
      });

      group.items.forEach((item) => {
        const isItemActive = item.itemId === activeItemId;
        rows.push({
          type: "item",
          label: item.label,
          itemId: item.itemId,
          active: isItemActive,
        });
      });

      if (groupIdx < componentGroups.length - 1) {
        rows.push({
          type: "spacer",
          id: `spacer-footer-${group.name}`,
        });
      }
    });
  } else {
    componentGroups.forEach((group) => {
      group.items.forEach((item) => {
        const isItemActive = item.itemId === activeItemId;
        rows.push({
          type: "item",
          label: item.label,
          itemId: item.itemId,
          active: isItemActive,
        });
      });
    });
  }

  return (
    <aside className="absolute left-[8px] top-[2px] z-100 flex h-[calc(100dvh-20px)] w-70 md:w-[350px] flex-col overflow-hidden rounded-[22px] bg-[#111111] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.42)] transition-transform duration-300 ease-out">
      <div className="pointer-events-none absolute inset-0 rounded-[26px] shadow-[inset_18px_18px_34px_rgba(255,255,255,0.035),inset_-22px_-18px_44px_rgba(255,255,255,0.045)]" />

      {/* Top action bar */}
      <div className="relative flex items-center justify-between px-[24px] pt-[24px]">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border border-white/10 bg-white/4 text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={16} strokeWidth={2.0} />
        </button>
        {/* <Link
          href="/playground"
          className={cn(
            "flex h-[32px] items-center gap-1.5 rounded-[8px] border px-3 text-xs font-semibold tracking-wide transition-all",
            activeItemId === "playground"
              ? "border-[#ff3d12] bg-[#ff3d12]/10 text-[#ff3d12]"
              : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          Playground
        </Link> */}
      </div>

      {/* Dropdown header */}
      <div className="relative mt-[36px] px-[24px]">
        <button
          type="button"
          onClick={() => handleSetGrouped(!isGrouped)}
          className="flex items-center gap-1.5 text-[15px] font-medium leading-none text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 rounded-sm"
        >
          {isGrouped ? "Grouped" : "All Components"}
          <ChevronDown
            size={14}
            strokeWidth={2.0}
            className={cn("text-white/40 transition-transform duration-200", !isGrouped && "rotate-180")}
          />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="relative mt-[24px] min-h-0 flex-1 overflow-y-auto px-[24px] pb-12 scrollbar-none">
        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {rows.map((row) => {
              if (row.type === "group-header") {
                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 16 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    type="button"
                    onClick={() => handleSetGrouped(false)}
                    key={`group-${row.name}`}
                    className="group/row flex items-center h-4 gap-3 w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 rounded-sm overflow-hidden"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-px transition-all duration-300 ease-out shrink-0",
                        row.isActive
                          ? "w-[48px] bg-white"
                          : "w-[28px] bg-white/15 group-hover/row:w-[48px] group-hover/row:bg-white"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[15px] font-semibold tracking-wide transition-colors duration-300",
                        row.isActive
                          ? "text-white"
                          : "text-white/80 group-hover/row:text-white"
                      )}
                    >
                      {row.name}
                    </span>
                  </motion.button>
                );
              } else if (row.type === "item") {
                return (
                  <motion.div
                    layout
                    key={row.itemId}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Link
                      href={`/components/${row.itemId}`}
                      onClick={onItemClick}
                      className="group/row flex items-center h-7 text-sm gap-3"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "h-px transition-all duration-300 ease-out shrink-0",
                          row.active
                            ? "w-[48px] bg-[#ff3d12]"
                            : "w-[28px] bg-white/15 group-hover/row:w-[48px] group-hover/row:bg-[#ff3d12]"
                        )}
                      />
                      <span
                        className={cn(
                          "block min-w-0 truncate text-[14px] font-medium transition-colors duration-300 pl-[18px]",
                          row.active
                            ? "text-[#ff3d12]"
                            : "text-[#6b6b6b] group-hover/row:text-[#ff3d12]"
                        )}
                      >
                        {row.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              } else {
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 32 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    key={row.id}
                    className="flex items-center h-8 overflow-hidden"
                  >
                    <span
                      aria-hidden
                      className="h-px w-[28px] bg-white/15 shrink-0"
                    />
                  </motion.div>
                );
              }
            })}
          </AnimatePresence>
        </div>
      </nav>

      {/* Bottom fade gradient */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[60px] rounded-b-[26px] bg-linear-to-t from-[#111111] to-transparent z-10" />
    </aside>
  );
}
