"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Vector3,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PlaneGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Mesh,
  CanvasTexture,
  AmbientLight,
  DirectionalLight,
  PointLight,
  BoxGeometry,
  Raycaster,
  Vector2,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
} from "three";

// --- Physics Constants ---
const RESOLUTION_X = 16;
const RESOLUTION_Y = 28;
const PAPER_WIDTH = 10;
const PAPER_HEIGHT = 18;
const ITERATIONS = 8;
const GRAVITY = 0.019;
const DRAG = 1;
const BEND_STIFFNESS = 0.4;

class Particle {
  pos: Vector3;
  oldPos: Vector3;
  vel = new Vector3();
  acc = new Vector3(0, -GRAVITY, 0);
  pinned = false;

  constructor(x: number, y: number, z: number) {
    this.pos = new Vector3(x, y, z);
    this.oldPos = new Vector3(x, y, z);
  }

  update() {
    if (this.pinned) return;
    this.vel.copy(this.pos).sub(this.oldPos).multiplyScalar(DRAG);
    this.oldPos.copy(this.pos);
    this.pos.add(this.vel).add(this.acc);
  }
}

// Pre-allocate scratch vector to avoid ~960K allocs/sec GC pressure in the physics loop
const _diff = new Vector3();

class Constraint {
  p1: Particle;
  p2: Particle;
  dist: number;
  stiffness: number;

  constructor(p1: Particle, p2: Particle, stiffness = 1.0) {
    this.p1 = p1;
    this.p2 = p2;
    this.dist = p1.pos.distanceTo(p2.pos);
    this.stiffness = stiffness;
  }

  solve() {
    _diff.subVectors(this.p1.pos, this.p2.pos);
    const currentDist = _diff.length();
    if (currentDist === 0) return;
    const error = (currentDist - this.dist) / currentDist;
    _diff.multiplyScalar(error * 0.5 * this.stiffness);
    if (!this.p1.pinned) this.p1.pos.sub(_diff);
    if (!this.p2.pinned) this.p2.pos.add(_diff);
  }
}

function drawBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  totalWidth: number,
  barHeight: number,
  color: string
) {
  const units = [
    2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 3, 1, 1, 1, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 1, 2, 2, 1, 1,
    3, 2, 1, 1, 1, 1, 2, 3, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 1, 1, 3, 1, 2, 2, 1, 1, 1, 2, 1, 1, 2, 1,
    3, 1, 1, 2, 1, 1, 2, 1, 1, 1, 3, 1, 2, 1, 1, 1, 2, 1,
  ];
  const totalUnits = units.reduce((a, b) => a + b, 0);
  const unitPx = totalWidth / totalUnits;

  let cx = x;
  units.forEach((w, i) => {
    const isBar = i % 2 === 0;
    if (isBar) {
      ctx.fillStyle = color;
      ctx.fillRect(cx, y, w * unitPx, barHeight);
    }
    cx += w * unitPx;
  });
}

export interface ReceiptItem {
  name: string;
  unit?: string;
  price: number;
}

export interface PhysicsReceiptProps {
  storeName?: string;
  orderNumber?: string;
  date?: string;
  items?: ReceiptItem[];
  currencySymbol?: string;
  barcodeText?: string;
  footerText?: string;
}

const DEFAULT_ITEMS: ReceiptItem[] = [
  { name: "Pro Plan", unit: "/ month", price: 20.0 },
  { name: "Edge Functions", unit: "/ month", price: 15.0 },
  { name: "Analytics", unit: "/ month", price: 9.0 },
  { name: "Storage 10 GB", unit: "/ month", price: 7.5 },
  { name: "Support Seat", unit: "/ month", price: 8.49 },
];

const getFormattedDate = () => {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function drawReceipt(
  cvs: HTMLCanvasElement,
  data: {
    storeName: string;
    orderNumber: string;
    date: string;
    items: ReceiptItem[];
    currencySymbol: string;
    barcodeText: string;
    footerText: string;
  }
) {
  const ctx = cvs.getContext("2d", { alpha: false })!;
  const canvasScale = 2;

  // Reset transform and clear/redraw background
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(canvasScale, canvasScale);

  ctx.textBaseline = "alphabetic";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Dynamic gray gradient texture background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 800);
  bgGrad.addColorStop(0, "#fff");
  bgGrad.addColorStop(1, "#cbcbc8");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 400, 800);

  // Subtle thermal paper speckle noise via ImageData (avoids 400 fillStyle changes)
  const noiseData = ctx.getImageData(0, 0, 400 * canvasScale, 800 * canvasScale);
  const nd = noiseData.data;
  for (let i = 0; i < 800; i++) {
    const px = Math.floor(Math.random() * 400 * canvasScale);
    const py = Math.floor(Math.random() * 800 * canvasScale);
    const idx = (py * 400 * canvasScale + px) * 4;
    const alpha = Math.floor(Math.random() * 9); // ~0.035 * 255
    nd[idx + 3] = Math.max(nd[idx + 3] - alpha, 0);
  }
  ctx.putImageData(noiseData, 0, 0);

  const FONT = '"Geist Mono", monospace';
  const SEP = "rgba(0,0,0,0.29)";
  const headerY = 160;

  // Draw Logo Triangle
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(130, headerY - 14);
  ctx.lineTo(146, headerY + 2);
  ctx.lineTo(114, headerY + 2);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = "left";
  ctx.font = `700 14px ${FONT}`;
  ctx.fillText(data.storeName.toUpperCase(), 160, headerY);

  ctx.strokeStyle = SEP;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 170);
  ctx.lineTo(370, 170);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.font = `400 10px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(data.orderNumber.toUpperCase(), 200, 190);
  ctx.fillText(data.date, 200, 205);

  ctx.strokeStyle = SEP;
  ctx.beginPath();
  ctx.moveTo(30, 220);
  ctx.lineTo(370, 220);
  ctx.stroke();

  ctx.font = `400 8px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("ITEM", 40, 235);
  ctx.textAlign = "right";
  ctx.fillText("AMOUNT", 360, 235);

  ctx.beginPath();
  ctx.moveTo(30, 242);
  ctx.lineTo(370, 242);
  ctx.stroke();

  // Draw items
  let total = 0;
  data.items.forEach((item, i) => {
    const iy = 275 + i * 38;
    total += item.price;

    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.font = `500 11px ${FONT}`;
    // Limit item name to fit nicely
    const nameText = item.name.length > 25 ? item.name.substring(0, 22) + "..." : item.name;
    ctx.fillText(nameText, 40, iy);

    if (item.unit) {
      ctx.fillStyle = "rgba(0,0,0,0.88)";
      ctx.font = `400 8px ${FONT}`;
      ctx.fillText(item.unit, 40, iy + 12);
    }

    ctx.fillStyle = "#000000";
    ctx.textAlign = "right";
    ctx.font = `500 11px ${FONT}`;
    ctx.fillText(`${data.currencySymbol}${item.price.toFixed(2)}`, 360, iy);

    if (i < data.items.length - 1) {
      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.beginPath();
      ctx.moveTo(30, iy + 22);
      ctx.lineTo(370, iy + 22);
      ctx.stroke();
    }
  });

  // Dynamic Total Position
  // Draw separator line after the last item
  const totalY = 275 + data.items.length * 38 - 16;
  ctx.strokeStyle = "rgba(0,0,0,1)";
  ctx.beginPath();
  ctx.moveTo(30, totalY);
  ctx.lineTo(370, totalY);
  ctx.stroke();

  // Draw Total Due
  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = `400 8px ${FONT}`;
  ctx.fillText("TOTAL DUE", 40, totalY + 20);
  ctx.textAlign = "right";
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText(`${data.currencySymbol}${total.toFixed(2)}`, 360, totalY + 20);

  // Draw barcode section
  const barcodeY = totalY + 50;
  ctx.strokeStyle = SEP;
  ctx.beginPath();
  ctx.moveTo(30, barcodeY);
  ctx.lineTo(370, barcodeY);
  ctx.stroke();

  drawBarcode(ctx, 60, barcodeY + 20, 280, 42, "#000000");
  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";
  ctx.font = `400 8px ${FONT}`;
  ctx.fillText(data.barcodeText, 200, barcodeY + 75);

  // Draw footer text
  const finalSepY = barcodeY + 88;
  ctx.strokeStyle = SEP;
  ctx.beginPath();
  ctx.moveTo(30, finalSepY);
  ctx.lineTo(370, finalSepY);
  ctx.stroke();
  ctx.fillText(data.footerText, 200, finalSepY + 22);
}

export function PhysicsReceipt({
  storeName = "VERCEL STORE",
  orderNumber = "ORDER 191-00",
  date,
  items = DEFAULT_ITEMS,
  currencySymbol = "$",
  barcodeText = "4 2 2 9 1 – 0 0 8 4 – 5 9 9 9",
  footerText = "vercel.com  ·  Thank you for building.",
}: PhysicsReceiptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const grabbedPartRef = useRef<Particle | null>(null);
  const rafRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const initializedRef = useRef(false);

  const cvsRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<CanvasTexture | null>(null);

  const [defaultDate] = useState(getFormattedDate);
  const finalDate = date || defaultDate;
  const itemsKey = JSON.stringify(items);

  const pauseAnimation = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resumeAnimation = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  // Update canvas texture dynamically when data changes without resetting physics
  useEffect(() => {
    const cvs = cvsRef.current;
    const texture = textureRef.current;
    if (!cvs || !texture) return;

    drawReceipt(cvs, {
      storeName,
      orderNumber,
      date: finalDate,
      items,
      currencySymbol,
      barcodeText,
      footerText,
    });

    texture.needsUpdate = true;
  }, [storeName, orderNumber, finalDate, items, itemsKey, currencySymbol, barcodeText, footerText]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || initializedRef.current) return;

    // Load Geist Mono font dynamically (deduplicated)
    let link: HTMLLinkElement | null = document.querySelector('link[href*="Geist+Mono"]');
    const isNewLink = !link;
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;700&display=swap";
      document.head.appendChild(link);
    }

    initializedRef.current = true;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new Scene();
    const camera = new PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, -4, 28);

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      if (!renderer.getContext()) {
        throw new Error("WebGL context creation failed");
      }
    } catch (error) {
      container.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-family:monospace;font-size:14px;text-align:center;padding:20px;">WebGL not supported.<br/>Please use a modern browser.</div>';
      if (isNewLink && link) link.remove();
      initializedRef.current = false;
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isPausedRef.current = true;
    };
    const handleContextRestored = () => {
      isPausedRef.current = false;
    };

    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored);
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    scene.add(new AmbientLight(0xffffff, 0.7));

    const keyLight = new DirectionalLight(0xfff9f0, 1.4);
    keyLight.position.set(-2, 7, 14);
    scene.add(keyLight);

    const fillLight = new DirectionalLight(0xeef4ff, 0.5);
    fillLight.position.set(6, -3, 10);
    scene.add(fillLight);

    const edgeLight = new DirectionalLight(0xffffff, 0.7);
    edgeLight.position.set(1, 0, 2.5);
    scene.add(edgeLight);

    const rimLight = new PointLight(0xfff0c0, 1.2, 55);
    rimLight.position.set(0, -14, -6);
    scene.add(rimLight);

    // --- Printer Slot ---
    const slotGeo = new BoxGeometry(PAPER_WIDTH + 1, 0.8, 1.5);
    const slotMat = new MeshStandardMaterial({ color: 0x111111, metalness: 0.85, roughness: 0.12 });
    const slot = new Mesh(slotGeo, slotMat);
    slot.position.set(0, PAPER_HEIGHT / 2, 0.2);
    scene.add(slot);

    // --- Canvas Texture Generation (Optimized Gray Matte Paper) ---
    const canvasScale = 2;
    const cvs = document.createElement("canvas");
    cvs.width = 400 * canvasScale;
    cvs.height = 800 * canvasScale;
    cvsRef.current = cvs;

    drawReceipt(cvs, {
      storeName,
      orderNumber,
      date: finalDate,
      items,
      currencySymbol,
      barcodeText,
      footerText,
    });

    const texture = new CanvasTexture(cvs);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.needsUpdate = true;
    textureRef.current = texture;

    // --- Physics Initialization ---
    const particles: Particle[] = [];
    const constraints: Constraint[] = [];
    const geometry = new PlaneGeometry(PAPER_WIDTH, PAPER_HEIGHT, RESOLUTION_X, RESOLUTION_Y);

    const material = new MeshPhysicalMaterial({
      map: texture,
      side: DoubleSide,
      roughness: 0.85,
      metalness: 0.05,
      clearcoat: 0.05,
      reflectivity: 0.01,
    });

    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    // Create particles
    for (let y = 0; y <= RESOLUTION_Y; y++) {
      for (let x = 0; x <= RESOLUTION_X; x++) {
        const p = new Particle(
          (x / RESOLUTION_X - 0.5) * PAPER_WIDTH,
          (0.5 - y / RESOLUTION_Y) * PAPER_HEIGHT,
          0
        );
        if (y === 0) p.pinned = true; // Pin top vertices to the slot
        particles.push(p);
      }
    }

    const getIdx = (x: number, y: number) => y * (RESOLUTION_X + 1) + x;

    // Create Constraints (structural, diagonal, and bend constraints)
    for (let y = 0; y <= RESOLUTION_Y; y++) {
      for (let x = 0; x <= RESOLUTION_X; x++) {
        if (x < RESOLUTION_X)
          constraints.push(new Constraint(particles[getIdx(x, y)], particles[getIdx(x + 1, y)]));
        if (y < RESOLUTION_Y)
          constraints.push(new Constraint(particles[getIdx(x, y)], particles[getIdx(x, y + 1)]));
        if (x < RESOLUTION_X && y < RESOLUTION_Y) {
          constraints.push(new Constraint(particles[getIdx(x, y)], particles[getIdx(x + 1, y + 1)], 0.8));
          constraints.push(new Constraint(particles[getIdx(x + 1, y)], particles[getIdx(x, y + 1)], 0.8));
        }
        if (x < RESOLUTION_X - 2)
          constraints.push(new Constraint(particles[getIdx(x, y)], particles[getIdx(x + 2, y)], BEND_STIFFNESS));
        if (y < RESOLUTION_Y - 2)
          constraints.push(new Constraint(particles[getIdx(x, y)], particles[getIdx(x, y + 2)], BEND_STIFFNESS));
      }
    }

    // --- Drag and Throw Handling ---
    const mouse = new Vector2();
    const raycaster = new Raycaster();
    const tempVec = new Vector3();
    const tempDir = new Vector3();
    const tempPos = new Vector3();

    const updateMousePosition = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onStart = (e: MouseEvent | TouchEvent) => {
      updateMousePosition(e);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(mesh);
      if (hits.length > 0 && hits[0].face && hits[0].face.a !== undefined && particles[hits[0].face.a]) {
        grabbedPartRef.current = particles[hits[0].face.a];
      }
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!grabbedPartRef.current) return;
      updateMousePosition(e);
      tempVec.set(mouse.x, mouse.y, 0.5).unproject(camera);
      tempDir.copy(tempVec).sub(camera.position).normalize();
      const distance = -camera.position.z / tempDir.z;
      tempPos.copy(camera.position).add(tempDir.multiplyScalar(distance));
      grabbedPartRef.current.pos.lerp(tempPos, 0.2);
    };

    const onEnd = () => {
      grabbedPartRef.current = null;
    };

    container.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    container.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);

    // --- Resize Handling ---
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }, 100);
    });
    resizeObserver.observe(container);

    let time = 0;
    const positions = geometry.attributes.position;

    // --- Simulation Loop ---
    const animate = () => {
      if (isPausedRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      time += 0.02;
      const windStrength = 0.002;
      particles.forEach((p) => {
        if (!p.pinned) {
          p.acc.x = Math.sin(time + p.pos.y) * windStrength;
          p.acc.z = Math.cos(time * 0.5 + p.pos.x) * windStrength;
        }
      });
      for (let i = 0; i < ITERATIONS; i++) constraints.forEach((c) => c.solve());
      particles.forEach((p) => p.update());

      for (let i = 0; i < particles.length; i++) {
        positions.setXYZ(i, particles[i].pos.x, particles[i].pos.y, particles[i].pos.z);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      initializedRef.current = false;
      cvsRef.current = null;
      textureRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();

      container.removeEventListener("mousedown", onStart);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      container.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      slotGeo.dispose();
      slotMat.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
      if (isNewLink && link) link.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAnimation();
      } else {
        resumeAnimation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pauseAnimation, resumeAnimation]);

  return (
    <div className="w-full max-w-[700px] h-[600px] flex items-center justify-center select-none bg-gray-100 dark:bg-[#181816] rounded-md overflow-hidden border border-border-soft/60 relative">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
