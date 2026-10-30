import React, { useState } from 'react';
import {
  X,
  Gauge,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  Search,
  Eye,
  RotateCcw,
  Clock,
  ShieldAlert,
  Info,
  Edit3,
  Save,
  History,
  ClipboardList,
  User,
  FileText,
  Plus,
  Trash2,
  Tag,
  Filter,
  TrendingUp,
} from 'lucide-react';
import {
  HinoComponent,
  ViewMode,
  LifetimeThresholds,
  MaintenanceRecord,
  ServiceType,
} from '../../types';
import {
  getComponentStatus,
  getStatusColor,
  getCriticalityBadge,
  calculateRemainingHm,
  calculateLifeUsedPercent,
} from '../../data/hinoComponentsData';

interface ComponentDetailPanelProps {
  component: HinoComponent | null;
  onClose: () => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  thresholds: LifetimeThresholds;
  onUpdateComponentHm: (componentId: string, newActualHm: number) => void;
  onAddMaintenanceRecord?: (
    componentId: string,
    record: Omit<MaintenanceRecord, 'id' | 'componentId'>
  ) => void;
  onDeleteMaintenanceRecord?: (componentId: string, recordId: string) => void;
  onOpenTrendModal?: (componentId: string) => void;
}

export const ComponentDetailPanel: React.FC<ComponentDetailPanelProps> = ({
  component,
  onClose,
  viewMode,
  onSetViewMode,
  thresholds,
  onUpdateComponentHm,
  onAddMaintenanceRecord,
  onDeleteMaintenanceRecord,
  onOpenTrendModal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [isEditingHm, setIsEditingHm] = useState(false);
  const [editHmValue, setEditHmValue] = useState<number>(0);

  // History Tab filters and modal state
  const [historySearch, setHistorySearch] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('ALL');
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  // New Record Form State
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formServiceType, setFormServiceType] = useState<ServiceType>('Periodic Maintenance (PM)');
  const [formHm, setFormHm] = useState<number>(component ? component.actualHm : 0);
  const [formTech, setFormTech] = useState('Rudi Haryanto (ID: MNZ-402)');
  const [formWorkOrder, setFormWorkOrder] = useState(`WO-HN500-${Date.now().toString().slice(-4)}`);
  const [formOutcome, setFormOutcome] = useState<'Completed' | 'Monitor Next Shift' | 'Follow-up Required'>('Completed');
  const [formParts, setFormParts] = useState('');
  const [formNotes, setFormNotes] = useState('');

  if (!component) return null;

  const status = getComponentStatus(component, thresholds);
  const statusColor = getStatusColor(status);
  const critBadge = getCriticalityBadge(component.criticality);
  const remainingHm = calculateRemainingHm(component.targetLifetimeHm, component.actualHm);
  const lifeUsedPct = calculateLifeUsedPercent(component.targetLifetimeHm, component.actualHm);
  const records = component.maintenanceHistory || [];

  const handleStartEdit = () => {
    setEditHmValue(component.actualHm);
    setIsEditingHm(true);
  };

  const handleSaveHm = () => {
    onUpdateComponentHm(component.id, Math.max(0, Number(editHmValue)));
    setIsEditingHm(false);
  };

  // Submit new maintenance record
  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNotes.trim()) {
      alert('Mohon isi catatan teknisi.');
      return;
    }

    if (onAddMaintenanceRecord) {
      const partsArray = formParts
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      onAddMaintenanceRecord(component.id, {
        date: formDate,
        serviceType: formServiceType,
        hmAtService: Number(formHm),
        technician: formTech.trim(),
        workOrderNo: formWorkOrder.trim(),
        statusOutcome: formOutcome,
        replacedParts: partsArray.length > 0 ? partsArray : undefined,
        technicianNotes: formNotes.trim(),
      });
    }

    setIsAddRecordOpen(false);
    setFormNotes('');
    setFormParts('');
  };

  // Filtered maintenance history
  const filteredRecords = records.filter((rec) => {
    if (selectedServiceType !== 'ALL' && rec.serviceType !== selectedServiceType) {
      return false;
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchNotes = rec.technicianNotes.toLowerCase().includes(q);
      const matchTech = rec.technician.toLowerCase().includes(q);
      const matchType = rec.serviceType.toLowerCase().includes(q);
      const matchWO = rec.workOrderNo?.toLowerCase().includes(q);
      if (!matchNotes && !matchTech && !matchType && !matchWO) {
        return false;
      }
    }
    return true;
  });

  const getServiceTypeBadgeColor = (type: ServiceType) => {
    switch (type) {
      case 'Periodic Maintenance (PM)':
        return 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40';
      case 'Oil Sampling (SOS)':
        return 'bg-cyan-950/70 text-cyan-400 border-cyan-500/40';
      case 'Component Replacement':
        return 'bg-amber-950/70 text-amber-400 border-amber-500/40';
      case 'Overhaul / Rebuild':
        return 'bg-purple-950/70 text-purple-400 border-purple-500/40';
      case 'Calibration & Adjustment':
        return 'bg-blue-950/70 text-blue-400 border-blue-500/40';
      case 'Corrective Repair':
        return 'bg-rose-950/70 text-rose-400 border-rose-500/40';
      case 'Greasing & Torque Check':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getOutcomeBadge = (outcome: MaintenanceRecord['statusOutcome']) => {
    switch (outcome) {
      case 'Completed':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          label: 'Completed / Normal',
        };
      case 'Monitor Next Shift':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          label: 'Monitor Next Shift',
        };
      case 'Follow-up Required':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          label: 'Action Required',
        };
    }
  };

  return (
    <aside className="absolute right-0 top-11 bottom-0 z-20 w-88 lg:w-98 bg-[#0b0e14]/95 border-l border-slate-800/90 backdrop-blur-md flex flex-col shadow-2xl transition-all duration-300 select-none overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-code text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
              #{component.number.toString().padStart(2, '0')}
            </span>
            <span
              className={`text-[10px] font-tech uppercase px-2 py-0.5 rounded border ${critBadge.bg} ${critBadge.text} ${critBadge.border}`}
            >
              {component.criticality}
            </span>
            <span
              className={`text-[10px] font-tech uppercase px-2 py-0.5 rounded border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
            >
              {status}
            </span>
          </div>

          <h2 className="font-tech text-base font-bold text-white tracking-wide leading-tight">
            {component.name}
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5 italic">
            {component.nameId}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Tutup Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center border-b border-slate-800 bg-[#0e121a] px-3 pt-2 gap-2 text-xs font-tech">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 font-bold tracking-wider transition-colors ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>RINGKASAN & UMUR (HM)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 font-bold tracking-wider transition-colors ${
            activeTab === 'history'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>MAINTENANCE HISTORY</span>
          <span className="text-[10px] font-code bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded border border-slate-700">
            {records.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Overview & Lifetime Content */}
      {activeTab === 'overview' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Unit & Serial Meta Card */}
          <div className="grid grid-cols-2 gap-2 text-xs font-code bg-[#111620] p-2.5 rounded border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] block">UNIT FLEET ID:</span>
              <span className="text-slate-200 font-semibold">{component.unitId}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">SERIAL NUMBER:</span>
              <span
                className="text-amber-400 font-semibold truncate block"
                title={component.serialNumber}
              >
                {component.serialNumber}
              </span>
            </div>
          </div>

          {/* Lifetime Meter / Progress Card */}
          <div className="bg-[#10141d] p-3.5 rounded border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-tech text-slate-300">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>PEMAKAIAN UMUR (HM)</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-code">
                <span className={`font-bold ${statusColor.text}`}>{lifeUsedPct}%</span>
                <span className="text-slate-500 text-[10px]">USED</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(lifeUsedPct, 100)}%`,
                    backgroundColor: statusColor.hex,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-code text-slate-500">
                <span>0 HM</span>
                <span>Warning: {thresholds.warningPercent}%</span>
                <span>Target: {component.targetLifetimeHm.toLocaleString()} HM</span>
              </div>
            </div>

            {/* HM Statistics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center font-code">
              <div className="bg-[#141a24] p-2 rounded">
                <span className="text-[10px] text-slate-400 block">ACTUAL HM</span>
                {isEditingHm ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={editHmValue}
                      onChange={(e) => setEditHmValue(Number(e.target.value))}
                      className="w-full bg-black text-amber-400 font-bold text-xs p-1 rounded border border-amber-500 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveHm}
                      className="p-1 bg-amber-500 text-black rounded hover:bg-amber-400"
                      title="Simpan"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="text-xs font-bold text-white">
                      {component.actualHm.toLocaleString()}
                    </span>
                    <button
                      onClick={handleStartEdit}
                      className="text-slate-500 hover:text-amber-400"
                      title="Edit Actual HM"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-[#141a24] p-2 rounded">
                <span className="text-[10px] text-slate-400 block">TARGET HM</span>
                <span className="text-xs font-bold text-amber-300 mt-0.5 block">
                  {component.targetLifetimeHm.toLocaleString()}
                </span>
              </div>

              <div className="bg-[#141a24] p-2 rounded">
                <span className="text-[10px] text-slate-400 block">REMAINING HM</span>
                <span className={`text-xs font-bold mt-0.5 block ${statusColor.text}`}>
                  {remainingHm.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Dedicated Trend Degradation & Scheduled PM Button */}
          <button
            onClick={() => onOpenTrendModal?.(component.id)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent hover:from-amber-500/25 hover:via-amber-500/15 hover:to-amber-500/5 border border-amber-500/40 hover:border-amber-400 text-amber-300 transition-all shadow-sm group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-tech font-bold text-xs text-white group-hover:text-amber-200 flex items-center gap-1.5">
                  <span>ANALISIS TREND DEGRADASI HM</span>
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded font-mono font-bold">
                    RECHARTS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Grafik Garis: Actual HM vs Jadwal PM & Degradasi
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              Lihat Grafik →
            </span>
          </button>

          {/* Quick link to Maintenance History Banner */}
          <div
            onClick={() => setActiveTab('history')}
            className="bg-[#111724] border border-amber-500/30 hover:border-amber-500/60 p-3 rounded cursor-pointer transition-colors flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-tech text-white font-bold block">
                  RIWAYAT SERVIS TERCATAT ({records.length} EVENT)
                </span>
                <span className="text-[11px] text-slate-400">
                  Terakhir: {records[0]?.date || component.lastReplacementDate} • {records[0]?.serviceType || 'PM Regular'}
                </span>
              </div>
            </div>
            <span className="text-amber-400 text-xs font-tech font-bold hover:underline">
              Buka Tab →
            </span>
          </div>

          {/* Maintenance Actions & Inspection */}
          <div className="bg-[#10141d] p-3.5 rounded border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-tech text-amber-400 font-bold">
              <Wrench className="w-4 h-4" />
              <span>REKOMENDASI MAINTENANCE</span>
            </div>

            <p className="text-xs text-slate-200 font-sans leading-relaxed bg-[#141a24] p-2.5 rounded border border-slate-800/80">
              {component.recommendedAction}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-sans pt-1">
              <div className="bg-[#141a24] p-2 rounded">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Terakhir Diganti:
                </span>
                <span className="text-slate-300 font-code font-medium text-[11px]">
                  {component.lastReplacementDate}
                </span>
              </div>

              <div className="bg-[#141a24] p-2 rounded">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Jadwal Inspeksi:
                </span>
                <span className="text-amber-400 font-code font-medium text-[11px]">
                  {component.nextInspectionDate}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
              <span className="text-slate-500 font-bold block mb-0.5">CATATAN TEKNIS TAMBANG:</span>
              {component.maintenanceNotes}
            </div>
          </div>

          {/* Sub-Components Breakdown */}
          {component.subComponents && component.subComponents.length > 0 && (
            <div className="bg-[#10141d] p-3 rounded border border-slate-800 space-y-2">
              <span className="text-[11px] font-tech text-slate-400 uppercase tracking-wider block">
                SUB-KOMPONEN TERKAIT:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {component.subComponents.map((sub, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-sans bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded"
                  >
                    • {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Official OEM Manual Disclaimer */}
          <div className="bg-amber-950/20 border border-amber-600/30 p-2.5 rounded text-[11px] text-amber-200/80 font-sans flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-tight text-[10px]">
              <strong>DISCLAIMER PERENCANAAN:</strong> Umur pakai target berbasis referensi umum (DEMO). Keputusan actual replacement wajib merujuk shop manual resmi Hino, riwayat oil sampling (SOS), dan beban rute hauling tambang.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Maintenance History Tab Content */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col">
          {/* Action Header & Filter Bar */}
          <div className="bg-[#101520] p-3 rounded-lg border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-tech font-bold text-amber-400 uppercase tracking-wide block">
                  LOG SERVIS & INSPEKSI
                </span>
                <span className="text-[10px] text-slate-400">
                  Total {records.length} riwayat pekerjaan tersimpan
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenTrendModal?.(component.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-tech font-bold bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-500/40 transition-colors shadow-xs"
                  title="Buka Visualisasi Trend Degradasi HM Recharts"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Trend HM</span>
                </button>

                <button
                  onClick={() => {
                    setFormHm(component.actualHm);
                    setFormWorkOrder(`WO-HN500-${Date.now().toString().slice(-4)}`);
                    setIsAddRecordOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-tech font-bold bg-amber-500 hover:bg-amber-400 text-black transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Servis</span>
                </button>
              </div>
            </div>

            {/* Search Box & Service Filter */}
            <div className="space-y-1.5 pt-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari catatan servis, teknisi, WO..."
                  className="w-full bg-[#131722] border border-slate-700/80 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors font-sans"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-tech py-0.5">
                <span className="text-slate-500 uppercase mr-0.5">Tipe:</span>
                {[
                  'ALL',
                  'Periodic Maintenance (PM)',
                  'Oil Sampling (SOS)',
                  'Component Replacement',
                  'Calibration & Adjustment',
                  'Corrective Repair',
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedServiceType(t)}
                    className={`px-2 py-0.5 rounded border whitespace-nowrap transition-colors ${
                      selectedServiceType === t
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'ALL' ? 'Semua Tipe' : t.replace(' (PM)', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline of Records */}
          {filteredRecords.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0d1017] border border-dashed border-slate-800 rounded-lg">
              <ClipboardList className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-tech text-slate-300">
                Tidak ada riwayat servis yang sesuai filter
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Klik tombol "Catat Servis Baru" di atas untuk menambahkan log inspeksi atau penggantian komponen.
              </p>
            </div>
          ) : (
            <div className="space-y-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {filteredRecords.map((rec) => {
                const outcome = getOutcomeBadge(rec.statusOutcome);
                const typeColor = getServiceTypeBadgeColor(rec.serviceType);

                return (
                  <div
                    key={rec.id}
                    className="relative pl-7 group"
                  >
                    {/* Node Dot on Timeline */}
                    <div className="absolute left-1.5 top-3.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0b0e14] glow-yellow-sm" />

                    {/* Record Card */}
                    <div className="bg-[#10141d] border border-slate-800 hover:border-slate-700 rounded-lg p-3 space-y-2 transition-colors">
                      {/* Top Header of Record */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] font-code text-slate-300 font-semibold">
                              <Calendar className="w-3 h-3 text-amber-400" />
                              {rec.date}
                            </span>
                            <span className="text-[10px] font-code text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                              {rec.hmAtService.toLocaleString()} HM
                            </span>
                            {rec.workOrderNo && (
                              <span className="text-[10px] font-code text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                                {rec.workOrderNo}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-tech font-bold uppercase px-2 py-0.5 rounded border ${typeColor}`}
                            >
                              {rec.serviceType}
                            </span>
                            <span
                              className={`text-[9px] font-tech uppercase px-1.5 py-0.2 rounded border ${outcome.bg}`}
                            >
                              {outcome.label}
                            </span>
                          </div>
                        </div>

                        {/* Delete record button */}
                        {onDeleteMaintenanceRecord && (
                          <button
                            onClick={() => {
                              if (confirm('Hapus catatan servis ini?')) {
                                onDeleteMaintenanceRecord(component.id, rec.id);
                              }
                            }}
                            className="p-1 text-slate-600 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Hapus Catatan Servis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Technician & Crew */}
                      <div className="text-[11px] font-sans text-slate-400 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Teknisi:</span>
                        <span className="text-slate-200 font-medium">{rec.technician}</span>
                      </div>

                      {/* Technician Notes */}
                      <div className="bg-[#141a24] p-2.5 rounded border border-slate-800/80 text-xs text-slate-200 font-sans leading-relaxed">
                        <p className="whitespace-pre-line">{rec.technicianNotes}</p>
                      </div>

                      {/* Replaced Parts Chips */}
                      {rec.replacedParts && rec.replacedParts.length > 0 && (
                        <div className="pt-1 border-t border-slate-800/60">
                          <span className="text-[10px] font-tech text-slate-400 uppercase tracking-wider block mb-1">
                            SUKU CADANG DIGANTI:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {rec.replacedParts.map((part, pIdx) => (
                              <span
                                key={pIdx}
                                className="text-[10px] font-code bg-slate-900 text-amber-300 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1"
                              >
                                <Tag className="w-2.5 h-2.5 text-amber-500" />
                                {part}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Action Footer Buttons */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/90 grid grid-cols-2 gap-2">
        <button
          onClick={() => onSetViewMode(viewMode === 'INSPECTION' ? 'COMPLETE' : 'INSPECTION')}
          className={`px-3 py-2 rounded text-xs font-tech tracking-wider border flex items-center justify-center gap-1.5 transition-colors ${
            viewMode === 'INSPECTION'
              ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{viewMode === 'INSPECTION' ? 'Reset Isolasi' : 'Isolasi Komponen'}</span>
        </button>

        <button
          onClick={() => onSetViewMode('EXPLODED')}
          className="px-3 py-2 rounded text-xs font-tech tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Exploded View</span>
        </button>
      </div>

      {/* Modal / Dialog: Add New Service Record */}
      {isAddRecordOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none">
          <div className="bg-[#0e121a] border border-amber-500/60 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden glow-yellow-sm">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <h3 className="font-tech text-sm font-bold text-amber-400 uppercase tracking-wider">
                  CATAT RIWAYAT SERVIS KOMPONEN
                </h3>
              </div>
              <button
                onClick={() => setIsAddRecordOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRecord} className="p-4 space-y-3 bg-[#080a0f] text-xs">
              <div className="bg-[#121622] p-2 rounded border border-slate-800 text-[11px] font-code text-slate-300">
                <span className="text-slate-500">KOMPONEN:</span>{' '}
                <strong className="text-white">{component.name}</strong> ({component.serialNumber})
              </div>

              {/* Grid 2 Column */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-tech text-slate-400 uppercase block mb-1">
                    Tanggal Servis:
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#131722] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-tech text-slate-400 uppercase block mb-1">
                    Hour Meter (HM) Saat Servis:
                  </label>
                  <input
                    type="number"
                    required
                    value={formHm}
                    onChange={(e) => setFormHm(Number(e.target.value))}
                    className="w-full bg-[#131722] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-code text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-tech text-slate-400 uppercase block mb-1">
                    Tipe Pekerjaan / Servis:
                  </label>
                  <select
                    value={formServiceType}
                    onChange={(e) => setFormServiceType(e.target.value as ServiceType)}
                    className="w-full bg-[#131722] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Periodic Maintenance (PM)">Periodic Maintenance (PM)</option>
                    <option value="Oil Sampling (SOS)">Oil Sampling (SOS)</option>
                    <option value="Component Replacement">Component Replacement</option>
                    <option value="Overhaul / Rebuild">Overhaul / Rebuild</option>
                    <option value="Calibration & Adjustment">Calibration & Adjustment</option>
                    <option value="Greasing & Torque Check">Greasing & Torque Check</option>
                    <option value="Corrective Repair">Corrective Repair</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-tech text-slate-400 uppercase block mb-1">
                    Status Hasil Servis:
                  </label>
                  <select
                    value={formOutcome}
                    onChange={(e) =>
                      setFormOutcome(
                        e.target.value as 'Completed' | 'Monitor Next Shift' | 'Follow-up Required'
                      )
                    }
                    className="w-full bg-[#131722] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Completed">Completed (Selesai Normal)</option>
                    <option value="Monitor Next Shift">Monitor Next Shift</option>
                    <option value="Follow-up Required">Follow-up Required (Perlu Tindakan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-tech text-slate-400 uppercase block mb-1">
                    Nama & ID Teknisi / Mekanik:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTech}
                    onChange={(e) => setFormTech(e.target.value)}
                    placeholder="Contoh: Rudi Haryanto (MNZ-402)"
                    className="w-full bg-[#131722] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-tech text-slate-400 uppercase block mb-1">
                    Nomor Work Order (WO):
                  </label>
                  <input
                    type="text"
                    value={formWorkOrder}
                    onChange={(e) => setFormWorkOrder(e.target.value)}
                    placeholder="WO-2024-..."
                    className="w-full bg-[#131722] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-code text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-tech text-slate-400 uppercase block mb-1">
                  Suku Cadang Diganti (Pisahkan dengan koma):
                </label>
                <input
                  type="text"
                  value={formParts}
                  onChange={(e) => setFormParts(e.target.value)}
                  placeholder="Contoh: Filter Oli (15607-2190), Oli 15W-40 28L"
                  className="w-full bg-[#131722] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-tech text-slate-400 uppercase block mb-1">
                  Catatan Teknisi (Observations, Torque, SOS, dll.):
                </label>
                <textarea
                  required
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Deskripsikan pekerjaan, temuan visual, pengukuran ketebalan/tekanan/celah, rekomendasi shift selanjutnya..."
                  className="w-full bg-[#131722] border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none font-sans"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRecordOpen(false)}
                  className="px-3 py-1.5 rounded text-xs font-tech text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-tech font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-md transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Catatan Servis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
