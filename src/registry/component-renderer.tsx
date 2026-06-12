"use client";

import dynamic from "next/dynamic";
import type { RegistryItem } from "@/registry/registry";

// Lazy load every component — only the active one is downloaded and executed
const LazyClickyButton = dynamic(
  () =>
    import("@/registry/components/clicky-button").then((m) => ({
      default: m.ClickyButton,
    })),
  { ssr: false }
);

const LazyGooeyButton = dynamic(
  () =>
    import("@/registry/components/gooey-button").then((m) => ({
      default: m.GooeyButton,
    })),
  { ssr: false }
);

const LazyHoldToDelete = dynamic(
  () =>
    import("@/registry/components/hold-to-delete").then((m) => ({
      default: m.HoldToDelete,
    })),
  { ssr: false }
);

const LazyPhysicsReceipt = dynamic(
  () =>
    import("@/registry/components/physics-receipt").then((m) => ({
      default: m.PhysicsReceipt,
    })),
  { ssr: false }
);

const LazyGenieModal = dynamic(
  () =>
    import("@/registry/components/genie-modal").then((m) => ({
      default: m.GenieModal,
    })),
  { ssr: false }
);

const LazyGridDisclosure = dynamic(
  () =>
    import("@/registry/components/grid-disclosure").then((m) => ({
      default: m.GridDisclosure,
    })),
  { ssr: false }
);

const LazyMagneticButton = dynamic(
  () => import("@/registry/components/magnetic-button"),
  { ssr: false }
);

const LazyExpandableTab = dynamic(
  () =>
    import("@/registry/components/expandable-tab").then((m) => ({
      default: m.ExpandableTab,
    })),
  { ssr: false }
);

const LazySongPlayer = dynamic(
  () =>
    import("@/registry/components/song-player").then((m) => ({
      default: m.SongPlayer,
    })),
  { ssr: false }
);

const LazyPortfolio = dynamic(
  () =>
    import("@/registry/components/portfolio").then((m) => ({
      default: m.Portfolio,
    })),
  { ssr: false }
);

const LazyAsciiReveal = dynamic(
  () =>
    import("@/registry/components/ascii-reveal").then((m) => ({
      default: m.AsciiReveal,
    })),
  { ssr: false }
);

const LazySpotlightGallery = dynamic(
  () => import("@/registry/components/spotlight-gallery"),
  { ssr: false }
);

const LazyTunnelSlider = dynamic(
  () =>
    import("@/registry/components/tunnel-slider").then((m) => ({
      default: m.TunnelSlider,
    })),
  { ssr: false }
);

const LazyTextScramble = dynamic(
  () => import("@/registry/components/text-scramble"),
  { ssr: false }
);

const LazyLetterSwap = dynamic(
  () => import("@/registry/components/letter-swap"),
  { ssr: false }
);

const LazyCurvedTextMarquee = dynamic(
  () =>
    import("@/registry/components/curved-text-marquee").then((m) => ({
      default: m.CurvedTextMarquee,
    })),
  { ssr: false }
);

const LazyStackedCards = dynamic(
  () =>
    import("@/registry/components/stacked-cards").then((m) => ({
      default: m.StackedCards,
    })),
  { ssr: false }
);

const LazyAsciiVideo = dynamic(
  () =>
    import("@/registry/components/ascii-video").then((m) => ({
      default: m.AsciiVideo,
    })),
  { ssr: false }
);

const LazyDropdownMenu = dynamic(
  () =>
    import("@/registry/components/dropdown-menu").then((m) => ({
      default: m.DropdownMenu,
    })),
  { ssr: false }
);

const LazySphereGallery = dynamic(
  () =>
    import("@/registry/components/sphere-gallery").then((m) => ({
      default: m.SphereGallery,
    })),
  { ssr: false }
);



type RegistryComponentRendererProps = {
  itemId: RegistryItem["id"];
};

export function RegistryComponentRenderer({
  itemId,
}: RegistryComponentRendererProps) {
  switch (itemId) {
    case "clicky-button":
      return <LazyClickyButton />;
    case "gooey-button":
      return <LazyGooeyButton />;
    case "hold-to-delete":
      return <LazyHoldToDelete />;
    case "physics-receipt":
      return <LazyPhysicsReceipt />;
    case "genie-modal":
      return <LazyGenieModal />;
    case "grid-disclosure":
      return <LazyGridDisclosure />;
    case "magnetic-button":
      return <LazyMagneticButton />;
    case "expandable-tab":
      return <LazyExpandableTab />;
    case "song-player":
      return <LazySongPlayer />;
    case "portfolio":
      return <LazyPortfolio />;
    case "ascii-reveal":
      return (
        <div className="grid min-h-[350px] place-items-center rounded-[20px] bg-[#111111] p-6">
          <LazyAsciiReveal
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600"
            alt="Ascii Portrait"
            className="h-[275px] w-[220px] rounded-lg shadow-2xl"
            columns={35}
            aspectWidth={4}
            aspectHeight={5}
            fontSize={12}
            cellAppearDelay={1}
            scrambleCount={15}
            scrambleSpeed={30}
          />
        </div>
      );
    case "spotlight-gallery":
      return <LazySpotlightGallery />;
    case "tunnel-slider":
      return <LazyTunnelSlider />;
    case "text-scramble":
      return <LazyTextScramble />;
    case "letter-swap":
      return <LazyLetterSwap />;
    case "curved-text-marquee":
      return <LazyCurvedTextMarquee />;
    case "stacked-cards":
      return <LazyStackedCards />;
    case "ascii-video":
      return <LazyAsciiVideo />;
    case "dropdown-menu":
      return <LazyDropdownMenu />;
    case "sphere-gallery":
      return <LazySphereGallery />;
    default:
      return null;
  }
}
