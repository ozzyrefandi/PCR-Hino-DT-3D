import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileCode,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  HelpCircle,
  Code,
} from 'lucide-react';

interface ModelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  onResetToProcedural: () => void;
  isCustomModelActive: boolean;
  detectedMeshNames: string[];
}

export const ModelUploadModal: React.FC<ModelUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  onResetToProcedural,
  isCustomModelActive,
  detectedMeshNames,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        onFileUpload(file);
        onClose();
      } else {
        alert('Harap unggah file 3D berformat .glb atau .gltf!');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#0e121a] border border-cyan-500/50 rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-500 text-black">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-tech text-base font-bold text-cyan-400 tracking-wider">
                IMPORT MODEL 3D HINO 500 (GLB / GLTF)
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Ganti model procedural bawaan dengan file 3D CAD/GLB OEM Hino 500 Anda
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#080a0f]">
          {/* Active Model Status */}
          <div className="bg-[#111622] p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isCustomModelActive ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
              />
              <div>
                <span className="text-xs font-tech text-slate-400 uppercase block">Model Aktif:</span>
                <span className="text-sm font-code font-bold text-white">
                  {isCustomModelActive
                    ? 'Custom User Model (.GLB) Terpasang'
                    : 'Model Procedural Hino 500 Mining (Bawaan)'}
                </span>
              </div>
            </div>

            {isCustomModelActive && (
              <button
                onClick={() => {
                  onResetToProcedural();
                  onClose();
                }}
                className="px-3 py-1.5 rounded text-xs font-tech bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset ke Model Bawaan</span>
              </button>
            )}
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-slate-700 hover:border-cyan-500/60 bg-slate-900/40 hover:bg-slate-900/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="font-tech text-base text-slate-200 tracking-wide">
              Tarik & Letakkan file <span className="text-cyan-400 font-bold">.GLB</span> atau{' '}
              <span className="text-cyan-400 font-bold">.GLTF</span> ke sini
            </p>
            <p className="text-xs text-slate-400 mt-1">
              atau klik untuk memilih file dari komputer Anda
            </p>
            <span className="mt-3 text-[10px] font-code text-slate-500 bg-slate-800 px-2.5 py-1 rounded">
              Ukuran rekomendasi: &lt; 50 MB untuk performa browser lancar
            </span>
          </div>

          {/* Detected Meshes List if Loaded */}
          {detectedMeshNames.length > 0 && (
            <div className="bg-[#10141d] p-3.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-tech text-slate-300">
                <span className="text-cyan-400 font-bold">
                  TERDETEKSI {detectedMeshNames.length} NODE/MESH PADA MODEL GLB:
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {detectedMeshNames.map((name, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] font-code bg-slate-950/60 text-slate-300 px-2 py-0.5 rounded border border-slate-800 truncate"
                  >
                    • {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guidelines on Mesh Naming for Exploded View & Selection */}
          <div className="bg-[#10151f] border border-slate-800 p-3.5 rounded-lg text-xs text-slate-300 font-sans space-y-2">
            <div className="flex items-center gap-1.5 font-tech font-bold text-amber-400">
              <Code className="w-4 h-4" />
              <span>PANDUAN PENAMAAN MESH OEM HINO:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Agar fitur <em>Raycaster Selection</em> dan <em>Exploded View</em> bekerja otomatis pada model Anda, pastikan nama node/mesh pada software 3D (Blender, Maya, CAD) mengandung kata kunci:
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-code text-slate-300">
              <div className="bg-slate-900 p-1.5 rounded">engine / engine_block</div>
              <div className="bg-slate-900 p-1.5 rounded">transmission / gearbox</div>
              <div className="bg-slate-900 p-1.5 rounded">turbo / turbocharger</div>
              <div className="bg-slate-900 p-1.5 rounded">chassis / frame</div>
              <div className="bg-slate-900 p-1.5 rounded">cabin / interior</div>
              <div className="bg-slate-900 p-1.5 rounded">dump_body / vessel</div>
              <div className="bg-slate-900 p-1.5 rounded">axle / diff / gardan</div>
              <div className="bg-slate-900 p-1.5 rounded">wheel / tire / ban</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-tech text-slate-400">
          <span>Format: Khusus .GLB / .GLTF (PBR Standard)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
