import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RotateCcw,
  RotateCw,
  Paintbrush,
  Eraser,
  Pipette,
  PaintBucket,
  ZoomIn,
  ZoomOut,
  Layers,
  Check,
} from 'lucide-react';

interface PixelEditorModalProps {
  initialCanvas: HTMLCanvasElement;
  skinName: string;
  paletteColors: string[];
  onSave: (newCanvas: HTMLCanvasElement) => void;
  onClose: () => void;
}

export const PixelEditorModal: React.FC<PixelEditorModalProps> = ({
  initialCanvas,
  skinName,
  paletteColors,
  onSave,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState<string>(paletteColors[0] || '#10b981');
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'dropper' | 'bucket'>('pencil');
  const [zoom, setZoom] = useState<number>(6); // 1 canvas px = 6 screen px
  const [showUVGrid, setShowUVGrid] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Undo / Redo history
  const historyRef = useRef<ImageData[]>([]);
  const historyStepRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw initial content
    ctx.clearRect(0, 0, 64, 64);
    ctx.drawImage(initialCanvas, 0, 0);

    // Save initial history
    const initialImgData = ctx.getImageData(0, 0, 64, 64);
    historyRef.current = [initialImgData];
    historyStepRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, [initialCanvas]);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Truncate future steps
    const newHistory = historyRef.current.slice(0, historyStepRef.current + 1);
    newHistory.push(ctx.getImageData(0, 0, 64, 64));
    if (newHistory.length > 25) newHistory.shift();

    historyRef.current = newHistory;
    historyStepRef.current = newHistory.length - 1;
    setCanUndo(historyStepRef.current > 0);
    setCanRedo(false);
  }, []);

  const handleUndo = () => {
    if (historyStepRef.current <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    historyStepRef.current -= 1;
    ctx.putImageData(historyRef.current[historyStepRef.current], 0, 0);
    setCanUndo(historyStepRef.current > 0);
    setCanRedo(true);
  };

  const handleRedo = () => {
    if (historyStepRef.current >= historyRef.current.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    historyStepRef.current += 1;
    ctx.putImageData(historyRef.current[historyStepRef.current], 0, 0);
    setCanUndo(true);
    setCanRedo(historyStepRef.current < historyRef.current.length - 1);
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.floor((clientX - rect.left) / zoom);
    const y = Math.floor((clientY - rect.top) / zoom);
    return {
      x: Math.max(0, Math.min(63, x)),
      y: Math.max(0, Math.min(63, y)),
    };
  };

  const applyPixel = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (tool === 'pencil') {
      ctx.fillStyle = selectedColor;
      ctx.fillRect(x, y, 1, 1);
    } else if (tool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
    } else if (tool === 'dropper') {
      const p = ctx.getImageData(x, y, 1, 1).data;
      if (p[3] > 0) {
        const hex =
          '#' +
          [p[0], p[1], p[2]]
            .map((c) => c.toString(16).padStart(2, '0'))
            .join('');
        setSelectedColor(hex);
        setTool('pencil');
      }
    } else if (tool === 'bucket') {
      // Flood fill
      floodFill(ctx, x, y, selectedColor);
    }
  };

  const floodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillHex: string
  ) => {
    const imgData = ctx.getImageData(0, 0, 64, 64);
    const data = imgData.data;

    const startIdx = (startY * 64 + startX) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    // Parse fill color
    const num = parseInt(fillHex.replace('#', ''), 16);
    const fillR = (num >> 16) & 255;
    const fillG = (num >> 8) & 255;
    const fillB = num & 255;
    const fillA = 255;

    if (
      targetR === fillR &&
      targetG === fillG &&
      targetB === fillB &&
      targetA === fillA
    )
      return;

    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(64 * 64);

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      const idx = (cy * 64 + cx) * 4;
      const vIdx = cy * 64 + cx;

      if (visited[vIdx]) continue;
      visited[vIdx] = 1;

      if (
        data[idx] === targetR &&
        data[idx + 1] === targetG &&
        data[idx + 2] === targetB &&
        data[idx + 3] === targetA
      ) {
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;

        if (cx > 0) queue.push([cx - 1, cy]);
        if (cx < 63) queue.push([cx + 1, cy]);
        if (cy > 0) queue.push([cx, cy - 1]);
        if (cy < 63) queue.push([cx, cy + 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const handlePointerStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    applyPixel(x, y);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (tool === 'bucket' || tool === 'dropper') return;
    const { x, y } = getCanvasCoords(e);
    applyPixel(x, y);
  };

  const handlePointerEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      pushHistory();
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0e1626] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#121c2e]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-white text-sm sm:text-base">
              Pixel Editor: <span className="text-emerald-400">{skinName}</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              64×64
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Palette */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-[#0b111e] flex flex-wrap items-center justify-between gap-2">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-[#131d2e] p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setTool('pencil')}
              title="Pencil"
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition ${
                tool === 'pencil'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('eraser')}
              title="Eraser (Make transparent)"
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition ${
                tool === 'eraser'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('bucket')}
              title="Fill bucket"
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition ${
                tool === 'bucket'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <PaintBucket className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('dropper')}
              title="Eyedropper"
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition ${
                tool === 'dropper'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Pipette className="w-4 h-4" />
            </button>
          </div>

          {/* Palette Swatches + Color Picker */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-xs py-1">
              {paletteColors.map((col, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(col)}
                  style={{ backgroundColor: col }}
                  className={`w-6 h-6 rounded-md shrink-0 border transition ${
                    selectedColor.toLowerCase() === col.toLowerCase()
                      ? 'border-white scale-110 shadow-sm shadow-emerald-500/50'
                      : 'border-black/40 hover:scale-105'
                  }`}
                  title={col}
                />
              ))}
            </div>

            {/* Native Color Input */}
            <div className="relative">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-7 h-7 rounded-md cursor-pointer bg-transparent border-0 opacity-0 absolute inset-0"
                title="Custom color picker"
              />
              <div
                style={{ backgroundColor: selectedColor }}
                className="w-7 h-7 rounded-md border-2 border-white shadow flex items-center justify-center text-[9px] font-bold text-slate-900 pointer-events-none"
              >
                +
              </div>
            </div>
          </div>

          {/* Zoom & UV Overlay controls */}
          <div className="flex items-center gap-1 text-slate-400">
            <button
              onClick={() => setZoom((z) => Math.max(3, z - 1))}
              className="p-1 rounded hover:bg-slate-800 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1">{zoom}x</span>
            <button
              onClick={() => setZoom((z) => Math.min(10, z + 1))}
              className="p-1 rounded hover:bg-slate-800 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowUVGrid(!showUVGrid)}
              className={`p-1 rounded transition ml-1 ${
                showUVGrid ? 'text-emerald-400 bg-emerald-500/10' : 'hover:bg-slate-800'
              }`}
              title="Toggle Bedrock UV region guidelines"
            >
              <Layers className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-3 bg-slate-800 mx-1" />

            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1 rounded ${canUndo ? 'hover:bg-slate-800 text-slate-200' : 'opacity-40 cursor-not-allowed'}`}
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-1 rounded ${canRedo ? 'hover:bg-slate-800 text-slate-200' : 'opacity-40 cursor-not-allowed'}`}
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Working Area */}
        <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-[#070b14] relative">
          <div
            className="relative border-2 border-slate-700 shadow-2xl rounded-sm select-none"
            style={{
              width: 64 * zoom,
              height: 64 * zoom,
              backgroundImage:
                'repeating-conic-gradient(#151d2c 0% 25%, #1c2638 0% 50%)',
              backgroundSize: `${zoom * 2}px ${zoom * 2}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={64}
              height={64}
              onMouseDown={handlePointerStart}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerEnd}
              onTouchStart={handlePointerStart}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerEnd}
              style={{
                width: 64 * zoom,
                height: 64 * zoom,
                imageRendering: 'pixelated',
              }}
              className="cursor-crosshair block"
            />

            {/* Bedrock UV Zones Overlay Helper */}
            {showUVGrid && (
              <div
                className="absolute inset-0 pointer-events-none text-[8px] font-mono text-white/50"
                style={{ imageRendering: 'pixelated' }}
              >
                {/* Head */}
                <div
                  className="absolute border border-emerald-500/40 bg-emerald-500/5 flex items-center justify-center text-emerald-300"
                  style={{
                    left: 0 * zoom,
                    top: 0 * zoom,
                    width: 32 * zoom,
                    height: 16 * zoom,
                  }}
                >
                  Head Base
                </div>

                {/* Head Hat */}
                <div
                  className="absolute border border-cyan-500/40 bg-cyan-500/5 flex items-center justify-center text-cyan-300"
                  style={{
                    left: 32 * zoom,
                    top: 0 * zoom,
                    width: 32 * zoom,
                    height: 16 * zoom,
                  }}
                >
                  Hat / Helmet
                </div>

                {/* Torso */}
                <div
                  className="absolute border border-amber-500/40 bg-amber-500/5 flex items-center justify-center text-amber-300"
                  style={{
                    left: 16 * zoom,
                    top: 16 * zoom,
                    width: 24 * zoom,
                    height: 16 * zoom,
                  }}
                >
                  Torso
                </div>

                {/* Jacket */}
                <div
                  className="absolute border border-orange-500/40 bg-orange-500/5 flex items-center justify-center text-orange-300"
                  style={{
                    left: 16 * zoom,
                    top: 32 * zoom,
                    width: 24 * zoom,
                    height: 16 * zoom,
                  }}
                >
                  Jacket
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 text-[11px] text-slate-400 text-center">
            Click or drag to paint pixels • UV guidelines indicate Bedrock skin body regions
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-slate-800 bg-[#121c2e] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
