"use client";

import React, { useEffect, useRef } from "react";
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Vector2,
  Color,
} from "three";

// Smooth Gradient Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform float uDistortion;
  uniform float uGrain;
  uniform vec3 uColor1; // #070A14 (Dark Navy Background)
  uniform vec3 uColor2; // #D71920 (Crimson Red)
  uniform vec3 uColor3; // #008FFF (Electric Cyan)
  uniform vec3 uColor4; // #FFFFFF (Silky White Sheen)
  uniform vec3 uColor5; // #35C7FF (Cyan Accent)

  varying vec2 vUv;

  // 2D Simplex Noise for smooth fluid domain warping
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,
      0.366025403784439,
      -0.577350269189626,
      0.024390243902439
    );
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
    );
    vec3 m = max(
      0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
      0.0
    );
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 st = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 aspectSt = vec2(st.x * aspect, st.y);
    vec2 aspectMouse = vec2(uMouse.x * aspect, uMouse.y);

    float t = uTime * uSpeed * 0.22; // Smooth flowing ambient velocity

    // Interactive cursor refraction & fluid ripple
    float mouseDist = length(aspectSt - aspectMouse);
    float glassLens = exp(-mouseDist * mouseDist * 4.5);
    vec2 mouseRefraction = (aspectSt - aspectMouse) * glassLens * 0.18 * uIntensity;

    vec2 p = aspectSt + mouseRefraction;

    // Multi-octave organic domain warping for continuous fluid flow & blending
    vec2 warp1 = vec2(
      snoise(p * 1.1 + vec2(t * 0.4, t * 0.25)),
      snoise(p * 1.1 + vec2(-t * 0.3, t * 0.45))
    ) * 0.16 * uDistortion;

    vec2 warp2 = vec2(
      snoise(p * 2.2 + 1.2 * warp1 + vec2(t * 0.3, -t * 0.2)),
      snoise(p * 2.2 + 1.2 * warp1 + vec2(-t * 0.25, t * 0.35))
    ) * 0.12 * uDistortion;

    vec2 warpedP = p + warp1 + warp2;

    // Color definitions
    vec3 colBg = uColor1;                          // #070A14 (Deep Dark Navy)
    vec3 colRed = uColor2;                         // #D71920 (Crimson Red)
    vec3 colCyan = uColor3;                        // #008FFF (Electric Cyan)
    vec3 colWhite = uColor4;                       // #FFFFFF (Silky White Sheen)
    vec3 colCyanSoft = uColor5;                    // #35C7FF (Cyan Accent)

    // 1. Base Dark Navy Background
    vec3 color = mix(colBg, vec3(0.031, 0.082, 0.157), st.y * 0.5);

    // 2. Red Volumetric Field (Top-Left)
    vec2 redCenter = vec2(0.36 * aspect, 0.86) + warp1 * 0.4;
    float redDist = length((warpedP - redCenter) / (0.50 * aspect));
    float redField = exp(-pow(redDist, 1.5) * 1.8);
    color += colRed * redField * 0.95;

    // 3. Cyan Volumetric Field (Bottom-Right)
    vec2 blueCenter = vec2(0.84 * aspect, 0.16) - warp1 * 0.4;
    float blueDist = length((warpedP - blueCenter) / (0.42 * aspect));
    float blueField = exp(-pow(blueDist, 1.5) * 2.2);
    vec3 blueCol = mix(colCyan, colCyanSoft, st.x);
    color += blueCol * blueField * 1.05;

    // 4. Diagonal White Light Ribbon (Top-Right sweeping Downward)
    float diagVal = warpedP.x + warpedP.y * aspect * 0.8 + warp2.x * 0.5;
    float ribbonDist = abs(diagVal - 1.25 * aspect);
    float whiteRibbon = exp(-pow(ribbonDist / (0.24 * aspect), 2.0) * 2.5);
    color += colWhite * whiteRibbon * 0.45;

    // 5. Atmospheric Transition Overlay
    float overlap = redField * blueField * 2.8;
    vec3 purpleTint = vec3(0.35, 0.28, 0.55);
    color += purpleTint * overlap * 0.35;

    // 6. Subtle Edge Vignette
    vec2 uvVig = vUv * (1.0 - vUv.yx);
    float vig = pow(clamp(uvVig.x * uvVig.y * 16.0, 0.0, 1.0), 0.15);
    color *= vig;

    // 7. Fine Grain Dither
    float grain = uGrain > 0.0 ? uGrain : 0.02;
    float grainNoise = (fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * grain;
    color += grainNoise;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const DEFAULT_COLORS = [
  "#070a14", // Dark navy background (#070A14)
  "#d71920", // Crimson Red (#D71920)
  "#008fff", // Electric Cyan (#008FFF)
  "#ffffff", // Silky White Sheen (#FFFFFF)
  "#35c7ff", // Cyan Soft Accent (#35C7FF)
];

export interface ShaderGradientProps
  extends React.HTMLAttributes<HTMLDivElement> {
  colors?: string[];
  speed?: number;
  intensity?: number;
  distortion?: number;
  grain?: number;
  interactive?: boolean;
  dpr?: number;
  children?: React.ReactNode;
  containerClassName?: string;
}

export function ShaderGradient({
  colors = DEFAULT_COLORS,
  speed = 2.0,
  intensity = 1,
  distortion = 1.0,
  grain = 0.025,
  interactive = true,
  dpr = 1.5,
  children,
  className = "",
  containerClassName = "",
  ...props
}: ShaderGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const isVisible = useRef(true);

  // Parse color strings into Three Color objects
  const parsedColors = useRef<Color[]>([]);
  useEffect(() => {
    const palette = colors.length >= 5 ? colors : [...colors, ...DEFAULT_COLORS].slice(0, 5);
    parsedColors.current = palette.map((c) => new Color(c));
  }, [colors]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // WebGL setup
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });

    const pixelRatio = Math.min(window.devicePixelRatio, dpr);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Initial palette preparation
    const palette = colors.length >= 5 ? colors : [...colors, ...DEFAULT_COLORS].slice(0, 5);
    const colorObjs = palette.map((c) => new Color(c));

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uResolution: { value: new Vector2(width, height) },
      uSpeed: { value: speed },
      uIntensity: { value: intensity },
      uDistortion: { value: distortion },
      uGrain: { value: grain },
      uColor1: { value: colorObjs[0] },
      uColor2: { value: colorObjs[1] },
      uColor3: { value: colorObjs[2] },
      uColor4: { value: colorObjs[3] },
      uColor5: { value: colorObjs[4] },
    };

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const geometry = new PlaneGeometry(2, 2);
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    let animationFrameId: number;
    const startTime = performance.now();

    // IntersectionObserver to pause loop when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (!isVisible.current) return;

      const currentTime = (performance.now() - startTime) * 0.001;

      // Smooth, responsive mouse dampening (0.05 lerp factor)
      if (interactive) {
        mousePos.current.x += (targetMousePos.current.x - mousePos.current.x) * 0.05;
        mousePos.current.y += (targetMousePos.current.y - mousePos.current.y) * 0.05;
      }

      uniforms.uTime.value = currentTime;
      uniforms.uMouse.value.set(mousePos.current.x, mousePos.current.y);
      uniforms.uSpeed.value = speed;
      uniforms.uIntensity.value = intensity;
      uniforms.uDistortion.value = distortion;
      uniforms.uGrain.value = grain;

      if (parsedColors.current.length >= 5) {
        uniforms.uColor1.value = parsedColors.current[0];
        uniforms.uColor2.value = parsedColors.current[1];
        uniforms.uColor3.value = parsedColors.current[2];
        uniforms.uColor4.value = parsedColors.current[3];
        uniforms.uColor5.value = parsedColors.current[4];
      }

      renderer.render(scene, camera);
    };

    render();

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Mouse & Touch events
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height; // Invert Y for WebGL
      targetMousePos.current = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactive || !e.touches[0]) return;
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) / rect.width;
      const y = 1.0 - (touch.clientY - rect.top) / rect.height;
      targetMousePos.current = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [dpr, interactive, speed, intensity, distortion, grain]);

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      {...props}
    >
      <div
        ref={containerRef}
        className={`absolute inset-0 z-0 pointer-events-none w-full h-full ${className}`}
      />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

// Clean preview demo container for showcase/catalog
export default function ShaderGradientDemo() {
  return (
    <div className="relative w-full h-140 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <ShaderGradient containerClassName="w-full h-full" />
    </div>
  );
}
