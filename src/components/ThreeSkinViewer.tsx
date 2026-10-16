import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArmModel } from '../types';
import { RotateCw, Play, Pause, ZoomIn, ZoomOut, Eye } from 'lucide-react';

interface ThreeSkinViewerProps {
  skinCanvas: HTMLCanvasElement | null;
  model: ArmModel;
  className?: string;
}

/**
 * Creates UV attribute array for a BoxGeometry with Minecraft Bedrock texture mapping.
 * In Three.js BoxGeometry, the 6 faces are:
 * Face 0: +X (Right)
 * Face 1: -X (Left)
 * Face 2: +Y (Top)
 * Face 3: -Y (Bottom)
 * Face 4: +Z (Front)
 * Face 5: -Z (Back)
 */
function createBoxUVs(
  u: number,
  v: number,
  w: number,
  h: number,
  d: number,
  texW = 64,
  texH = 64
): Float32Array {
  // Convert coordinate rect to UV (v flipped for WebGL)
  const rect = (x: number, y: number, rw: number, rh: number) => {
    const u0 = x / texW;
    const u1 = (x + rw) / texW;
    const v0 = (texH - (y + rh)) / texH;
    const v1 = (texH - y) / texH;
    // Each quad has 2 triangles: 4 vertices (TL, BL, TR, BR)
    // BoxGeometry vertex order per face: TL, TR, BL, BR or similar
    return [
      u0, v1, // top-left
      u1, v1, // top-right
      u0, v0, // bottom-left
      u1, v0, // bottom-right
    ];
  };

  const right = rect(u, v + d, d, h);
  const front = rect(u + d, v + d, w, h);
  const left = rect(u + d + w, v + d, d, h);
  const back = rect(u + d + w + d, v + d, w, h);
  const top = rect(u + d, v, w, d);
  const bottom = rect(u + d + w, v, w, d);

  // In Three.js BoxGeometry:
  // Face order: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
  const uvs: number[] = [
    ...right, // +X
    ...left,  // -X
    ...top,   // +Y
    ...bottom,// -Y
    ...front, // +Z
    ...back,  // -Z
  ];

  return new Float32Array(uvs);
}

function applyMinecraftUVs(
  geom: THREE.BoxGeometry,
  u: number,
  v: number,
  w: number,
  h: number,
  d: number
) {
  const uvAttr = createBoxUVs(u, v, w, h, d);
  geom.setAttribute('uv', new THREE.BufferAttribute(uvAttr, 2));
}

export const ThreeSkinViewer: React.FC<ThreeSkinViewerProps> = ({
  skinCanvas,
  model,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [isWalking, setIsWalking] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);

  // Animation and state refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const overlaysGroupRef = useRef<THREE.Group | null>(null);

  // Limbs for walking animation
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Group | null>(null);
  const rightLegRef = useRef<THREE.Group | null>(null);
  const headRef = useRef<THREE.Group | null>(null);

  // Interaction controls
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(38);

  const isSlim = model === 'slim';

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, zoomRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5ea, 1.6);
    dirLight1.position.set(20, 30, 30);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd9ecff, 0.8);
    dirLight2.position.set(-20, -10, -20);
    scene.add(dirLight2);

    // Ground platform / shadow pedestal
    const platformGeom = new THREE.CylinderGeometry(14, 15, 1.2, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.y = -17;
    scene.add(platform);

    // Platform glow ring
    const ringGeom = new THREE.RingGeometry(13.8, 14.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -16.3;
    scene.add(ring);

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Slow idle rotation
      if (isRotating && characterGroupRef.current && !isDraggingRef.current) {
        characterGroupRef.current.rotation.y += delta * 0.75;
      }

      // Walking limb swing
      if (isWalking) {
        const swing = Math.sin(elapsed * 4) * 0.45;
        if (leftArmRef.current) leftArmRef.current.rotation.x = -swing;
        if (rightArmRef.current) rightArmRef.current.rotation.x = swing;
        if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
        if (headRef.current) headRef.current.rotation.y = Math.sin(elapsed * 1.5) * 0.08;
      } else {
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
        if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (headRef.current) headRef.current.rotation.y = 0;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      platformGeom.dispose();
      platformMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
    };
  }, []);

  // Build / Rebuild Steve/Alex Character Meshes when model or texture changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up previous character
    if (characterGroupRef.current) {
      scene.remove(characterGroupRef.current);
    }

    // Create / Update CanvasTexture
    let texture: THREE.CanvasTexture;
    if (skinCanvas) {
      texture = new THREE.CanvasTexture(skinCanvas);
    } else {
      // Default placeholder canvas
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 64;
      dummyCanvas.height = 64;
      const ctx = dummyCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(0, 0, 64, 64);
      }
      texture = new THREE.CanvasTexture(dummyCanvas);
    }

    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = texture;

    // Materials
    const baseMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
    });

    const overlayMat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.25,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const characterGroup = new THREE.Group();
    characterGroup.position.y = 2; // Center character on platform
    characterGroupRef.current = characterGroup;

    const overlaysGroup = new THREE.Group();
    overlaysGroupRef.current = overlaysGroup;
    overlaysGroup.visible = showOverlays;

    const armW = isSlim ? 3 : 4;

    // ---------------- HEAD ----------------
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 8, 0); // Neck pivot
    headRef.current = headPivot;

    const headGeom = new THREE.BoxGeometry(8, 8, 8);
    applyMinecraftUVs(headGeom, 0, 0, 8, 8, 8);
    const headMesh = new THREE.Mesh(headGeom, baseMat);
    headMesh.position.set(0, 4, 0);
    headPivot.add(headMesh);

    // Head Overlay (Hat)
    const hatGeom = new THREE.BoxGeometry(9, 9, 9);
    applyMinecraftUVs(hatGeom, 32, 0, 8, 8, 8);
    const hatMesh = new THREE.Mesh(hatGeom, overlayMat);
    hatMesh.position.set(0, 4, 0);
    headPivot.add(hatMesh);

    characterGroup.add(headPivot);

    // ---------------- TORSO ----------------
    const bodyGeom = new THREE.BoxGeometry(8, 12, 4);
    applyMinecraftUVs(bodyGeom, 16, 16, 8, 12, 4);
    const bodyMesh = new THREE.Mesh(bodyGeom, baseMat);
    bodyMesh.position.set(0, 2, 0);
    characterGroup.add(bodyMesh);

    // Torso Overlay (Jacket)
    const jacketGeom = new THREE.BoxGeometry(8.6, 12.6, 4.6);
    applyMinecraftUVs(jacketGeom, 16, 32, 8, 12, 4);
    const jacketMesh = new THREE.Mesh(jacketGeom, overlayMat);
    jacketMesh.position.set(0, 2, 0);
    overlaysGroup.add(jacketMesh);

    // ---------------- RIGHT ARM ----------------
    const rightArmPivot = new THREE.Group();
    const rightArmX = isSlim ? -5.5 : -6;
    rightArmPivot.position.set(rightArmX, 7, 0); // Shoulder pivot
    rightArmRef.current = rightArmPivot;

    const rightArmGeom = new THREE.BoxGeometry(armW, 12, 4);
    applyMinecraftUVs(rightArmGeom, 40, 16, armW, 12, 4);
    const rightArmMesh = new THREE.Mesh(rightArmGeom, baseMat);
    rightArmMesh.position.set(0, -5, 0);
    rightArmPivot.add(rightArmMesh);

    // Right Arm Overlay
    const rightArmOverlayGeom = new THREE.BoxGeometry(armW + 0.6, 12.6, 4.6);
    applyMinecraftUVs(rightArmOverlayGeom, 40, 32, armW, 12, 4);
    const rightArmOverlayMesh = new THREE.Mesh(rightArmOverlayGeom, overlayMat);
    rightArmOverlayMesh.position.set(0, -5, 0);
    rightArmPivot.add(rightArmOverlayMesh);

    characterGroup.add(rightArmPivot);

    // ---------------- LEFT ARM ----------------
    const leftArmPivot = new THREE.Group();
    const leftArmX = isSlim ? 5.5 : 6;
    leftArmPivot.position.set(leftArmX, 7, 0); // Shoulder pivot
    leftArmRef.current = leftArmPivot;

    const leftArmGeom = new THREE.BoxGeometry(armW, 12, 4);
    applyMinecraftUVs(leftArmGeom, 32, 48, armW, 12, 4);
    const leftArmMesh = new THREE.Mesh(leftArmGeom, baseMat);
    leftArmMesh.position.set(0, -5, 0);
    leftArmPivot.add(leftArmMesh);

    // Left Arm Overlay
    const leftArmOverlayGeom = new THREE.BoxGeometry(armW + 0.6, 12.6, 4.6);
    applyMinecraftUVs(leftArmOverlayGeom, 48, 48, armW, 12, 4);
    const leftArmOverlayMesh = new THREE.Mesh(leftArmOverlayGeom, overlayMat);
    leftArmOverlayMesh.position.set(0, -5, 0);
    leftArmPivot.add(leftArmOverlayMesh);

    characterGroup.add(leftArmPivot);

    // ---------------- RIGHT LEG ----------------
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(-2, -4, 0); // Hip pivot
    rightLegRef.current = rightLegPivot;

    const rightLegGeom = new THREE.BoxGeometry(4, 12, 4);
    applyMinecraftUVs(rightLegGeom, 0, 16, 4, 12, 4);
    const rightLegMesh = new THREE.Mesh(rightLegGeom, baseMat);
    rightLegMesh.position.set(0, -6, 0);
    rightLegPivot.add(rightLegMesh);

    // Right Leg Overlay
    const rightLegOverlayGeom = new THREE.BoxGeometry(4.6, 12.6, 4.6);
    applyMinecraftUVs(rightLegOverlayGeom, 0, 32, 4, 12, 4);
    const rightLegOverlayMesh = new THREE.Mesh(rightLegOverlayGeom, overlayMat);
    rightLegOverlayMesh.position.set(0, -6, 0);
    rightLegPivot.add(rightLegOverlayMesh);

    characterGroup.add(rightLegPivot);

    // ---------------- LEFT LEG ----------------
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(2, -4, 0); // Hip pivot
    leftLegRef.current = leftLegPivot;

    const leftLegGeom = new THREE.BoxGeometry(4, 12, 4);
    applyMinecraftUVs(leftLegGeom, 16, 48, 4, 12, 4);
    const leftLegMesh = new THREE.Mesh(leftLegGeom, baseMat);
    leftLegMesh.position.set(0, -6, 0);
    leftLegPivot.add(leftLegMesh);

    // Left Leg Overlay
    const leftLegOverlayGeom = new THREE.BoxGeometry(4.6, 12.6, 4.6);
    applyMinecraftUVs(leftLegOverlayGeom, 0, 48, 4, 12, 4);
    const leftLegOverlayMesh = new THREE.Mesh(leftLegOverlayGeom, overlayMat);
    leftLegOverlayMesh.position.set(0, -6, 0);
    leftLegPivot.add(leftLegOverlayMesh);

    characterGroup.add(leftLegPivot);

    characterGroup.add(overlaysGroup);
    scene.add(characterGroup);

    return () => {
      headGeom.dispose();
      hatGeom.dispose();
      bodyGeom.dispose();
      jacketGeom.dispose();
      rightArmGeom.dispose();
      rightArmOverlayGeom.dispose();
      leftArmGeom.dispose();
      leftArmOverlayGeom.dispose();
      rightLegGeom.dispose();
      rightLegOverlayGeom.dispose();
      leftLegGeom.dispose();
      leftLegOverlayGeom.dispose();
      baseMat.dispose();
      overlayMat.dispose();
      texture.dispose();
    };
  }, [skinCanvas, isSlim, showOverlays]);

  // Mouse & Touch Orbit Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !characterGroupRef.current) return;
    const deltaX = e.clientX - prevMouseRef.current.x;
    const deltaY = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    characterGroupRef.current.rotation.y += deltaX * 0.015;
    characterGroupRef.current.rotation.x = Math.max(
      -0.5,
      Math.min(0.5, characterGroupRef.current.rotation.x + deltaY * 0.01)
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture error
    }
  };

  const adjustZoom = (amount: number) => {
    if (!cameraRef.current) return;
    zoomRef.current = Math.max(22, Math.min(65, zoomRef.current + amount));
    cameraRef.current.position.z = zoomRef.current;
  };

  const resetCamera = () => {
    if (characterGroupRef.current) {
      characterGroupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      zoomRef.current = 38;
      cameraRef.current.position.set(0, 0, 38);
    }
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing touch-none rounded-xl overflow-hidden bg-radial from-[#182338] via-[#0c1322] to-[#070b14]"
      />

      {/* Floating Viewport Controls (Bottom Dock) */}
      <div className="absolute bottom-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg text-xs text-slate-300">
        <button
          onClick={() => setIsRotating(!isRotating)}
          title={isRotating ? 'Pause auto-rotate' : 'Auto rotate'}
          className={`p-1.5 rounded-full transition ${isRotating ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsWalking(!isWalking)}
          title={isWalking ? 'Pause walking animation' : 'Play walking animation'}
          className={`p-1.5 rounded-full transition ${isWalking ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}
        >
          {isWalking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setShowOverlays(!showOverlays)}
          title={showOverlays ? 'Hide 3D armor/jacket overlays' : 'Show 3D overlays'}
          className={`p-1.5 rounded-full transition ${showOverlays ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

        <button
          onClick={() => adjustZoom(-6)}
          title="Zoom in"
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => adjustZoom(6)}
          title="Zoom out"
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={resetCamera}
          title="Reset position"
          className="px-2 py-1 rounded-full text-[10px] font-medium hover:bg-slate-800 text-slate-400 transition"
        >
          Reset
        </button>
      </div>

      <div className="mt-1 text-[11px] text-slate-400 text-center">
        Drag to rotate 360° • Pinch / scroll to zoom
      </div>
    </div>
  );
};
