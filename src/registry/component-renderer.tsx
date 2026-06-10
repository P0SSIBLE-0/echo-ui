"use client";

import { AsciiReveal } from "@/registry/components/ascii-reveal";
import { ClickyButton } from "@/registry/components/clicky-button";
import { CurvedTextMarquee } from "@/registry/components/curved-text-marquee";
import { ExpandableTab } from "@/registry/components/expandable-tab";
import { GenieModal } from "@/registry/components/genie-modal";
import { GooeyButton } from "@/registry/components/gooey-button";
import { GridDisclosure } from "@/registry/components/grid-disclosure";
import { HoldToDelete } from "@/registry/components/hold-to-delete";
import LetterSwap from "@/registry/components/letter-swap";
import MagneticButton from "@/registry/components/magnetic-button";
import { PhysicsReceipt } from "@/registry/components/physics-receipt";
import { Portfolio } from "@/registry/components/portfolio";
import { SongPlayer } from "@/registry/components/song-player";
import SpotlightGallery from "@/registry/components/spotlight-gallery";
import TextScramble from "@/registry/components/text-scramble";
import { StackedCards } from "@/registry/components/stacked-cards";
import { TunnelSlider } from "@/registry/components/tunnel-slider";
import type { RegistryItem } from "@/registry/registry";

type RegistryComponentRendererProps = {
  itemId: RegistryItem["id"];
};

export function RegistryComponentRenderer({
  itemId,
}: RegistryComponentRendererProps) {
  switch (itemId) {
    case "clicky-button":
      return <ClickyButton />;
    case "gooey-button":
      return <GooeyButton />;
    case "hold-to-delete":
      return <HoldToDelete />;
    case "physics-receipt":
      return <PhysicsReceipt />;
    case "genie-modal":
      return <GenieModal />;
    case "grid-disclosure":
      return <GridDisclosure />;
    case "magnetic-button":
      return <MagneticButton />;
    case "expandable-tab":
      return <ExpandableTab />;
    case "song-player":
      return <SongPlayer />;
    case "portfolio":
      return <Portfolio />;
    case "ascii-reveal":
      return (
        <div className="grid min-h-[350px] place-items-center rounded-[20px] bg-[#111111] p-6">
          <AsciiReveal
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
      return <SpotlightGallery />;
    case "tunnel-slider":
      return <TunnelSlider />;
    case "text-scramble":
      return <TextScramble />;
    case "letter-swap":
      return <LetterSwap />;
    case "curved-text-marquee":
      return <CurvedTextMarquee />;
    case "stacked-cards":
      return <StackedCards />;
    default:
      return null;
  }
}
