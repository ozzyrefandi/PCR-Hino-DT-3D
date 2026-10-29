import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronLeft,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { HinoComponent, ComponentStatus, ComponentCriticality, LifetimeThresholds } from '../../types';
import { getComponentStatus, getStatusColor } from '../../data/hinoComponentsData';

interface ComponentTreePanelProps {
  components: HinoComponent[];
  selectedComponent: HinoComponent | null;
  onSelectComponent: (componentId: string) => void;
  thresholds: LifetimeThresholds;
  statusFilter: 'ALL' | ComponentStatus;
  onSetStatusFilter: (status: 'ALL' | ComponentStatus) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ComponentTreePanel: React.FC<ComponentTreePanelProps> = ({
  components,
  selectedComponent,
  onSelectComponent,
  thresholds,
  statusFilter,
  onSetStatusFilter,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState<'ALL' | ComponentCriticality>('ALL');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Group components by System Category
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = comp.name.toLowerCase().includes(q);
        const matchNameId = comp.nameId.toLowerCase().includes(q);
        const matchSerial = comp.serialNumber.toLowerCase().includes(q);
        const matchCategory = comp.systemCategory.toLowerCase().includes(q);
        if (!matchName && !matchNameId && !matchSerial && !matchCategory) {
          return false;
        }
      }

      // Criticality filter
      if (criticalityFilter !== 'ALL' && comp.criticality !== criticalityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const s = getComponentStatus(comp, thresholds);
        if (s !== statusFilter) return false;
      }

      return true;
    });
  }, [components, searchQuery, criticalityFilter, statusFilter, thresholds]);

  const grouped = useMemo(() => {
    const map = new Map<string, HinoComponent[]>();
    filteredComponents.forEach((c) => {
      const list = map.get(c.systemCategory) || [];
      list.push(c);
      map.set(c.systemCategory, list);
    });
    return map;
  }, [filteredComponents]);

  return (
    <>
      {/* Floating Toggle Tab when Closed */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="absolute left-3 top-20 z-10 bg-[#0f141c]/95 border border-amber-500/50 hover:border-amber-400 text-amber-400 p-2 rounded shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-xs font-tech tracking-wider glow-yellow-sm transition-all"
          title="Buka Navigasi Komponen"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>DAFTAR KOMPONEN ({filteredComponents.length})</span>
        </button>
      )}

      {/* Main Drawer Panel */}
      <aside
        className={`absolute left-0 top-11 bottom-0 z-20 w-80 lg:w-88 bg-[#0b0e14]/95 border-r border-slate-800/90 backdrop-blur-md flex flex-col transition-transform duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-tech text-sm font-bold tracking-wider text-amber-400">
              HIERARKI KOMPONEN
            </span>
            <span className="text-[11px] font-code bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
              {filteredComponents.length} Unit
            </span>
          </div>

          <button
            onClick={onToggleOpen}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup Panel"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 border-b border-slate-800/80 space-y-2.5 bg-slate-950/40">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari komponen, serial, kategori..."
              className="w-full bg-[#131722] border border-slate-700/80 rounded pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Criticality Filter Pills */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-500 text-[10px] font-tech uppercase mr-1">Kritis:</span>
            {(['ALL', 'Critical', 'High Cost', 'Wear'] as const).map((crit) => (
              <button
                key={crit}
                onClick={() => setCriticalityFilter(crit)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  criticalityFilter === crit
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {crit === 'ALL' ? 'Semua' : crit}
              </button>
            ))}
          </div>

          {/* Active Status Filter Indicator if applied */}
          {statusFilter !== 'ALL' && (
            <div className="flex items-center justify-between text-[11px] bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <span className="text-slate-400">
                Filter Status: <strong className="text-amber-400">{statusFilter}</strong>
              </span>
              <button
                onClick={() => onSetStatusFilter('ALL')}
                className="text-amber-400 hover:underline text-[10px]"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Tree Hierarchy List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {grouped.size === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Tidak ada komponen yang cocok dengan filter pencarian.
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, items]) => {
              const isCollapsed = collapsedCategories[category];

              return (
                <div key={category} className="rounded border border-slate-800/70 bg-[#0e121a]/60 overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="font-tech text-xs font-semibold text-slate-200 tracking-wide">
                        {category}
                      </span>
                    </div>
                    <span className="text-[10px] font-code text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                      {items.length}
                    </span>
                  </button>

                  {/* Component Items in this Category */}
                  {!isCollapsed && (
                    <div className="divide-y divide-slate-800/40">
                      {items.map((comp) => {
                        const isSelected = selectedComponent?.id === comp.id;
                        const status = getComponentStatus(comp, thresholds);
                        const statusColor = getStatusColor(status);
                        const lifePct = Math.round((comp.actualHm / comp.targetLifetimeHm) * 100);

                        return (
                          <div
                            key={comp.id}
                            onClick={() => onSelectComponent(comp.id)}
                            className={`p-2 pl-4 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-amber-500/15 border-l-2 border-amber-400 text-white'
                                : 'hover:bg-slate-800/40 text-slate-300'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-code text-[10px] text-amber-400/90 font-bold">
                                  #{comp.number.toString().padStart(2, '0')}
                                </span>
                                <span className="text-xs font-medium truncate">
                                  {comp.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-code truncate mt-0.5">
                                {comp.actualHm.toLocaleString()} / {comp.targetLifetimeHm.toLocaleString()} HM
                              </div>
                            </div>

                            {/* Status Indicator Pill */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-[10px] font-code px-1.5 py-0.5 rounded border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                              >
                                {lifePct}%
                              </span>
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: statusColor.hex }}
                                title={status}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info tip */}
        <div className="p-2.5 border-t border-slate-800 text-[10px] text-slate-500 font-sans bg-slate-950/60">
          💡 Klik komponen untuk memusatkan kamera 3D dan menampilkan lembar servis.
        </div>
      </aside>
    </>
  );
};
