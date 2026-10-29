import React, { useState } from 'react';
import { X, Image as ImageIcon, ZoomIn, Download, ExternalLink, Info } from 'lucide-react';

interface ReferencePosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferencePosterModal: React.FC<ReferencePosterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'poster' | 'truck'>('poster');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#0e121a] border border-amber-500/50 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden glow-yellow-sm">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-400 text-black">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-tech text-base font-bold text-amber-400 tracking-wider">
                REFERENSI POSTER & SPESIFIKASI OEM MINEROZ
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Dokumentasi Asli HINO 500 X-Ray & Component Lifetime (HM) Standar Pertambangan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab buttons */}
            <div className="bg-slate-900 p-0.5 rounded border border-slate-800 flex text-xs font-tech">
              <button
                onClick={() => setActiveTab('poster')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'poster'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Poster X-Ray & Tabel HM
              </button>
              <button
                onClick={() => setActiveTab('truck')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'truck'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Unit Hino 500 Mining
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-[#07090d]">
          {activeTab === 'poster' ? (
            <div className="max-w-4xl w-full flex flex-col items-center gap-4">
              <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-black/60 shadow-2xl">
                <img
                  src="/assets/aistudio/MINEROZ_Hino_500_Maintenance_X-Ray_98a498f1.png"
                  alt="MINEROZ HINO 500 Maintenance X-Ray Poster"
                  className="max-h-[70vh] w-auto object-contain mx-auto"
                />
              </div>

              {/* Poster Meta Notes */}
              <div className="w-full bg-[#11151e] border border-slate-800 p-3 rounded-lg text-xs text-slate-300 font-sans flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>
                    <strong>18 Komponen Utama Terdaftar:</strong> 1. Cabin & Interior, 2. Engine & Turbocharger, 3. Fuel System, 4. Exhaust System, 5. Dump Body, 6. Cooling System, 7. Electrical System, 8. Transmission, 9. Drive Shaft, 10. Front Axle, 11. Rear Axle, 12. Suspension, 13. Brake System, 14. Tyres & Wheels, dsb.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Formula Status: <strong>Normal</strong> (&gt;20% sisa umur), <strong>Warning</strong> (10-20% sisa umur), <strong>Overdue</strong> (&lt;10% sisa umur).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl w-full flex flex-col items-center gap-4">
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-black/60 shadow-2xl">
                <img
                  src="/assets/aistudio/image_dee2c1d6.png"
                  alt="Hino 500 Mining Dump Truck 6x4"
                  className="max-h-[70vh] w-auto object-contain mx-auto"
                />
              </div>
              <p className="text-xs text-slate-400 font-code text-center">
                Spesifikasi Fisik Unit: Hino 500 Series 6x4 Mining Heavy Hauler, Tipper Rock Body with Cab Canopy Guard.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-tech text-slate-400">
          <span>MINEROZ MINING MAINTENANCE SOLUTION</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
