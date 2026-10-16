import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { StructureData } from '../types';
import { RotateCw, ZoomIn, ZoomOut, Layers } from 'lucide-react';

interface ThreeVoxelViewerProps {
  structure: StructureData;
  className?: string;
}

export const ThreeVoxelViewer: React.FC<ThreeVoxelViewerProps> = ({
  structure,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [sliceY, setSliceY] = useState<number>(structure.size[1]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const zoomRef = useRef<number>(24);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  const [sizeX, sizeY, sizeZ] = structure.size;

  // Initialize Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(sizeX * 1.6, sizeY * 1.5, sizeZ * 2.2);
    camera.lookAt(0, sizeY * 0.4, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    dirLight.position.set(sizeX * 2, sizeY * 3, sizeZ * 2);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xcfd8dc, 0.9);
    fillLight.position.set(-sizeX * 2, -sizeY, -sizeZ * 2);
    scene.add(fillLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(Math.max(sizeX, sizeZ) * 2, Math.max(sizeX, sizeZ) * 2, 0x10b981, 0x1e293b);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (isRotating && groupRef.current && !isDraggingRef.current) {
        groupRef.current.rotation.y += delta * 0.4;
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
      gridHelper.dispose();
    };
  }, [sizeX, sizeY, sizeZ]);

  // Rebuild Voxels when structure or sliceY changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (groupRef.current) {
      scene.remove(groupRef.current);
    }

    const group = new THREE.Group();
    groupRef.current = group;

    // Centering offsets
    const offsetX = -sizeX / 2;
    const offsetZ = -sizeZ / 2;

    const boxGeom = new THREE.BoxGeometry(0.98, 0.98, 0.98);

    // Filter visible blocks by sliceY
    const visibleBlocks = structure.blocks.filter((b) => b.y <= sliceY);

    // Group blocks by color for efficient shared materials
    const colorGroups = new Map<string, typeof visibleBlocks>();
    visibleBlocks.forEach((b) => {
      const col = b.color || '#94a3b8';
      if (!colorGroups.has(col)) colorGroups.set(col, []);
      colorGroups.get(col)!.push(b);
    });

    colorGroups.forEach((blocks, colorHex) => {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.8,
        metalness: 0.1,
      });

      const instancedMesh = new THREE.InstancedMesh(boxGeom, mat, blocks.length);
      const dummy = new THREE.Object3D();

      blocks.forEach((b, i) => {
        dummy.position.set(b.x + offsetX, b.y, b.z + offsetZ);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
      group.add(instancedMesh);
    });

    scene.add(group);

    return () => {
      boxGeom.dispose();
    };
  }, [structure, sliceY, sizeX, sizeZ]);

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !groupRef.current) return;
    const deltaX = e.clientX - prevMouseRef.current.x;
    const deltaY = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    groupRef.current.rotation.y += deltaX * 0.015;
    groupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, groupRef.current.rotation.x + deltaY * 0.01));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture error
    }
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing touch-none rounded-xl overflow-hidden bg-radial from-[#152033] via-[#0c1220] to-[#070b14]"
      />

      {/* Slicing & Rotation Bar */}
      <div className="w-full mt-3 p-3 rounded-xl bg-[#0e1627] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 text-[11px] font-semibold shrink-0">
            Cutaway (Y: {sliceY}/{sizeY}):
          </span>
          <input
            type="range"
            min={0}
            max={sizeY}
            value={sliceY}
            onChange={(e) => setSliceY(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isRotating
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Auto rotate"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (groupRef.current) groupRef.current.rotation.set(0, 0, 0);
              setSliceY(sizeY);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
