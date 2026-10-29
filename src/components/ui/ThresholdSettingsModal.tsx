import React, { useState } from 'react';
import { X, Sliders, Check, RotateCcw, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { LifetimeThresholds } from '../../types';
import { DEFAULT_THRESHOLDS } from '../../data/hinoComponentsData';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: LifetimeThresholds;
  onSaveThresholds: (thresholds: LifetimeThresholds) => void;
}

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSaveThresholds,
}) => {
  const [warningVal, setWarningVal] = useState(thresholds.warningPercent);
  const [overdueVal, setOverdueVal] = useState(thresholds.overduePercent);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveThresholds({
      warningPercent: Number(warningVal),
      overduePercent: Number(overdueVal),
    });
    onClose();
  };

  const handleReset = () => {
    setWarningVal(DEFAULT_THRESHOLDS.warningPercent);
    setOverdueVal(DEFAULT_THRESHOLDS.overduePercent);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#0e121a] border border-amber-500/50 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden glow-yellow-sm">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-400 text-black">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-tech text-base font-bold text-amber-400 tracking-wider">
                PENGATURAN THRESHOLD STATUS LIFETIME (HM)
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Atur ambang batas persentase pemakaian umur komponen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 bg-[#080a0f]">
          {/* Warning Slider */}
          <div className="bg-[#111622] p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="font-tech text-xs text-amber-300 font-bold uppercase">
                  Threshold WARNING
                </span>
              </div>
              <span className="font-code text-sm font-bold text-amber-400">
                {warningVal}% Pemakaian
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={warningVal}
              onChange={(e) => setWarningVal(Number(e.target.value))}
              className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Komponen akan berstatus <strong>WARNING</strong> jika pemakaian mencapai {warningVal}% atau sisa umur tinggal {100 - warningVal}%.
            </p>
          </div>

          {/* Overdue Slider */}
          <div className="bg-[#111622] p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span className="font-tech text-xs text-red-300 font-bold uppercase">
                  Threshold OVERDUE
                </span>
              </div>
              <span className="font-code text-sm font-bold text-red-400">
                {overdueVal}% Pemakaian
              </span>
            </div>
            <input
              type="range"
              min="90"
              max="120"
              step="1"
              value={overdueVal}
              onChange={(e) => setOverdueVal(Number(e.target.value))}
              className="w-full accent-red-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Komponen akan berstatus <strong>OVERDUE</strong> jika pemakaian mencapai atau melebihi {overdueVal}%.
            </p>
          </div>

          {/* Status Color Guide Preview */}
          <div className="bg-[#10141d] p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs font-sans">
            <span className="font-tech text-[11px] text-slate-400 uppercase tracking-wider block">
              PREVIEW RENTANG STATUS:
            </span>
            <div className="space-y-1.5 font-code text-[11px]">
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2 rounded text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  NORMAL:
                </span>
                <span>0% — {warningVal - 1}% (&gt; {100 - warningVal}% sisa umur)</span>
              </div>

              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-2 rounded text-amber-300">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  WARNING:
                </span>
                <span>{warningVal}% — {overdueVal - 1}% (Mendekati limit)</span>
              </div>

              <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 p-2 rounded text-red-300">
                <span className="flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                  OVERDUE:
                </span>
                <span>&ge; {overdueVal}% (Segera ganti / Overhaul)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-tech text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default (80% / 100%)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded text-xs font-tech text-slate-400 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-tech font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
