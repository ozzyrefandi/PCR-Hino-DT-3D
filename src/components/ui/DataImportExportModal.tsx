import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Database,
  Info,
  Truck,
} from 'lucide-react';
import { HinoComponent } from '../../types';
import { INITIAL_HINO_COMPONENTS } from '../../data/hinoComponentsData';
import { downloadFleetExcelTemplate } from '../../utils/excelFleetUtils';
import * as XLSX from 'xlsx';

interface DataImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: HinoComponent[];
  onUpdateComponents: (newComponents: HinoComponent[]) => void;
  onOpenFleetModal?: () => void;
}

export const DataImportExportModal: React.FC<DataImportExportModalProps> = ({
  isOpen,
  onClose,
  components,
  onUpdateComponents,
  onOpenFleetModal,
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'ID',
        'Number',
        'Component Name',
        'Indonesian Name',
        'System Category',
        'Unit ID',
        'Serial Number',
        'Actual HM',
        'Target Lifetime HM',
        'Criticality',
        'Condition',
        'Last Replacement Date',
        'Next Inspection Date',
        'Recommended Action',
      ];

      const rows = components.map((c) => [
        `"${c.id}"`,
        c.number,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.nameId.replace(/"/g, '""')}"`,
        `"${c.systemCategory}"`,
        `"${c.unitId}"`,
        `"${c.serialNumber}"`,
        c.actualHm,
        c.targetLifetimeHm,
        `"${c.criticality}"`,
        `"${c.condition}"`,
        `"${c.lastReplacementDate}"`,
        `"${c.nextInspectionDate}"`,
        `"${c.recommendedAction.replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `mineroz_hino500_components_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMsg('Berhasil mengekspor data ke file CSV!');
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg('Gagal mengekspor CSV: ' + (err as Error).message);
    }
  };

  // Import from Excel (.xlsx, .xls), CSV or JSON
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const updated = [...components];
        let updatedCount = 0;

        jsonRows.forEach((row) => {
          const compIdKey = Object.keys(row).find((k) =>
            k.toLowerCase().includes('component id') || k.toLowerCase().includes('id')
          );
          const nameKey = Object.keys(row).find((k) =>
            k.toLowerCase().includes('name') || k.toLowerCase().includes('nama')
          );
          const actualKey = Object.keys(row).find((k) =>
            k.toLowerCase().includes('actual') || k.toLowerCase().includes('hm')
          );
          const targetKey = Object.keys(row).find((k) =>
            k.toLowerCase().includes('target')
          );

          const id = compIdKey ? String(row[compIdKey]).trim() : '';
          const name = nameKey ? String(row[nameKey]).trim().toLowerCase() : '';
          const actualHm = actualKey ? Number(row[actualKey]) : NaN;
          const targetHm = targetKey ? Number(row[targetKey]) : NaN;

          const existingIdx = updated.findIndex(
            (c) => (id && c.id === id) || (name && c.name.toLowerCase().includes(name))
          );

          if (existingIdx !== -1 && !isNaN(actualHm)) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              actualHm,
              targetLifetimeHm: !isNaN(targetHm) ? targetHm : updated[existingIdx].targetLifetimeHm,
            };
            updatedCount++;
          }
        });

        onUpdateComponents(updated);
        setSuccessMsg(`Berhasil memperbarui ${updatedCount} komponen dari file Excel (.xlsx)!`);
        setErrorMsg(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed) && parsed.length > 0) {
              onUpdateComponents(parsed);
              setSuccessMsg(`Berhasil mengimpor ${parsed.length} komponen dari file JSON!`);
              setErrorMsg(null);
              return;
            }
          } else if (file.name.endsWith('.csv')) {
            const lines = text.split('\n').filter((l) => l.trim().length > 0);
            if (lines.length <= 1) {
              throw new Error('File CSV kosong atau hanya memiliki header.');
            }

            const updated = [...components];
            let updatedCount = 0;

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
              if (parts.length >= 8) {
                const id = parts[0];
                const actualHm = Number(parts[7]);
                const targetHm = Number(parts[8]);

                const existingIdx = updated.findIndex(
                  (c) => c.id === id || c.name.toLowerCase() === parts[2]?.toLowerCase()
                );

                if (existingIdx !== -1 && !isNaN(actualHm)) {
                  updated[existingIdx] = {
                    ...updated[existingIdx],
                    actualHm: actualHm,
                    targetLifetimeHm: isNaN(targetHm) ? updated[existingIdx].targetLifetimeHm : targetHm,
                  };
                  updatedCount++;
                }
              }
            }

            onUpdateComponents(updated);
            setSuccessMsg(`Berhasil memperbarui ${updatedCount} komponen dari file CSV!`);
            setErrorMsg(null);
          } else {
            throw new Error('Format file tidak didukung. Harap gunakan .xlsx, .csv atau .json.');
          }
        } catch (err) {
          setErrorMsg('Gagal mengimpor file: ' + (err as Error).message);
          setSuccessMsg(null);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setErrorMsg('Gagal mengimpor file: ' + (err as Error).message);
    }
  };

  const handleResetDemoData = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh data kembali ke Data Contoh DEMO Mineroz?')) {
      onUpdateComponents(INITIAL_HINO_COMPONENTS);
      setSuccessMsg('Data komponen telah direset ke Standar Referensi DEMO.');
      setErrorMsg(null);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#0e121a] border border-emerald-500/50 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-500 text-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-tech text-base font-bold text-emerald-400 tracking-wider">
                MANAJEMEN DATA LIFETIME HM (CSV / JSON)
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Ekspor atau impor data jam operasi (Hour Meter) komponen armada HINO 500
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
        <div className="p-5 space-y-4 bg-[#080a0f]">
          {/* Notification Alerts */}
          {successMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 p-3 rounded text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-950/80 border border-red-500/80 text-red-300 p-3 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Excel Template & Fleet Link Card */}
          <div className="bg-gradient-to-r from-[#141b27] to-[#101520] p-4 rounded-lg border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-tech text-sm font-bold text-amber-400 block">
                  TEMPLATE RESMI EXCEL ARMADA (10 UNIT)
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  .XLSX
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Format lengkap untuk mengelola 10 unit dump truck dan seluruh komponen HM di Microsoft Excel.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadFleetExcelTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-tech font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shrink-0 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Template (.xlsx)</span>
              </button>

              {onOpenFleetModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenFleetModal();
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kelola 10 Unit</span>
                </button>
              )}
            </div>
          </div>

          {/* Export Action Card */}
          <div className="bg-[#111622] p-4 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-tech text-sm font-bold text-white block">
                EKSPOR DATA KE FILE CSV
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Unduh tabel 19 komponen unit aktif beserta actual HM, target lifetime, dan rekomendasi servis.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-tech font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors shrink-0 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          </div>

          {/* Import Action Card */}
          <div className="bg-[#111622] p-4 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-tech text-sm font-bold text-white block">
                IMPOR DATA (EXCEL .XLSX / CSV)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbarui angka Actual HM armada Anda dari file Excel (.xlsx) atau CSV.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-tech font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Pilih File Excel/CSV</span>
            </button>
          </div>

          {/* Reset Action Card */}
          <div className="bg-[#111622] p-4 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-tech text-sm font-bold text-slate-300 block">
                RESET KE DATA CONTOH (DEMO)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Kembalikan semua nilai HM ke konfigurasi awal poster referensi Mineroz.
              </p>
            </div>
            <button
              onClick={handleResetDemoData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-tech text-amber-300 hover:bg-amber-500/20 bg-amber-500/10 border border-amber-500/40 transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Data</span>
            </button>
          </div>

          {/* Privacy & Storage Notice */}
          <div className="bg-[#0e131d] p-3 rounded border border-slate-800 text-[11px] text-slate-400 font-sans flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Penyimpanan Browser Lokal (Offline-Safe):</strong> Seluruh pembaruan data HM disimpan di browser lokal (Local Storage) perangkat Anda. Tidak ada data yang diunggah ke server cloud eksternal.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-tech text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
