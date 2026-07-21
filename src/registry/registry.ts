export type RegistryFile = {
  path: string;
  type: "registry:component";
};

export type RegistryItem = {
  id: string;
  name: string;
  title: string;
  category: ComponentCategory;
  sourceFile: string;
  files: RegistryFile[];
  description: string;
  dependencies: string[];
  date: string;
  mediaPoster: string;
  code?: string;
};

export type ComponentCategory =
  | "Button"
  | "Three Js"
  | "Modal"
  | "Layout"
  | "Portfolio"
  | "Text Animation";

export type ComponentGroup = {
  name: ComponentCategory;
  items: ReadonlyArray<{ label: string; itemId: string }>;
};

const today = new Date("2026-04-28");

function formatDate(daysAgo: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function componentFile(sourceFile: string): RegistryFile[] {
  return [
    {
      path: `src/registry/components/${sourceFile}`,
      type: "registry:component",
    },
  ];
}

export const registryItems: RegistryItem[] = [
  {
    id: "sphere-gallery",
    name: "Sphere Gallery",
    title: "3D Sphere Gallery",
    category: "Portfolio",
    sourceFile: "sphere-gallery.tsx",
    files: componentFile("sphere-gallery.tsx"),
    description: "A pseudo-3D perspective image gallery arranged in a rotating spherical structure with interactive drag controls and seamless shared-layout image focus.",
    dependencies: ["motion", "tailwindcss"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "clicky-button",
    name: "Clicky Button",
    title: "Clicky Button",
    category: "Button",
    sourceFile: "clicky-button.tsx",
    files: componentFile("clicky-button.tsx"),
    description: "A press-aware CTA with depth and tactile feedback.",
    dependencies: ["motion", "tailwindcss"],
    date: formatDate(0),
    mediaPoster: "https://atomixui.mihircodes.in/images/clicky.png",
  },
  {
    id: "gooey-button",
    name: "Gooey Button",
    title: "Gooey Button",
    category: "Button",
    sourceFile: "gooey-button.tsx",
    files: componentFile("gooey-button.tsx"),
    description: "A magnetic action that follows the cursor with intent.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(7),
    mediaPoster: "https://atomixui.mihircodes.in/images/gooey.png",
  },
  {
    id: "hold-to-delete",
    name: "Hold to Delete",
    title: "Hold to Delete",
    category: "Button",
    sourceFile: "hold-to-delete.tsx",
    files: componentFile("hold-to-delete.tsx"),
    description: "A destructive action that requires a deliberate long press.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(14),
    mediaPoster: "https://atomixui.mihircodes.in/images/holdtodelete.png",
  },
  {
    id: "physics-receipt",
    name: "Physics Receipt",
    title: "Physics Receipt",
    category: "Three Js",
    sourceFile: "physics-receipt.tsx",
    files: componentFile("physics-receipt.tsx"),
    description: "A receipt-style surface with playful tilt and depth.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(21),
    mediaPoster: "https://atomixui.mihircodes.in/images/reciept.png",
  },
  {
    id: "genie-modal",
    name: "Genie Modal",
    title: "Genie Modal",
    category: "Modal",
    sourceFile: "genie-modal.tsx",
    files: componentFile("genie-modal.tsx"),
    description: "An overlay panel with spring-loaded entrance and exit.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(28),
    mediaPoster: "https://atomixui.mihircodes.in/images/genie.png",
  },
  {
    id: "grid-disclosure",
    name: "Grid Disclosure",
    title: "Grid Disclosure",
    category: "Layout",
    sourceFile: "grid-disclosure.tsx",
    files: componentFile("grid-disclosure.tsx"),
    description: "A list pattern that reveals grouped icons and counts.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(35),
    mediaPoster: "https://atomixui.mihircodes.in/images/grid.png",
  },
  {
    id: "magnetic-button",
    name: "Magnetic Button",
    title: "Magnetic Button",
    category: "Button",
    sourceFile: "magnetic-button.tsx",
    files: componentFile("magnetic-button.tsx"),
    description: "A magnetic action that follows the cursor with dynamic inertia and parallax depth.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(42),
    mediaPoster: "https://atomixui.mihircodes.in/images/magnetic.png",
  },
  {
    id: "expandable-tab",
    name: "Expandable Tab",
    title: "Expandable Tab",
    category: "Layout",
    sourceFile: "expandable-tab.tsx",
    files: componentFile("expandable-tab.tsx"),
    description: "A small dock that condenses navigation into a tab.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(49),
    mediaPoster: "https://atomixui.mihircodes.in/images/expandable-demo.png",
  },
  {
    id: "song-player",
    name: "Song Player",
    title: "Song Player",
    category: "Layout",
    sourceFile: "song-player.tsx",
    files: componentFile("song-player.tsx"),
    description: "A dynamic pop music player with realistic rotating vinyl and tone-arm swing effects.",
    dependencies: ["framer-motion", "tailwindcss", "lucide-react"],
    date: formatDate(56),
    mediaPoster: "https://atomixui.mihircodes.in/images/song-player.png",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    title: "Portfolio",
    category: "Portfolio",
    sourceFile: "portfolio.tsx",
    files: componentFile("portfolio.tsx"),
    description: "A portfolio grid with smooth card lifts and density.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(63),
    mediaPoster: "https://atomixui.mihircodes.in/images/portfolio.png",
  },
  {
    id: "ascii-reveal",
    name: "Ascii Reveal",
    title: "Ascii Reveal",
    category: "Three Js",
    sourceFile: "ascii-reveal.tsx",
    files: componentFile("ascii-reveal.tsx"),
    description: "An image-to-ASCII character scramble and reveal canvas animation.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "spotlight-gallery",
    name: "Spotlight Gallery",
    title: "Spotlight Gallery",
    category: "Portfolio",
    sourceFile: "spotlight-gallery.tsx",
    files: componentFile("spotlight-gallery.tsx"),
    description: "A 3D grid layout project gallery with hover animations.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(0),
    mediaPoster: "https://picsum.photos/seed/default/800/600",
  },
  {
    id: "tunnel-slider",
    name: "Tunnel Slider",
    title: "Tunnel Slider",
    category: "Layout",
    sourceFile: "tunnel-slider.tsx",
    files: componentFile("tunnel-slider.tsx"),
    description: "An infinite 3D perspective image tunnel scrolling layout.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "text-scramble",
    name: "Text Scramble",
    title: "Text Scramble",
    category: "Text Animation",
    sourceFile: "text-scramble.tsx",
    files: componentFile("text-scramble.tsx"),
    description: "A highly performant text scramble and progressive character reveal effect.",
    dependencies: ["tailwindcss"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "letter-swap",
    name: "Letter Swap",
    title: "Letter Swap",
    category: "Text Animation",
    sourceFile: "letter-swap.tsx",
    files: componentFile("letter-swap.tsx"),
    description: "A GPU-accelerated character slide-up hover and transition effect.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "curved-text-marquee",
    name: "Curved Text Marquee",
    title: "Curved Text Marquee",
    category: "Text Animation",
    sourceFile: "curved-text-marquee.tsx",
    files: componentFile("curved-text-marquee.tsx"),
    description: "An animated text marquee that scrolls along a custom curvy SVG path with gradient guide strokes.",
    dependencies: ["framer-motion", "tailwindcss"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "text-shimmer",
    name: "Text Shimmer",
    title: "Text Shimmer Animation",
    category: "Text Animation",
    sourceFile: "text-shimmer.tsx",
    files: componentFile("text-shimmer.tsx"),
    description: "A production-ready text shimmer animation component using Motion and Tailwind CSS v4, supporting gradient sweeps, letter waves, and customizable glow Sheen.",
    dependencies: ["motion", "tailwindcss", "lucide-react"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "text-counter",
    name: "Text Counter",
    title: "Text Counter Animation",
    category: "Text Animation",
    sourceFile: "text-counter.tsx",
    files: componentFile("text-counter.tsx"),
    description: "A smooth, customizable number counter animation with multiple motion controls including spring, bounce, linear, and easeOut.",
    dependencies: ["motion", "tailwindcss"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "stacked-cards",
    name: "Stacked Cards",
    title: "Stacked Cards",
    category: "Layout",
    sourceFile: "stacked-cards.tsx",
    files: componentFile("stacked-cards.tsx"),
    description: "An interactive stacked deck of cards with swipe gestures, spring physics, and status overlays.",
    dependencies: ["framer-motion", "tailwindcss", "lucide-react"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "ascii-video",
    name: "Ascii Video",
    title: "ASCII Video Player",
    category: "Layout",
    sourceFile: "ascii-video.tsx",
    files: componentFile("ascii-video.tsx"),
    description: "A highly optimized, interactive real-time video-to-ASCII rendering player with custom retro filters and visualizers.",
    dependencies: ["motion", "tailwindcss", "lucide-react"],
    date: formatDate(0),
    mediaPoster: "https://images.pexels.com/video-files/3209828/thumbnails/video-placeholder-974.jpg",
  },
  {
    id: "dropdown-menu",
    name: "Dropdown Menu",
    title: "Interactive Dropdown Menu",
    category: "Layout",
    sourceFile: "dropdown-menu.tsx",
    files: componentFile("dropdown-menu.tsx"),
    description: "A premium, keyboard-accessible dropdown menu featuring submenus, list items, sliding highlights, and theme selection.",
    dependencies: ["motion", "tailwindcss", "lucide-react"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "slide-drawer",
    name: "Slide Drawer",
    title: "Touch-Enabled Slide Drawer",
    category: "Modal",
    sourceFile: "slide-drawer.tsx",
    files: componentFile("slide-drawer.tsx"),
    description: "A reusable, touch-enabled slide-in drawer UI component with spring physics, drag-to-dismiss gestures, and multi-position support.",
    dependencies: ["motion", "tailwindcss", "lucide-react"],
    date: formatDate(0),
    mediaPoster: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  },
];

export const componentGroups: ComponentGroup[] = [
  {
    name: "Button",
    items: [
      { label: "Clicky Button", itemId: "clicky-button" },
      { label: "Gooey Button", itemId: "gooey-button" },
      { label: "Hold to Delete", itemId: "hold-to-delete" },
      { label: "Magnetic Button", itemId: "magnetic-button" },
    ],
  },
  {
    name: "Three Js",
    items: [
      { label: "Physics Receipt", itemId: "physics-receipt" },
      { label: "Ascii Reveal", itemId: "ascii-reveal" },
    ],
  },
  {
    name: "Modal",
    items: [
      { label: "Genie Modal", itemId: "genie-modal" },
      { label: "Slide Drawer", itemId: "slide-drawer" },
    ],
  },
  {
    name: "Layout",
    items: [
      { label: "Grid Disclosure", itemId: "grid-disclosure" },
      { label: "Expandable Tab", itemId: "expandable-tab" },
      { label: "Song Player", itemId: "song-player" },
      { label: "Tunnel Slider", itemId: "tunnel-slider" },
      { label: "Stacked Cards", itemId: "stacked-cards" },
      { label: "Ascii Video", itemId: "ascii-video" },
      { label: "Dropdown Menu", itemId: "dropdown-menu" },
    ],
  },
  {
    name: "Portfolio",
    items: [
      { label: "Portfolio", itemId: "portfolio" },
      { label: "Spotlight Gallery", itemId: "spotlight-gallery" },
      { label: "Sphere Gallery", itemId: "sphere-gallery" },
    ],
  },
  {
    name: "Text Animation",
    items: [
      { label: "Text Scramble", itemId: "text-scramble" },
      { label: "Letter Swap", itemId: "letter-swap" },
      { label: "Curved Text Marquee", itemId: "curved-text-marquee" },
      { label: "Text Shimmer", itemId: "text-shimmer" },
      { label: "Text Counter", itemId: "text-counter" },
    ],
  },
];

export function getRegistryItem(id: string): RegistryItem | undefined {
  return registryItems.find((item) => item.id === id);
}

export function getFirstRegistryItem(): RegistryItem {
  return registryItems[0];
}

export function getRegistryItemsByCategory(): Record<
  ComponentCategory,
  RegistryItem[]
> {
  return registryItems.reduce(
    (acc, item) => {
      acc[item.category] = [...(acc[item.category] ?? []), item];
      return acc;
    },
    {} as Record<ComponentCategory, RegistryItem[]>,
  );
}
