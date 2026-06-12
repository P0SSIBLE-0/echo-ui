"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/site/sidebar";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

type ViewLayoutProps = {
  children: ReactNode;
};

export default function ViewLayout({ children }: ViewLayoutProps) {
  const pathname = usePathname();
  const id = pathname.split("/").pop(); // Extract dynamic ID from path (e.g. "gooey-button")

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(stored === "true");
    }
  }, []);

  const handleSetCollapsed = (val: boolean) => {
    setIsCollapsed(val);
    localStorage.setItem("sidebar-collapsed", String(val));
  };

  return (
    <main className="h-dvh overflow-hidden bg-background p-[5px] text-foreground">
      <div className="relative flex h-full overflow-hidden rounded-[20px] border border-border-soft bg-surface-muted shadow-[0_30px_120px_rgba(0,0,0,0.18)] dark:shadow-[0_30px_120px_rgba(0,0,0,0.35)]">

        {/* Sidebar container wrapper for sliding */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 z-30 transition-transform duration-250 ease-out",
            isCollapsed ? "translate-x-[-390px]" : "translate-x-0"
          )}
        >
          <Sidebar
            activeItemId={id}
            onToggleCollapse={() => handleSetCollapsed(true)}
            onItemClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                setIsCollapsed(true);
              }
            }}
          />
        </div>

        {/* Floating trigger button to open sidebar when collapsed */}
        {isCollapsed && (
          <button
            type="button"
            onClick={() => handleSetCollapsed(false)}
            className="absolute left-[32px] top-[26px] z-30 flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border border-border-soft bg-surface text-foreground/60 transition-colors hover:bg-surface-muted hover:text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="Expand sidebar"
          >
            <PanelLeft size={16} strokeWidth={2.0} />
          </button>
        )}

        <section
          className={cn(
            "relative min-h-0 flex-1 overflow-hidden bg-surface-muted transition-[margin-left] duration-300 ease-out",
            isCollapsed ? "ml-0" : "ml-0 lg:ml-[400px]"
          )}
        >
          {children}
        </section>
      </div>
    </main>
  );
}
