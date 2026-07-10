"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  FileText,
  Home,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  menuItems?: Array<{
    label: string;
    icon: LucideIcon;
    onClick?: () => void;
  }>;
}

export interface ExpandableTabProps {
  /** The items to display in the tab bar. */
  tabs?: TabItem[];
  /** The active tab ID on initial load. */
  defaultActiveTabId?: string;
  /** Callback fired when a tab is selected. */
  onTabChange?: (tabId: string) => void;
}

const DEFAULT_TABS: TabItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    menuItems: [
      { label: "Profile", icon: User },
      { label: "Upgrade Plan", icon: Sparkles },
      { label: "Notifications", icon: Bell },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: BriefcaseBusiness,
    menuItems: [
      { label: "Active Jobs", icon: BriefcaseBusiness },
      { label: "Documentation", icon: FileText },
    ],
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: Bell,
    menuItems: [
      { label: "New request received", icon: User },
      { label: "System update ready", icon: Sparkles },
    ],
  },
];

const TRANSITION_CONFIG = {
  type: "spring",
  stiffness: 300,
  damping: 25,
} as const;

export function ExpandableTab({
  tabs = DEFAULT_TABS,
  defaultActiveTabId = "dashboard",
  onTabChange,
}: ExpandableTabProps) {
  const [activeTabId, setActiveTabId] = useState(defaultActiveTabId);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const handleTabClick = (tabId: string) => {
    if (activeTabId === tabId) {
      setIsMenuOpen((prev) => !prev);
    } else {
      setActiveTabId(tabId);
      setIsMenuOpen(true);
      onTabChange?.(tabId);
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const hasMenu = !!(activeTab.menuItems && activeTab.menuItems.length > 0 && isMenuOpen);
  const [dropdownState, setDropdownState] = useState<
    "closed" | "pre-open" | "open" | "closing"
  >(hasMenu ? "pre-open" : "closed");

  useEffect(() => {
    let frameId: number | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    if (hasMenu) {
      frameId = requestAnimationFrame(() => {
        setDropdownState((current) =>
          current === "closed" ? "pre-open" : "open"
        );
        frameId = requestAnimationFrame(() => setDropdownState("open"));
      });
    } else {
      frameId = requestAnimationFrame(() => {
        setDropdownState((current) =>
          current === "closed" ? "closed" : "closing"
        );
        const closeDuration =
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--dropdown-close-dur"
            )
          ) || 150;
        closeTimer = setTimeout(() => setDropdownState("closed"), closeDuration);
      });
    }

    return () => {
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      if (closeTimer !== undefined) clearTimeout(closeTimer);
    };
  }, [hasMenu]);

  const dropdownClassName =
    dropdownState === "open"
      ? "is-open"
      : dropdownState === "closing"
        ? "is-closing"
        : "";

  return (
    <div className="relative w-full max-w-[250px] flex flex-col items-center justify-end min-h-[200px]">
      {/* The menu is absolutely anchored to the dock, so its width always matches it. */}
      {dropdownState !== "closed" && (
        <div
          className={`t-dropdown absolute inset-x-0 bottom-14 z-10 overflow-hidden rounded-2xl border border-slate-100 bg-white text-black shadow-xl shadow-black/5 ${dropdownClassName}`}
          data-origin="bottom-center"
        >
            <motion.div
              key={activeTab.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
              }
              className="grid gap-0.5 p-2"
              role="menu"
            >
              {activeTab.menuItems?.map((menuItem, index) => {
                const MenuIcon = menuItem.icon;
                return (
                  <motion.button
                    key={menuItem.label}
                    type="button"
                    role="menuitem"
                    initial={{
                      opacity: 0,
                      x: shouldReduceMotion ? 0 : -8,
                      filter: shouldReduceMotion ? "blur(0px)" : "blur(2px)",
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      filter: "blur(0px)",
                    }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.2,
                      ease: [0.22, 1, 0.36, 1],
                      delay: shouldReduceMotion ? 0 : index * 0.03,
                    }}
                    onClick={() => menuItem.onClick?.()}
                    className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  >
                    <span className="text-slate-400">
                      <MenuIcon size={12} />
                    </span>
                    <span className="text-[10px] font-medium text-slate-700">
                      {menuItem.label}
                    </span>
                    <ArrowRight size={10} className="ml-auto text-slate-300" />
                  </motion.button>
                );
              })}
            </motion.div>
        </div>
      )}

      {/* Tab Dock Bar */}
      <motion.div
        layout
        className="mt-2 flex h-11 w-full items-center justify-between rounded-full bg-white p-1.5 shadow-lg shadow-black/5 border border-slate-100"
      >
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTabId === tab.id;
          return (
            <motion.button
              key={tab.id}
              layout
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className="relative flex h-full items-center justify-center rounded-full px-3.5 transition-colors focus:outline-none cursor-pointer select-none"
              style={{
                flexGrow: isActive ? 1.5 : 1,
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="active-tab-indicator"
                  className="absolute inset-0 rounded-full bg-slate-100"
                  transition={TRANSITION_CONFIG}
                  style={{ originY: "0px" }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <TabIcon
                  size={14}
                  className={isActive ? "text-slate-800" : "text-slate-400"}
                />
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: [0.1, 1, 0.5, 1] }}
                    className="overflow-hidden text-[11px] font-semibold text-slate-800 whitespace-nowrap"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
