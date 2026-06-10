"use client";

import { motion, useInView } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { memo, useRef } from "react";
import { ArrowRight, Code2, Play, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { registryItems, type RegistryItem } from "@/registry/registry";

export function ComponentsCatalog() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      {/* Viewport-wide sticky header */}
      <header className="sticky top-0 z-20 w-full flex justify-center bg-linear-to-b from-background/30 via-background/60 to-transparent px-5 py-0">
        <Link
          href="/"
          className="flex h-[38px] w-full max-w-[1100px] -translate-y-px items-center justify-center rounded-b-[22px] border border-border-soft bg-surface text-sm font-semibold shadow-md shadow-black/10 transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:shadow-black/60"
        >
          <Sparkles size={17} className="mr-2" />
          Echo UI
        </Link>
      </header>

      {/* Main content grid with unified max-width constraints */}
      <section className="mx-auto w-full max-w-[1100px] px-5 pb-24 pt-[105px]">
        <div className="mb-[28px] flex items-end justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-[30px] font-semibold leading-none tracking-normal text-pretty">
                All Components
              </h1>
              <span className="font-mono text-[16px] text-ink-muted font-normal">
                [{registryItems.length}]
              </span>
            </div>
            <p className="mt-[18px] text-[18px] font-medium text-ink-muted text-balance">
              Collection of motion components with live playgrounds.
            </p>
          </div>
          <div className="flex items-center gap-3 self-end">
            <ThemeToggle />
            <Link
              href="/"
              className="group hidden items-center gap-2 rounded-full border border-border-soft bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface-muted hover:text-foreground md:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            >
              <Code2 size={15} />
              Open showcase
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {registryItems.map((item, index) => (
            <ComponentMediaCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}

const ComponentMediaCard = memo(function ComponentMediaCard({
  item,
  index,
}: {
  item: RegistryItem;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ delay: 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative flex h-[280px] flex-col overflow-hidden rounded-[10px] border border-border-soft bg-surface p-3 shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition duration-300 hover:bg-surface-muted dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025)]"
    >
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <h3 className="truncate text-[16px] font-semibold leading-none text-pretty">
          {item.name}
        </h3>
        <time className="shrink-0 text-[14px] font-medium leading-none text-ink-muted">
          {item.date}
        </time>
      </div>

      {/* Clicking anywhere on the card triggers navigation via the stretched link after: pseudo-class */}
      <Link
        href={`/components/${item.id}`}
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border-soft bg-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.11),0_1px_2px_rgba(0,0,0,0.31)] after:absolute after:inset-0 after:rounded-[10psx] after:z-10 focus-visible:outline-none"
        aria-label={`Open ${item.name}`}
      >
        <Image
          src={item.mediaPoster}
          alt={`${item.name} component preview`}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.035] group-hover:opacity-80"
          loading={index < 3 ? undefined : "lazy"}
          priority={index < 3}
        />
        <span className="absolute inset-0 bg-linear-to-t from-black/34 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <span className="absolute bottom-3 left-3 inline-grid h-9 w-9 place-items-center rounded-full bg-white text-black opacity-0 shadow-lg shadow-black/25 transition group-hover:opacity-100 z-20">
          <Play size={16} fill="currentColor" className="ml-0.5" />
        </span>
        <ArrowRight
          size={16}
          className="absolute bottom-4 right-4 text-white opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100 z-20"
        />
      </Link>
    </motion.article>
  );
});
