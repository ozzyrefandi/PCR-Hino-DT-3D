import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Truck,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Calendar,
  Save,
  Check,
  RotateCcw,
  Layers,
  ArrowRight,
  Eye,
  Info,
} from 'lucide-react';
import { DumpTruckUnit, HinoComponent, UnitOperationalStatus, ComponentCondition } from '../../types';
import {
  downloadFleetExcelTemplate,
  exportFleetToExcel,
  exportSingleUnitToCSV,
  parseExcelOrCsvFleetFile,
  ParsedFleetData,
} from '../../utils/excelFleetUtils';
import { calculateComponentStatus } from '../../data/hinoComponentsData';
import { createDefaultComponentsForUnit } from '../../data/fleetUnitsData';

interface FleetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fleet: DumpTruckUnit[];
  activeUnitId: string;
  onSelectActiveUnit: (unitId: string) => void;
  onUpdateFleet: (newFleet: DumpTruckUnit[]) => void;
  onAddUnit: (newUnit: DumpTruckUnit) => void;
  onEditUnit: (updatedUnit: DumpTruckUnit) => void;
  onDeleteUnit: (unitId: string) => void;
}

export const FleetManagerModal: React.FC<FleetManagerModalProps> = ({
  isOpen,
  onClose,
  fleet,
  activeUnitId,
  onSelectActiveUnit,
  onUpdateFleet,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
}) => {
  // Tabs: 'FLEET_LIST' | 'BATCH_COMPONENT_EDIT' | 'EXCEL_IMPORT_EXPORT'
  const [activeTab, setActiveTab] = useState<'FLEET_LIST' | 'BATCH_COMPONENT_EDIT' | 'EXCEL_IMPORT_EXPORT'>('FLEET_LIST');

  // Search & Filter in fleet list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UnitOperationalStatus>('ALL');

  // Selected unit for batch component editing
  const [editingUnitId, setEditingUnitId] = useState<string>(activeUnitId);

  // Add Unit Form State
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitModel, setNewUnitModel] = useState('Hino 500 FM 260 JD (6x4 Mining Dump)');
  const [newUnitVin, setNewUnitVin] = useState('');
  const [newUnitPit, setNewUnitPit] = useState('Pit Mahakam - West');
  const [newUnitStatus, setNewUnitStatus] = useState<UnitOperationalStatus>('OPERATIONAL');
  const [newUnitHm, setNewUnitHm] = useState(12000);
  const [newUnitDriver, setNewUnitDriver] = useState('');
  const [newUnitYear, setNewUnitYear] = useState(2023);
  const [newUnitNotes, setNewUnitNotes] = useState('');

  // Edit Unit Form State
  const [editingUnitData, setEditingUnitData] = useState<DumpTruckUnit | null>(null);

  // Batch Component Form State
  const [tempComponents, setTempComponents] = useState<HinoComponent[]>([]);
  const [hasBatchChanges, setHasBatchChanges] = useState(false);

  // Excel Import State
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ParsedFleetData | null>(null);
  const [importMode, setImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync tempComponents when editingUnitId changes or modal opens
  React.useEffect(() => {
    const targetUnit = fleet.find((u) => u.id === editingUnitId) || fleet[0];
    if (targetUnit) {
      setTempComponents(JSON.parse(JSON.stringify(targetUnit.components)));
      setHasBatchChanges(false);
    }
  }, [editingUnitId, fleet]);

  // Filtered fleet units
  const filteredFleet = useMemo(() => {
    return fleet.filter((unit) => {
      const matchSearch =
        unit.unitCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.siteLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (unit.driverOrTechnician && unit.driverOrTechnician.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || unit.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [fleet, searchQuery, statusFilter]);

  if (!isOpen) return null;

  // Handle Add Unit Submit
  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newUnitCode.trim().toUpperCase();
    if (!cleanCode) {
      setFeedbackMsg({ type: 'error', text: 'Unit ID / Kode Unit wajib diisi!' });
      return;
    }

    if (fleet.some((u) => u.unitCode.toUpperCase() === cleanCode || u.id === cleanCode)) {
      setFeedbackMsg({ type: 'error', text: `Unit dengan ID "${cleanCode}" sudah ada!` });
      return;
    }

    const newUnit: DumpTruckUnit = {
      id: cleanCode,
      unitCode: cleanCode,
      model: newUnitModel,
      vinSerial: newUnitVin || `VIN-${cleanCode}-${Date.now().toString().slice(-4)}`,
      siteLocation: newUnitPit,
      status: newUnitStatus,
      currentTotalHm: Number(newUnitHm) || 12000,
      driverOrTechnician: newUnitDriver,
      year: Number(newUnitYear) || 2023,
      notes: newUnitNotes,
      components: createDefaultComponentsForUnit(cleanCode, Number(newUnitHm) || 12000),
    };

    onAddUnit(newUnit);
    setIsAddUnitOpen(false);
    setNewUnitCode('');
    setNewUnitNotes('');
    setFeedbackMsg({ type: 'success', text: `Unit ${cleanCode} berhasil ditambahkan dengan 19 komponen Hino 500!` });
  };

  // Handle Edit Unit Submit
  const handleEditUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnitData) return;

    onEditUnit(editingUnitData);
    setEditingUnitData(null);
    setFeedbackMsg({ type: 'success', text: `Data Unit ${editingUnitData.unitCode} berhasil diperbarui!` });
  };

  // Handle Delete Unit
  const handleDeleteClick = (unitId: string, unitCode: string) => {
    if (fleet.length <= 1) {
      setFeedbackMsg({ type: 'error', text: 'Minimal harus ada 1 unit dalam armada. Tidak dapat menghapus semua.' });
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus Unit ${unitCode} beserta seluruh data riwayat komponennya?`)) {
      onDeleteUnit(unitId);
      setFeedbackMsg({ type: 'success', text: `Unit ${unitCode} berhasil dihapus dari armada.` });
    }
  };

  // Handle batch component edit input change
  const handleComponentChange = (
    compId: string,
    field: keyof HinoComponent,
    value: string | number
  ) => {
    setTempComponents((prev) =>
      prev.map((c) => {
        if (c.id === compId) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
    setHasBatchChanges(true);
  };

  // Save batch component changes
  const handleSaveBatchComponents = () => {
    const updatedFleet = fleet.map((u) => {
      if (u.id === editingUnitId) {
        return {
          ...u,
          components: tempComponents,
        };
      }
      return u;
    });

    onUpdateFleet(updatedFleet);
    setHasBatchChanges(false);
    setFeedbackMsg({
      type: 'success',
      text: `Berhasil memperbarui data komponen untuk Unit ${editingUnitId}!`,
    });
  };

  // Handle File Upload for Excel / CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setFeedbackMsg(null);
    try {
      const parsed = await parseExcelOrCsvFleetFile(file);
      setImportResult(parsed);
      if (parsed.units.length === 0) {
        setFeedbackMsg({
          type: 'error',
          text: 'Tidak ada baris unit yang valid ditemukan dalam file.',
        });
      } else {
        setFeedbackMsg({
          type: 'success',
          text: `File terbaca! Ditemukan ${parsed.totalUnitsDetected} unit dan ${parsed.totalComponentRows} data komponen.`,
        });
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: 'Gagal memproses file Excel: ' + (err as Error).message,
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Apply Imported Data
  const handleApplyImportedData = () => {
    if (!importResult || importResult.units.length === 0) return;

    if (importMode === 'REPLACE') {
      onUpdateFleet(importResult.units);
      onSelectActiveUnit(importResult.units[0].id);
      setFeedbackMsg({
        type: 'success',
        text: `Sukses mengganti seluruh armada dengan ${importResult.units.length} unit baru dari file Excel!`,
      });
    } else {
      // MERGE Mode
      const existingMap = new Map(fleet.map((u) => [u.id.toUpperCase(), u]));

      importResult.units.forEach((importedUnit) => {
        const key = importedUnit.id.toUpperCase();
        if (existingMap.has(key)) {
          // Merge metadata and components
          const existing = existingMap.get(key)!;
          existingMap.set(key, {
            ...existing,
            ...importedUnit,
            components: importedUnit.components.length > 0 ? importedUnit.components : existing.components,
          });
        } else {
          // Add new unit
          existingMap.set(key, importedUnit);
        }
      });

      const mergedFleet = Array.from(existingMap.values());
      onUpdateFleet(mergedFleet);
      setFeedbackMsg({
        type: 'success',
        text: `Sukses memperbarui dan menggabungkan data dari file Excel (${mergedFleet.length} total unit)!`,
      });
    }

    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Get status color helper
  const getStatusBadge = (status: UnitOperationalStatus) => {
    switch (status) {
      case 'OPERATIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            OPERATIONAL
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            MAINTENANCE
          </span>
        );
      case 'BREAKDOWN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3 h-3" />
            BREAKDOWN
          </span>
        );
      case 'STANDBY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            STANDBY
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0f131a] border border-amber-500/40 rounded-xl shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-100">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-[#141923] via-[#0f131a] to-[#141923]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wider text-slate-100 uppercase">
                  MANAJEMEN ARMADA & 10 UNIT DUMPTRUCK
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  {fleet.length} Unit Terdaftar
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kelola data unit armada tambang: Tambah, Edit, Hapus, Input Langsung, atau Import/Export file Excel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK TOAST BANNER */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex items-center justify-between px-6 border-b border-slate-800/80 bg-[#121620]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('FLEET_LIST')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'FLEET_LIST'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              1. Daftar Armada ({fleet.length} Unit)
            </button>

            <button
              onClick={() => setActiveTab('BATCH_COMPONENT_EDIT')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'BATCH_COMPONENT_EDIT'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              2. Input & Edit Komponen Langsung
            </button>

            <button
              onClick={() => setActiveTab('EXCEL_IMPORT_EXPORT')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'EXCEL_IMPORT_EXPORT'
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              3. Import & Export Excel (.xlsx / .csv)
            </button>
          </div>

          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setIsAddUnitOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              + Tambah Unit Baru
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0c0f15]">
          {/* ============================================================== */}
          {/* TAB 1: FLEET LIST VIEW */}
          {/* ============================================================== */}
          {activeTab === 'FLEET_LIST' && (
            <div className="space-y-5">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#131822] p-3 rounded-xl border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Unit ID, Lokasi Pit, Driver..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0a0d13] border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Status:</span>
                  {(['ALL', 'OPERATIONAL', 'MAINTENANCE', 'BREAKDOWN', 'STANDBY'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        statusFilter === st
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-[#1a202c] text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Units Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFleet.map((unit) => {
                  const isActive = unit.id === activeUnitId;

                  // Component metrics for this unit
                  let normalCount = 0;
                  let warningCount = 0;
                  let overdueCount = 0;

                  unit.components.forEach((c) => {
                    const status = calculateComponentStatus(c.actualHm, c.targetLifetimeHm);
                    if (status === 'NORMAL') normalCount++;
                    else if (status === 'WARNING') warningCount++;
                    else if (status === 'OVERDUE') overdueCount++;
                  });

                  return (
                    <div
                      key={unit.id}
                      className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-gradient-to-b from-[#18202e] to-[#121722] border-amber-400/80 shadow-lg shadow-amber-500/10'
                          : 'bg-[#121620] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase">
                          <Check className="w-3 h-3" />
                          Aktif di 3D
                        </div>
                      )}

                      <div>
                        {/* Top Card Info */}
                        <div className="flex items-start justify-between gap-2 mb-2 pr-16">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-extrabold text-amber-400 font-mono tracking-wide">
                                {unit.unitCode}
                              </h3>
                              <span className="text-[11px] text-slate-400 font-medium">
                                Thn {unit.year || 2022}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium line-clamp-1">
                              {unit.model}
                            </p>
                          </div>
                        </div>

                        {/* Status & Location */}
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusBadge(unit.status)}
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {unit.siteLocation}
                          </span>
                        </div>

                        {/* Metrics Bar */}
                        <div className="bg-[#0b0e15] p-2.5 rounded-lg border border-slate-800/80 mb-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Total Unit HM:</span>
                            <span className="font-mono font-bold text-amber-300">
                              {unit.currentTotalHm.toLocaleString()} HM
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Driver / Teknisi:</span>
                            <span className="text-slate-300 truncate max-w-[140px]">
                              {unit.driverOrTechnician || '-'}
                            </span>
                          </div>

                          {/* Component health mini bar */}
                          <div className="pt-1.5 border-t border-slate-800/60">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span>Kondisi Komponen ({unit.components.length}):</span>
                              <div className="flex gap-2">
                                <span className="text-emerald-400">{normalCount} N</span>
                                <span className="text-amber-400">{warningCount} W</span>
                                <span className="text-red-400">{overdueCount} O</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${(normalCount / unit.components.length) * 100}%` }}
                                className="bg-emerald-500 h-full"
                              />
                              <div
                                style={{ width: `${(warningCount / unit.components.length) * 100}%` }}
                                className="bg-amber-500 h-full"
                              />
                              <div
                                style={{ width: `${(overdueCount / unit.components.length) * 100}%` }}
                                className="bg-red-500 h-full"
                              />
                            </div>
                          </div>
                        </div>

                        {unit.notes && (
                          <p className="text-[11px] text-slate-400 italic line-clamp-1 mb-3">
                            "{unit.notes}"
                          </p>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            onSelectActiveUnit(unit.id);
                            onClose();
                          }}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-[#18202d] text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/60'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Buka 3D X-Ray
                        </button>

                        <button
                          onClick={() => {
                            setEditingUnitId(unit.id);
                            setActiveTab('BATCH_COMPONENT_EDIT');
                          }}
                          className="p-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg transition-colors border border-slate-700/40"
                          title="Edit Komponen Langsung"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setEditingUnitData(unit)}
                          className="p-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/40"
                          title="Edit Info Unit"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteClick(unit.id, unit.unitCode)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg transition-colors border border-red-500/20"
                          title="Hapus Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: BATCH COMPONENT SPREADSHEET EDITOR */}
          {/* ============================================================== */}
          {activeTab === 'BATCH_COMPONENT_EDIT' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#131822] p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                    Pilih Unit yang Diedit:
                  </label>
                  <select
                    value={editingUnitId}
                    onChange={(e) => setEditingUnitId(e.target.value)}
                    className="bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-bold font-mono focus:outline-none focus:border-amber-500"
                  >
                    {fleet.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitCode} - {u.siteLocation} ({u.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {hasBatchChanges && (
                    <span className="text-xs text-amber-400 font-medium animate-pulse">
                      Ada perubahan yang belum disimpan
                    </span>
                  )}
                  <button
                    onClick={handleSaveBatchComponents}
                    disabled={!hasBatchChanges}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Perubahan Komponen
                  </button>
                </div>
              </div>

              {/* Editable Component Spreadsheet Table */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-[#0f131a]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141a24] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-10">No</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Nama Komponen</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Serial Number</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Actual HM</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Target HM</th>
                      <th className="py-2.5 px-3 min-w-[100px]">Life Used</th>
                      <th className="py-2.5 px-3 min-w-[90px]">Status</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Kondisi</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Tgl Terakhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tempComponents.map((comp, idx) => {
                      const lifeUsed = Math.min(
                        100,
                        Math.round((comp.actualHm / (comp.targetLifetimeHm || 1)) * 100)
                      );
                      const status = calculateComponentStatus(comp.actualHm, comp.targetLifetimeHm);

                      return (
                        <tr key={comp.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-200">{comp.name}</div>
                            <div className="text-[10px] text-slate-400">{comp.systemCategory}</div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={comp.serialNumber}
                              onChange={(e) =>
                                handleComponentChange(comp.id, 'serialNumber', e.target.value)
                              }
                              className="w-full bg-[#0a0d13] border border-slate-700/80 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={comp.actualHm}
                              onChange={(e) =>
                                handleComponentChange(comp.id, 'actualHm', Number(e.target.value))
                              }
                              className="w-24 bg-[#0a0d13] border border-slate-700/80 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={comp.targetLifetimeHm}
                              onChange={(e) =>
                                handleComponentChange(comp.id, 'targetLifetimeHm', Number(e.target.value))
                              }
                              className="w-24 bg-[#0a0d13] border border-slate-700/80 rounded px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-mono text-xs font-bold text-slate-200">
                              {lifeUsed}%
                            </div>
                            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                              <div
                                style={{ width: `${lifeUsed}%` }}
                                className={`h-full ${
                                  status === 'OVERDUE'
                                    ? 'bg-red-500'
                                    : status === 'WARNING'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                status === 'OVERDUE'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : status === 'WARNING'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={comp.condition}
                              onChange={(e) =>
                                handleComponentChange(
                                  comp.id,
                                  'condition',
                                  e.target.value as ComponentCondition
                                )
                              }
                              className="bg-[#0a0d13] border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            >
                              <option value="Optimal">Optimal</option>
                              <option value="Fair">Fair</option>
                              <option value="Attention">Attention</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={comp.lastReplacementDate || ''}
                              onChange={(e) =>
                                handleComponentChange(comp.id, 'lastReplacementDate', e.target.value)
                              }
                              className="bg-[#0a0d13] border border-slate-700/80 rounded px-1.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: EXCEL IMPORT & EXPORT */}
          {/* ============================================================== */}
          {activeTab === 'EXCEL_IMPORT_EXPORT' && (
            <div className="space-y-6">
              {/* Step 1: Download Template */}
              <div className="bg-[#121620] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                      Langkah 1: Download Template Excel Resmi
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gunakan format template standar untuk menginput atau mengedit 10 unit armada sekaligus di Excel.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={downloadFleetExcelTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Download Template Excel (.xlsx)
                  </button>

                  <button
                    onClick={() => {
                      const activeUnit = fleet.find((u) => u.id === editingUnitId) || fleet[0];
                      if (activeUnit) exportSingleUnitToCSV(activeUnit);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-lg transition-colors border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV Unit {editingUnitId}
                  </button>
                </div>
              </div>

              {/* Step 2: Upload Excel File */}
              <div className="bg-[#121620] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                      Langkah 2: Upload File Excel (.xlsx / .xls / .csv)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pilih file Excel yang telah Anda edit. Sistem akan membaca seluruh data unit dan komponen secara otomatis.
                    </p>
                  </div>
                </div>

                {/* Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-amber-400/80 bg-[#0c0f15] hover:bg-[#10141e] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <FileSpreadsheet className="w-10 h-10 text-slate-500 group-hover:text-amber-400 transition-colors mb-2" />
                  <p className="text-sm font-semibold text-slate-200">
                    Klik untuk memilih file Excel atau seret file ke sini
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                  </p>
                </div>

                {/* Import Preview if parsed */}
                {importResult && importResult.units.length > 0 && (
                  <div className="p-4 bg-[#141a24] rounded-xl border border-amber-500/40 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">
                          Data Terbaca: {importResult.totalUnitsDetected} Unit &{' '}
                          {importResult.totalComponentRows} Baris Komponen
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Mode Impor:</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'MERGE'}
                            onChange={() => setImportMode('MERGE')}
                            className="text-amber-500"
                          />
                          <span className="text-slate-300">Update & Gabungkan</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer ml-2">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'REPLACE'}
                            onChange={() => setImportMode('REPLACE')}
                            className="text-amber-500"
                          />
                          <span className="text-slate-300">Ganti Semua</span>
                        </label>
                      </div>
                    </div>

                    {/* Preview Table of units to import */}
                    <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg bg-[#0b0e14]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#10141e] text-slate-400 text-[11px] border-b border-slate-800">
                          <tr>
                            <th className="py-1.5 px-3">Unit ID</th>
                            <th className="py-1.5 px-3">Model</th>
                            <th className="py-1.5 px-3">Lokasi Pit</th>
                            <th className="py-1.5 px-3">Total HM</th>
                            <th className="py-1.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {importResult.units.map((u) => (
                            <tr key={u.id}>
                              <td className="py-1.5 px-3 font-mono font-bold text-amber-300">
                                {u.unitCode}
                              </td>
                              <td className="py-1.5 px-3 text-slate-300">{u.model}</td>
                              <td className="py-1.5 px-3 text-slate-400">{u.siteLocation}</td>
                              <td className="py-1.5 px-3 font-mono text-slate-200">
                                {u.currentTotalHm.toLocaleString()} HM
                              </td>
                              <td className="py-1.5 px-3">{getStatusBadge(u.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setImportResult(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleApplyImportedData}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Terapkan Data Excel ke Aplikasi
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Export Existing Fleet to Excel */}
              <div className="bg-[#121620] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                      Langkah 3: Ekspor Seluruh Data Armada Saat Ini
                    </h3>
                    <p className="text-xs text-slate-400">
                      Download file Excel berisi seluruh 10 unit dumptruck beserta kalkulasi status HM setiap komponen.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => exportFleetToExcel(fleet)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Ekspor Seluruh {fleet.length} Unit ke Excel (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#0f131a] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Unit Aktif di 3D: <strong className="text-amber-400 font-mono">{activeUnitId}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* POPUP SUB-MODAL: TAMBAH UNIT BARU */}
      {/* ============================================================== */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#141923] border border-amber-500/50 rounded-xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base uppercase text-slate-100">Tambah Unit Dumptruck Baru</h3>
              </div>
              <button
                onClick={() => setIsAddUnitOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUnitSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Unit ID / Nomor Lambung (*):</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: DT-098"
                    value={newUnitCode}
                    onChange={(e) => setNewUnitCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Model Kendaraan:</label>
                  <select
                    value={newUnitModel}
                    onChange={(e) => setNewUnitModel(e.target.value)}
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Hino 500 FM 260 JD (6x4 Mining Dump)">Hino 500 FM 260 JD (6x4 Mining Dump)</option>
                    <option value="Hino 500 FM 280 TI (6x4 High Roof)">Hino 500 FM 280 TI (6x4 High Roof)</option>
                    <option value="Hino 500 FM 350 GY (6x4 Extreme Mining)">Hino 500 FM 350 GY (6x4 Extreme Mining)</option>
                    <option value="Hino 500 FM 260 JW (Long Chassis)">Hino 500 FM 260 JW (Long Chassis)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Lokasi Tambang / Pit:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pit Mahakam - West"
                    value={newUnitPit}
                    onChange={(e) => setNewUnitPit(e.target.value)}
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Total Hour Meter (HM):</label>
                  <input
                    type="number"
                    value={newUnitHm}
                    onChange={(e) => setNewUnitHm(Number(e.target.value))}
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Status Operasional:</label>
                  <select
                    value={newUnitStatus}
                    onChange={(e) => setNewUnitStatus(e.target.value as UnitOperationalStatus)}
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="BREAKDOWN">BREAKDOWN</option>
                    <option value="STANDBY">STANDBY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tahun Pembuatan:</label>
                  <input
                    type="number"
                    value={newUnitYear}
                    onChange={(e) => setNewUnitYear(Number(e.target.value))}
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nomor Rangka / VIN (Opsional):</label>
                  <input
                    type="text"
                    placeholder="MHKFM8JNK-..."
                    value={newUnitVin}
                    onChange={(e) => setNewUnitVin(e.target.value)}
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Driver / Teknisi Penanggung Jawab:</label>
                  <input
                    type="text"
                    placeholder="Nama Driver / Mekanik"
                    value={newUnitDriver}
                    onChange={(e) => setNewUnitDriver(e.target.value)}
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Catatan Operasional:</label>
                <textarea
                  rows={2}
                  placeholder="Catatan rute, jenis muatan batubara/overburden..."
                  value={newUnitNotes}
                  onChange={(e) => setNewUnitNotes(e.target.value)}
                  className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-2.5 bg-[#0e1219] rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unit baru akan otomatis diinisialisasi dengan 19 komponen 3D Hino 500 standar.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUnitOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Simpan Unit Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* POPUP SUB-MODAL: EDIT DATA UNIT */}
      {/* ============================================================== */}
      {editingUnitData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#141923] border border-amber-500/50 rounded-xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base uppercase text-slate-100">
                  Edit Unit {editingUnitData.unitCode}
                </h3>
              </div>
              <button
                onClick={() => setEditingUnitData(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditUnitSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Unit ID / Kode Lambung:</label>
                  <input
                    type="text"
                    required
                    value={editingUnitData.unitCode}
                    onChange={(e) =>
                      setEditingUnitData({ ...editingUnitData, unitCode: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Model Kendaraan:</label>
                  <input
                    type="text"
                    value={editingUnitData.model}
                    onChange={(e) =>
                      setEditingUnitData({ ...editingUnitData, model: e.target.value })
                    }
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Lokasi Tambang / Pit:</label>
                  <input
                    type="text"
                    value={editingUnitData.siteLocation}
                    onChange={(e) =>
                      setEditingUnitData({ ...editingUnitData, siteLocation: e.target.value })
                    }
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Total Hour Meter (HM):</label>
                  <input
                    type="number"
                    value={editingUnitData.currentTotalHm}
                    onChange={(e) =>
                      setEditingUnitData({
                        ...editingUnitData,
                        currentTotalHm: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Status Operasional:</label>
                  <select
                    value={editingUnitData.status}
                    onChange={(e) =>
                      setEditingUnitData({
                        ...editingUnitData,
                        status: e.target.value as UnitOperationalStatus,
                      })
                    }
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="BREAKDOWN">BREAKDOWN</option>
                    <option value="STANDBY">STANDBY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tahun:</label>
                  <input
                    type="number"
                    value={editingUnitData.year || 2022}
                    onChange={(e) =>
                      setEditingUnitData({
                        ...editingUnitData,
                        year: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">VIN / No Rangka:</label>
                  <input
                    type="text"
                    value={editingUnitData.vinSerial}
                    onChange={(e) =>
                      setEditingUnitData({ ...editingUnitData, vinSerial: e.target.value })
                    }
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Driver / Teknisi:</label>
                  <input
                    type="text"
                    value={editingUnitData.driverOrTechnician || ''}
                    onChange={(e) =>
                      setEditingUnitData({
                        ...editingUnitData,
                        driverOrTechnician: e.target.value,
                      })
                    }
                    className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Catatan Operasional:</label>
                <textarea
                  rows={2}
                  value={editingUnitData.notes || ''}
                  onChange={(e) =>
                    setEditingUnitData({ ...editingUnitData, notes: e.target.value })
                  }
                  className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUnitData(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
