"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import { motion } from "motion/react";

export interface Project {
    id: string | number;
    name: string;
    image: string;
}

interface SpotlightProps {
    projects?: Project[];
    defaultImage?: string;
    tilesX?: number;
    tilesY?: number;
    tileSize?: number;
}

const DEFAULT_PROJECTS: Project[] = [
    { id: 1, name: "1997 Hallway Tape", image: "https://picsum.photos/seed/img1/800/600" },
    { id: 2, name: "Deep Space", image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1170&auto=format" },
    { id: 3, name: "Sleep Phase Anomaly", image: "https://picsum.photos/seed/img3/800/600" },
    { id: 4, name: "Still-Life.mov", image: "https://picsum.photos/seed/img4/800/600" },
    { id: 5, name: "Monoform™", image: "https://picsum.photos/seed/img5/800/600" },
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1170&auto=format&fit=crop";
const faceClasses = "absolute w-full h-full backface-hidden bg-cover bg-center";

// Pure deterministic pseudo-random helper for react purity rules
const getSeedRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

interface TileData {
    row: number;
    col: number;
    delay: number;
    offsetX: number;
    offsetY: number;
    activeZ: number[];
    activeDur: number;
    idleZ: number[];
    idleY: number[];
    idleDur: number;
    id: string;
}

interface TileProps {
    tile: TileData;
    frontImage: string;
    rearImage: string;
    rotateY: number;
    tileSize: number;
    previewWidth: number;
    previewHeight: number;
    isHovering: boolean;
}

const Tile = memo(({
    tile,
    frontImage,
    rearImage,
    rotateY,
    tileSize,
    previewWidth,
    previewHeight,
    isHovering,
}: TileProps) => {
    const { offsetX, offsetY, delay, activeZ, activeDur, idleZ, idleY, idleDur } = tile;

    return (
        <motion.div
            className="relative transform-3d w-full"
            style={{ width: tileSize, height: tileSize, willChange: "transform" }}
            initial={{ rotateY: 0 }}
            animate={{
                z: isHovering ? activeZ : idleZ,
                y: isHovering ? 0 : idleY,
                rotateY,
            }}
            transition={{
                rotateY: { delay, duration: 0.5, ease: [0.65, 0, 0.35, 1] },
                z: {
                    repeat: Infinity,
                    repeatType: "mirror",
                    duration: isHovering ? activeDur : idleDur,
                    ease: "easeInOut",
                },
                y: {
                    repeat: isHovering ? 0 : Infinity,
                    repeatType: "mirror",
                    duration: idleDur,
                    ease: "easeInOut",
                },
            }}
        >
            {/* Front Face */}
            <div
                className={`${faceClasses} transform-[translateZ(1px)]`}
                style={{
                    backgroundImage: `url(${frontImage})`,
                    backgroundSize: `${previewWidth}px ${previewHeight}px`,
                    backgroundPosition: `${offsetX}px ${offsetY}px`,
                }}
            />
            {/* Rear Face (Flipped 180 degrees) */}
            <div
                className={`${faceClasses} transform-[rotateY(180deg)_translateZ(1px)]`}
                style={{
                    backgroundImage: `url(${rearImage})`,
                    backgroundSize: `${previewWidth}px ${previewHeight}px`,
                    backgroundPosition: `${offsetX}px ${offsetY}px`,
                }}
            />
        </motion.div>
    );
});

Tile.displayName = "Tile";

export default function SpotlightGallery({
    projects = DEFAULT_PROJECTS,
    defaultImage = DEFAULT_IMAGE,
    tilesX = 12,
    tilesY = 9,
    tileSize = 60,
}: SpotlightProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
    const [activeProject, setActiveProject] = useState<number>(-1);
    const [revealCount, setRevealCount] = useState<number>(0);

    const [frontImage, setFrontImage] = useState<string>(defaultImage);
    const [rearImage, setRearImage] = useState<string>(defaultImage);

    const previewWidth = tilesX * tileSize;
    const previewHeight = tilesY * tileSize;
    const isHovering = hoveredIndex !== -1;

    // Compact single-loop grid construction with pre-calculated pure random values
    const grid = useMemo(() => {
        const cx = (tilesX - 1) / 2;
        const cy = (tilesY - 1) / 2;
        return Array.from({ length: tilesY * tilesX }, (_, i) => {
            const row = Math.floor(i / tilesX);
            const col = i % tilesX;
            // Generate deterministic pseudo-random properties using indices
            const r1 = getSeedRandom(i * 7 + 1);
            const r2 = getSeedRandom(i * 7 + 2);
            const r3 = getSeedRandom(i * 7 + 3);
            const r4 = getSeedRandom(i * 7 + 4);
            const r5 = getSeedRandom(i * 7 + 5);
            const r6 = getSeedRandom(i * 7 + 6);

            return {
                row,
                col,
                delay: Math.hypot(col - cx, row - cy) * 0.05,
                offsetX: -(col * tileSize),
                offsetY: -(row * tileSize),
                activeZ: [r1 * -40, r2 * 30],
                activeDur: 0.6 + r3 * 0.8,
                idleZ: [r4 * -10, r5 * 10],
                idleY: [r6 * -5, (1.0 - r6) * 4],
                idleDur: 1.8 + r1 * 1.6,
                id: `${row}-${col}`,
            };
        });
    }, [tilesX, tilesY, tileSize]);

    // Debounced hover effect with optimized dependency array (removed revealCount)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (hoveredIndex !== activeProject) {
                const nextImage = hoveredIndex === -1 ? defaultImage : projects[hoveredIndex].image;

                setRevealCount((prev) => {
                    if (prev % 2 === 0) {
                        setRearImage(nextImage);
                    } else {
                        setFrontImage(nextImage);
                    }
                    return prev + 1;
                });
                setActiveProject(hoveredIndex);
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [hoveredIndex, activeProject, defaultImage, projects]);

    return (
        <section className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-[#171717] perspective-midrange transform-3d">
            <div className="scale-50 sm:scale-75 md:scale-100">
                <div
                    className="grid transform-3d"
                    style={{
                        gridTemplateColumns: `repeat(${tilesX}, ${tileSize}px)`,
                        gridTemplateRows: `repeat(${tilesY}, ${tileSize}px)`,
                    }}
                >
                    {grid.map((tile) => (
                        <Tile
                            key={tile.id}
                            tile={tile}
                            frontImage={frontImage}
                            rearImage={rearImage}
                            rotateY={revealCount * 180}
                            tileSize={tileSize}
                            previewWidth={previewWidth}
                            previewHeight={previewHeight}
                            isHovering={isHovering}
                        />
                    ))}
                </div>
            </div>

            <nav
                className="absolute bottom-12 right-12 flex flex-col z-10"
                onMouseLeave={() => setHoveredIndex(-1)}
            >
                {projects.map((project, index) => (
                    <button
                        key={project.id}
                        onMouseEnter={() => setHoveredIndex(index)}
                        className={`text-white uppercase font-mono text-base text-right py-0.5 cursor-pointer transition-opacity duration-300 focus:outline-none ${activeProject === index ? "opacity-100" : "opacity-50 hover:opacity-100"
                            }`}
                    >
                        {project.name}
                    </button>
                ))}
            </nav>
        </section>
    );
}
