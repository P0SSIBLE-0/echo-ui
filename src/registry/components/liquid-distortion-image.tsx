"use client";

import { useEffect, useRef, useState } from "react";
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  TextureLoader,
  Vector2,
  LinearFilter,
  SRGBColorSpace,
} from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uMouse;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform float uIntensity;
  uniform float uFrequency;
  uniform float uSpeed;
  uniform float uRadius;

  uniform vec2 uClickPos;
  uniform float uClickTime;
  uniform float uClickIntensity;

  varying vec2 vUv;

  // 2D Simplex Noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ) );
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // Aspect ratio cover calculation maintaining texture ratio
    vec2 ratio = vec2(
      min((uResolution.x / uResolution.y) / (uImageResolution.x / uImageResolution.y), 1.0),
      min((uResolution.y / uResolution.x) / (uImageResolution.y / uImageResolution.x), 1.0)
    );

    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // Aspect-corrected distance for clean circular cursor radius
    float aspect = uResolution.x / uResolution.y;
    vec2 aspectUv = vec2(vUv.x * aspect, vUv.y);
    vec2 aspectMouse = vec2(uMouse.x * aspect, uMouse.y);

    float dist = length(aspectUv - aspectMouse);

    // Strictly localized falloff limited to uRadius around the cursor
    float mouseInfluence = smoothstep(uRadius, 0.0, dist);
    mouseInfluence = pow(mouseInfluence, 1.4);

    float t = uTime * uSpeed;

    // Organic multi-layered liquid wave noise
    float n1 = snoise(uv * uFrequency + vec2(t * 0.6, t * 0.4));
    float n2 = snoise(uv * (uFrequency * 2.0) - vec2(t * 0.5, t * 0.8));
    vec2 noiseVector = vec2(n1, n2);

    // Velocity offset adding directional displacement on fast mouse movement
    vec2 velOffset = uVelocity * 0.3;

    // Base localized liquid distortion
    vec2 distortion = (noiseVector + velOffset) * uIntensity * uHover * mouseInfluence;

    // Click wave ripple simulation propagating outward
    if (uClickIntensity > 0.001) {
      vec2 aspectClick = vec2(uClickPos.x * aspect, uClickPos.y);
      float clickDist = length(aspectUv - aspectClick);
      float waveRadius = uClickTime * 0.7;
      float ringDistance = abs(clickDist - waveRadius);
      float ringWidth = 0.15;

      if (ringDistance < ringWidth) {
        float ringIntensity = (1.0 - ringDistance / ringWidth) * (1.0 - smoothstep(0.0, 0.9, waveRadius));
        float wave = sin(clickDist * 40.0 - uClickTime * 20.0) * ringIntensity;
        vec2 clickDir = clickDist > 0.0001 ? normalize(aspectUv - aspectClick) : vec2(0.0);
        distortion += clickDir * wave * uClickIntensity * 0.04;
      }
    }

    // Chromatic dispersion offsets strictly inside distorted area
    float rOffset = distortion.x * 0.18;
    float gOffset = distortion.y * 0.12;
    float bOffset = (distortion.x + distortion.y) * 0.06;

    vec4 rColor = texture2D(uTexture, uv + distortion + vec2(rOffset, 0.0));
    vec4 gColor = texture2D(uTexture, uv + distortion + vec2(0.0, gOffset));
    vec4 bColor = texture2D(uTexture, uv + distortion - vec2(bOffset, bOffset));

    gl_FragColor = vec4(rColor.r, gColor.g, bColor.b, rColor.a);
  }
`;

export interface LiquidDistortionImageProps {
  src?: string;
  alt?: string;
  className?: string;
  intensity?: number;
  speed?: number;
  frequency?: number;
  radius?: number;
  resolution?: number;
  hoverScale?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function LiquidDistortionImage({
  src = "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=745&auto=format&fit=crop",
  alt = "Liquid distortion image",
  className = "",
  intensity = 0.05,
  speed = 0.8,
  frequency = 2.5,
  radius = 0.29,
  resolution,
  hoverScale = false,
  onClick,
}: LiquidDistortionImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isHoveredRef = useRef(false);
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  const lastMouseRef = useRef({ x: 0.5, y: 0.5 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef<number>(0);

  const clickDataRef = useRef({
    x: 0.5,
    y: 0.5,
    time: 0,
    intensity: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;
    let renderer: WebGLRenderer | null = null;

    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      const targetDpr = resolution ?? Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(targetDpr);
    } catch {
      setHasError(true);
      return;
    }

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new PlaneGeometry(2, 2);

    const uniforms = {
      uTexture: { value: null as any },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uVelocity: { value: new Vector2(0, 0) },
      uResolution: { value: new Vector2(1, 1) },
      uImageResolution: { value: new Vector2(1, 1) },
      uIntensity: { value: intensity },
      uFrequency: { value: frequency },
      uSpeed: { value: speed },
      uRadius: { value: radius },
      uClickPos: { value: new Vector2(0.5, 0.5) },
      uClickTime: { value: 0 },
      uClickIntensity: { value: 0 },
    };

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    const loader = new TextureLoader();
    loader.setCrossOrigin("anonymous");

    loader.load(
      src,
      (texture) => {
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.colorSpace = SRGBColorSpace;
        uniforms.uTexture.value = texture;
        uniforms.uImageResolution.value.set(
          texture.image.width || 1,
          texture.image.height || 1
        );
        setIsLoaded(true);
      },
      undefined,
      () => {
        setHasError(true);
      }
    );

    const handleResize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let currentHover = 0;
    let currentMouse = { x: 0.5, y: 0.5 };
    let currentVelocity = { x: 0, y: 0 };
    let clockTime = 0;

    const animate = () => {
      clockTime += 0.016;
      uniforms.uTime.value = clockTime;

      // Check if mouse has been stationary for longer than 3.5 seconds
      const now = performance.now();
      const timeSinceLastMove = (now - lastMoveTimeRef.current) / 1000;
      const isStationary = timeSinceLastMove > 3.5;

      // Smooth hover lerp: fades to 0 if cursor stays still for > 3.5 seconds
      const targetHover = isHoveredRef.current && !isStationary ? 1 : 0;
      currentHover += (targetHover - currentHover) * 0.08;
      uniforms.uHover.value = currentHover;

      // Smooth mouse lerp
      currentMouse.x += (targetMouseRef.current.x - currentMouse.x) * 0.12;
      currentMouse.y += (targetMouseRef.current.y - currentMouse.y) * 0.12;
      uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);

      // Smooth velocity decay
      currentVelocity.x += (velocityRef.current.x - currentVelocity.x) * 0.1;
      currentVelocity.y += (velocityRef.current.y - currentVelocity.y) * 0.1;
      uniforms.uVelocity.value.set(currentVelocity.x, currentVelocity.y);
      velocityRef.current.x *= 0.85;
      velocityRef.current.y *= 0.85;

      // Update click ripple uniform parameters
      if (clickDataRef.current.intensity > 0.001) {
        clickDataRef.current.time += 0.016;
        clickDataRef.current.intensity *= 0.96;
        uniforms.uClickPos.value.set(
          clickDataRef.current.x,
          clickDataRef.current.y
        );
        uniforms.uClickTime.value = clickDataRef.current.time;
        uniforms.uClickIntensity.value = clickDataRef.current.intensity;
      } else {
        uniforms.uClickIntensity.value = 0;
      }

      renderer?.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      uniforms.uTexture.value?.dispose();
      renderer?.dispose();
    };
  }, [src, intensity, speed, frequency, radius, resolution]);

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = 1.0 - (clientY - rect.top) / rect.height; // Invert Y for WebGL UV space

    velocityRef.current = {
      x: (x - lastMouseRef.current.x) * 3.0,
      y: (y - lastMouseRef.current.y) * 3.0,
    };

    lastMouseRef.current = { x, y };
    targetMouseRef.current = { x, y };
    lastMoveTimeRef.current = performance.now();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updatePosition(e.clientX, e.clientY);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    isHoveredRef.current = true;
    updatePosition(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    velocityRef.current = { x: 0, y: 0 };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;

    lastMoveTimeRef.current = performance.now();
    clickDataRef.current = {
      x,
      y,
      time: 0,
      intensity: 1.0,
    };

    if (onClick) onClick(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      isHoveredRef.current = true;
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    isHoveredRef.current = false;
  };

  if (hasError) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-zinc-900 ${className}`}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`group relative overflow-hidden rounded-md cursor-pointer select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className={`h-full w-full block transition-transform duration-500 ease-out ${hoverScale ? "group-hover:scale-105" : ""
          }`}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-900/80 animate-pulse flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
        </div>
      )}
      <span className="sr-only">{alt}</span>
    </div>
  );
}

export default LiquidDistortionImage;
