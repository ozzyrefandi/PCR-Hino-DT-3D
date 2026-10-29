import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, Layers, Truck } from 'lucide-react';
import { HinoComponent, ComponentStatus, LifetimeThresholds, DumpTruckUnit } from '../../types';
import { getComponentStatus } from '../../data/hinoComponentsData';

interface KPIDashboardProps {
  components: HinoComponent[];
  thresholds: LifetimeThresholds;
  activeStatusFilter: 'ALL' | ComponentStatus;
  onSelectStatusFilter: (status: 'ALL' | ComponentStatus) => void;
  activeUnit?: DumpTruckUnit | null;
  onOpenFleetModal?: () => void;
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({
  components,
  thresholds,
  activeStatusFilter,
  onSelectStatusFilter,
  activeUnit,
  onOpenFleetModal,
}) => {
  const stats = React.useMemo(() => {
    let normal = 0;
    let warning = 0;
    let overdue = 0;
    let noData = 0;

    components.forEach((c) => {
      const s = getComponentStatus(c, thresholds);
      if (s === 'NORMAL') normal++;
      else if (s === 'WARNING') warning++;
      else if (s === 'OVERDUE') overdue++;
      else noData++;
    });

    const total = components.length;
    return {
      total,
      normal,
      warning,
      overdue,
      noData,
      normalPct: total > 0 ? Math.round((normal / total) * 100) : 0,
      warningPct: total > 0 ? Math.round((warning / total) * 100) : 0,
      overduePct: total > 0 ? Math.round((overdue / total) * 100) : 0,
    };
  }, [components, thresholds]);

  return (
    <div className="bg-[#0b0e14]/90 border-b border-slate-800/80 px-3 lg:px-6 py-2 flex items-center justify-between overflow-x-auto gap-2 text-xs select-none">
      <div className="flex items-center gap-2.5 shrink-0">
        {activeUnit && (
          <button
            onClick={onOpenFleetModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono font-bold text-xs transition-colors"
            title="Klik untuk membuka Manajemen 10 Unit Armada"
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>{activeUnit.unitCode}</span>
            <span className="text-slate-400 font-normal hidden sm:inline">• {activeUnit.siteLocation}</span>
          </button>
        )}
        <span className="font-tech text-slate-400 uppercase text-[11px] tracking-wider hidden md:inline">
          KPI STATUS KOMPONEN:
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Total Registered */}
        <button
          onClick={() => onSelectStatusFilter('ALL')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            activeStatusFilter === 'ALL'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold shadow-sm'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Total:</span>
          <span className="font-code font-bold text-white">{stats.total}</span>
        </button>

        {/* Normal */}
        <button
          onClick={() => onSelectStatusFilter('NORMAL')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            activeStatusFilter === 'NORMAL'
              ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 font-semibold ring-1 ring-emerald-500/50'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Normal:</span>
          <span className="font-code font-bold text-emerald-400">
            {stats.normal} ({stats.normalPct}%)
          </span>
        </button>

        {/* Warning */}
        <button
          onClick={() => onSelectStatusFilter('WARNING')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            activeStatusFilter === 'WARNING'
              ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-semibold ring-1 ring-amber-500/50'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Warning:</span>
          <span className="font-code font-bold text-amber-400">
            {stats.warning} ({stats.warningPct}%)
          </span>
        </button>

        {/* Overdue */}
        <button
          onClick={() => onSelectStatusFilter('OVERDUE')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            activeStatusFilter === 'OVERDUE'
              ? 'bg-red-500/25 border-red-500 text-red-300 font-semibold ring-1 ring-red-500/50'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          <span>Overdue:</span>
          <span className="font-code font-bold text-red-400">
            {stats.overdue} ({stats.overduePct}%)
          </span>
        </button>

        {stats.noData > 0 && (
          <button
            onClick={() => onSelectStatusFilter('NOT_AVAILABLE')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${
              activeStatusFilter === 'NOT_AVAILABLE'
                ? 'bg-slate-700 border-slate-500 text-white font-semibold'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <HelpCircle className="w-3 h-3 text-slate-500" />
            <span>Tanpa Data: {stats.noData}</span>
          </button>
        )}
      </div>
    </div>
  );
};
