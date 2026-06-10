"use client";

import { AnimatePresence, motion } from "motion/react";
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

// Custom hook to measure the element height dynamically
function useMeasure() {
  const [element, setRef] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].target.getBoundingClientRect();
      setRect({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setRef, rect] as const;
}

export function ExpandableTab({
  tabs = DEFAULT_TABS,
  defaultActiveTabId = "dashboard",
  onTabChange,
}: ExpandableTabProps) {
  const [activeTabId, setActiveTabId] = useState(defaultActiveTabId);
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const [ref, { height }] = useMeasure();

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



  return (
    <div className="w-full max-w-[250px] flex flex-col items-center justify-end min-h-[200px]">
      {/* Popover Menu Panel (Always mounted, resizes height dynamically) */}
      <motion.div
        layout
        initial={false}
        animate={{
          height: hasMenu ? (height ? height + 2 : "auto") : 0,
          opacity: hasMenu ? 1 : 0,
          scale: hasMenu ? 1 : 0.95,
          borderWidth: hasMenu ? "1px" : "0px",
        }}
        transition={TRANSITION_CONFIG}
        className="w-full overflow-hidden rounded-2xl bg-white text-black shadow-xl shadow-black/5 border-slate-100 border-solid"
        style={{
          pointerEvents: hasMenu ? "auto" : "none",
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {hasMenu && (
            <motion.div
              ref={ref}
              key={activeTab.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="p-2 grid gap-0.5"
            >
              {activeTab.menuItems?.map((menuItem, index) => {
                const MenuIcon = menuItem.icon;
                return (
                  <motion.div
                    key={menuItem.label}
                    initial={{
                      x: -25,
                      filter: "blur(2px)",
                    }}
                    animate={{
                      x: 0,
                      filter: "blur(0px)",
                    }}
                    transition={{
                      duration: 0.23,
                      ease: "easeInOut",
                      delay: index * 0.02,
                    }}
                    onClick={() => menuItem.onClick?.()}
                    className="flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-slate-400">
                      <MenuIcon size={12} />
                    </span>
                    <span className="text-[10px] font-medium text-slate-700">
                      {menuItem.label}
                    </span>
                    <ArrowRight size={10} className="ml-auto text-slate-300" />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
