import React, { useState, useRef, useEffect } from 'react';
import {
  Wrench,
  Maximize2,
  Minimize2,
  Sliders,
  FileSpreadsheet,
  Image,
  Layers,
  Truck,
  ChevronDown,
  Check,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { ViewMode, DumpTruckUnit } from '../../types';

interface HeaderProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  onOpenThresholdModal: () => void;
  onOpenDataModal: () => void;
  onOpenPosterModal: () => void;
  onOpenUploadModal: () => void;
  onOpenFleetModal: () => void;
  onOpenTrendModal?: () => void;
  fleet: DumpTruckUnit[];
  activeUnitId: string;
  onSelectActiveUnit: (unitId: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onSetViewMode,
  onOpenThresholdModal,
  onOpenDataModal,
  onOpenPosterModal,
  onOpenUploadModal,
  onOpenFleetModal,
  onOpenTrendModal,
  fleet,
  activeUnitId,
  onSelectActiveUnit,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeUnit = fleet.find((u) => u.id === activeUnitId) || fleet[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative z-30 bg-[#0d1017]/95 border-b border-amber-500/30 px-3 lg:px-6 py-2.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3.5">
        {/* Mineroz Logo Icon */}
        <div className="w-9 h-9 rounded bg-amber-400 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/20">
          <Wrench className="w-5 h-5 stroke-[2.5]" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-tech text-xl font-bold tracking-wider text-amber-400">
              MINEROZ
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-tech tracking-widest text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
              Mining Maintenance Solution
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-tech text-sm font-semibold tracking-wide text-white">
              HINO 500 INTERACTIVE X-RAY
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans tracking-tight">
            EXPLORE COMPONENTS • LIFETIME (HM) • SMART MAINTENANCE
          </p>
        </div>
      </div>

      {/* Center Fleet Unit Selector Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
          className="flex items-center gap-2.5 bg-[#131822] hover:bg-[#18202d] border border-amber-500/40 hover:border-amber-400 rounded-lg px-3 py-1.5 transition-all shadow-sm"
          title="Pilih unit dump truck untuk ditampilkan di 3D"
        >
          <div className="p-1 rounded bg-amber-500/20 text-amber-400">
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                UNIT AKTIF:
              </span>
              <span className="text-xs font-mono font-extrabold text-amber-400">
                {activeUnit?.unitCode || 'DT-088'}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  activeUnit?.status === 'OPERATIONAL'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : activeUnit?.status === 'BREAKDOWN'
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : activeUnit?.status === 'MAINTENANCE'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                }`}
              >
                {activeUnit?.status || 'OPERATIONAL'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {activeUnit?.currentTotalHm.toLocaleString()} HM • {activeUnit?.siteLocation || 'Pit Mining'}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isUnitDropdownOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu for Quick Unit Selection */}
        {isUnitDropdownOpen && (
          <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-[#10141e] border border-amber-500/50 rounded-xl shadow-2xl z-50 p-2 divide-y divide-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1.5 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Pilih Dari {fleet.length} Unit Armada:</span>
              <button
                onClick={() => {
                  setIsUnitDropdownOpen(false);
                  onOpenFleetModal();
                }}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                Kelola Armada &raquo;
              </button>
            </div>

            <div className="pt-1.5 space-y-1">
              {fleet.map((unit) => {
                const isSelected = unit.id === activeUnitId;
                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      onSelectActiveUnit(unit.id);
                      setIsUnitDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                        : 'hover:bg-slate-800/60 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-amber-400">
                          {unit.unitCode}
                        </span>
                        <span className="text-[11px] text-slate-300 truncate max-w-[120px]">
                          {unit.siteLocation}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {unit.currentTotalHm.toLocaleString()} HM • {unit.model.split(' ')[2] || 'Hino 500'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          unit.status === 'OPERATIONAL'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : unit.status === 'BREAKDOWN'
                            ? 'bg-red-500/20 text-red-400'
                            : unit.status === 'MAINTENANCE'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {unit.status}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Fleet & Unit Manager Modal Button */}
        <button
          onClick={onOpenFleetModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
          title="Kelola 10 Unit Armada (Tambah, Edit, Hapus, Input Langsung & Excel)"
        >
          <Truck className="w-4 h-4 text-slate-950" />
          <span>Armada ({fleet.length} Unit)</span>
        </button>

        {/* Poster Reference Modal */}
        <button
          onClick={onOpenPosterModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-tech tracking-wider text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 transition-colors"
          title="Lihat Poster Referensi MINEROZ & Spesifikasi OEM"
        >
          <Image className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Poster Referensi</span>
        </button>

        {/* Trend HM & PM Schedule Modal (Recharts) */}
        <button
          onClick={onOpenTrendModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-tech tracking-wider text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 transition-colors"
          title="Visualisasi Trend Degradasi HM vs Jadwal PM (Recharts)"
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Trend HM</span>
        </button>

        {/* Upload Custom GLB Model */}
        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-tech tracking-wider text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
          title="Upload model 3D GLB/GLTF sendiri"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">Upload Model GLB</span>
        </button>

        {/* Import/Export Data */}
        <button
          onClick={onOpenDataModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-tech tracking-wider text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
          title="Import / Export Data Lifetime HM"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Excel & CSV</span>
        </button>

        {/* Threshold Settings */}
        <button
          onClick={onOpenThresholdModal}
          className="p-1.5 rounded text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
          title="Pengaturan Threshold Status Lifetime"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
          title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

