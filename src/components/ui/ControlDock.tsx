import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Sparkles,
  Maximize,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sliders,
  Compass,
  ArrowUpRight,
  Radio,
  Eye,
  Box,
} from 'lucide-react';
import { ViewMode, CameraPreset } from '../../types';

interface ControlDockProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  cameraPreset: CameraPreset;
  onSetCameraPreset: (preset: CameraPreset) => void;
  explodedProgress: number;
  onSetExplodedProgress: (val: number) => void;
  isTipping: boolean;
  onToggleTipping: () => void;
  onResetCamera: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  viewMode,
  onSetViewMode,
  cameraPreset,
  onSetCameraPreset,
  explodedProgress,
  onSetExplodedProgress,
  isTipping,
  onToggleTipping,
  onResetCamera,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center select-none max-w-[min(940px,96vw)] w-full transition-all duration-300">
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1 px-3 py-1 bg-[#0e121a]/95 hover:bg-[#151c28] border border-amber-500/40 text-amber-400 rounded-t-md text-[11px] font-tech tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all glow-yellow-sm"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>TAMPILKAN KONTROL 3D</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>SEMBUNYIKAN KONTROL (CINEMA MODE)</span>
          </>
        )}
      </button>

      {/* Main Glassmorphic Dock Container */}
      {!isCollapsed && (
        <div className="w-full bg-[#0d1017]/95 border border-amber-500/30 rounded-lg p-2.5 sm:p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2.5 glow-yellow-sm">
          {/* Top Row: View Modes & Camera Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            {/* View Modes */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-[10px] font-tech text-slate-500 uppercase mr-1 hidden sm:inline">
                MODE:
              </span>

              <button
                onClick={() => {
                  onSetViewMode('COMPLETE');
                  onSetExplodedProgress(0);
                }}
                className={`px-2.5 py-1 rounded text-xs font-tech tracking-wider border transition-all ${
                  viewMode === 'COMPLETE'
                    ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                COMPLETE UNIT
              </button>

              <button
                onClick={() => onSetViewMode('XRAY')}
                className={`px-2.5 py-1 rounded text-xs font-tech tracking-wider border transition-all ${
                  viewMode === 'XRAY'
                    ? 'bg-cyan-500 text-black font-bold border-cyan-300 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40'
                }`}
              >
                X-RAY 3D
              </button>

              <button
                onClick={() => {
                  onSetViewMode('EXPLODED');
                  if (explodedProgress === 0) onSetExplodedProgress(0.75);
                }}
                className={`px-2.5 py-1 rounded text-xs font-tech tracking-wider border transition-all ${
                  viewMode === 'EXPLODED'
                    ? 'bg-amber-400 text-black font-bold border-amber-300 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
                }`}
              >
                EXPLODED VIEW
              </button>

              <button
                onClick={() => onSetViewMode('INSPECTION')}
                className={`px-2.5 py-1 rounded text-xs font-tech tracking-wider border transition-all ${
                  viewMode === 'INSPECTION'
                    ? 'bg-purple-500 text-white font-bold border-purple-400 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-purple-300 hover:border-purple-500/40'
                }`}
              >
                INSPEKSI
              </button>
            </div>

            {/* Camera Presets */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-tech text-slate-500 uppercase mr-1 hidden sm:inline">
                SUDUT PANDANG:
              </span>

              {(['ISOMETRIC', 'FRONT', 'SIDE', 'TOP', 'REAR'] as const).map((cam) => {
                const labels: Record<CameraPreset, string> = {
                  ISOMETRIC: 'ISO',
                  FRONT: 'DEPAN',
                  SIDE: 'SAMPING',
                  TOP: 'ATAS',
                  REAR: 'BELAKANG',
                };
                return (
                  <button
                    key={cam}
                    onClick={() => onSetCameraPreset(cam)}
                    className={`px-2 py-0.5 rounded text-[11px] font-tech border transition-all ${
                      cameraPreset === cam
                        ? 'bg-slate-700 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {labels[cam]}
                  </button>
                );
              })}

              <button
                onClick={onResetCamera}
                className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 border border-slate-800 transition-colors ml-1"
                title="Reset Posisi Kamera"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Exploded View Slider & Tipping Cylinder Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Exploded View Slider */}
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <span className="text-[11px] font-tech text-amber-400 shrink-0 font-semibold">
                EXPLODED SEPARATION:
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodedProgress}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onSetExplodedProgress(val);
                  if (val > 0 && viewMode !== 'EXPLODED') {
                    onSetViewMode('EXPLODED');
                  } else if (val === 0 && viewMode === 'EXPLODED') {
                    onSetViewMode('COMPLETE');
                  }
                }}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="font-code text-slate-300 text-[11px] w-10 text-right">
                {Math.round(explodedProgress * 100)}%
              </span>

              {/* Quick Assemble (0%) & Full Explode (100%) */}
              <button
                onClick={() => {
                  onSetExplodedProgress(0);
                  onSetViewMode('COMPLETE');
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-tech"
                title="Kembalikan ke posisi assembly utuh"
              >
                Assemble (0%)
              </button>

              <button
                onClick={() => {
                  onSetExplodedProgress(1);
                  onSetViewMode('EXPLODED');
                }}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-tech"
                title="Buka pemisahan maksimal"
              >
                Full (100%)
              </button>
            </div>

            {/* Dump Vessel Tipping Mechanism */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onToggleTipping}
                className={`px-3 py-1 rounded text-xs font-tech tracking-wider border flex items-center gap-1.5 transition-all ${
                  isTipping
                    ? 'bg-amber-500 text-black font-bold border-amber-400 glow-yellow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Gerakkan silinder hidrolik tipping dump body"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{isTipping ? 'TURUNKAN BAK DUMP' : 'ANGKAT BAK (TIPPING)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
