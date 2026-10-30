import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  Download,
  ShieldAlert,
  Sliders,
  Wrench,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
} from 'lucide-react';
import {
  HinoComponent,
  LifetimeThresholds,
  MaintenanceRecord,
} from '../../types';
import {
  getComponentStatus,
  getStatusColor,
  calculateRemainingHm,
  calculateLifeUsedPercent,
} from '../../data/hinoComponentsData';
import { ErrorBoundary } from './ErrorBoundary';

interface DegradationTrendModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComponent: HinoComponent | null;
  allComponents: HinoComponent[];
  onSelectComponent: (componentId: string) => void;
  thresholds: LifetimeThresholds;
  unitCode?: string;
}

interface TrendPoint {
  id: string;
  dateLabel: string;
  fullDate: string;
  actualHm: number | null;
  scheduledHm: number;
  projectedHm: number | null;
  healthPercent: number | null;
  eventType: 'install' | 'historical_pm' | 'current' | 'future_pm';
  serviceName?: string;
  technicianNotes?: string;
  variance?: number;
}

interface DegradationTrendContentProps {
  onClose: () => void;
  activeComponent: HinoComponent;
  allComponents: HinoComponent[];
  onSelectComponent: (componentId: string) => void;
  thresholds: LifetimeThresholds;
  unitCode?: string;
}

const DegradationTrendContent: React.FC<DegradationTrendContentProps> = ({
  onClose,
  activeComponent,
  allComponents,
  onSelectComponent,
  thresholds,
  unitCode = 'DT-088',
}) => {
  const [viewMetric, setViewMetric] = useState<'HM' | 'HEALTH'>('HM');
  const [timeHorizon, setTimeHorizon] = useState<'FORECAST' | 'HISTORICAL_ONLY' | 'FULL_LIFECYCLE'>('FORECAST');
  const [isComponentDropdownOpen, setIsComponentDropdownOpen] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [showScheduledLine, setShowScheduledLine] = useState(true);
  const [showActualLine, setShowActualLine] = useState(true);
  const [showProjectedLine, setShowProjectedLine] = useState(true);

  const svgContainerRef = useRef<HTMLDivElement>(null);

  const status = getComponentStatus(activeComponent, thresholds);
  const statusColor = getStatusColor(status);
  const remainingHm = calculateRemainingHm(
    activeComponent.targetLifetimeHm,
    activeComponent.actualHm
  );
  const lifeUsedPct = calculateLifeUsedPercent(
    activeComponent.targetLifetimeHm,
    activeComponent.actualHm
  );

  const warningLimitHm = Math.round(
    (activeComponent.targetLifetimeHm * thresholds.warningPercent) / 100
  );
  const overdueLimitHm = Math.round(
    (activeComponent.targetLifetimeHm * thresholds.overduePercent) / 100
  );

  // Generate historical degradation data & scheduled maintenance baseline
  const trendData = useMemo(() => {
    const records = [...(activeComponent.maintenanceHistory || [])];
    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const points: TrendPoint[] = [];

    // 1. Installation Baseline (Day 0)
    const installDate = activeComponent.lastReplacementDate
      ? new Date(activeComponent.lastReplacementDate)
      : new Date('2023-01-15');

    const startDate = new Date(installDate);
    startDate.setMonth(startDate.getMonth() - 14);
    const startDateStr = startDate.toISOString().slice(0, 10);

    points.push({
      id: 'pt-install',
      dateLabel: 'Pemasangan (0 HM)',
      fullDate: startDateStr,
      actualHm: 0,
      scheduledHm: 0,
      projectedHm: null,
      healthPercent: 100,
      eventType: 'install',
      serviceName: 'Komponen Baru Dipasang (OEM Standard)',
      technicianNotes: 'Komponen OEM Hino 500 dipasang dan dikalibrasi sesuai Shop Manual.',
      variance: 0,
    });

    // 2. Historical PM records
    const intervalHm = activeComponent.inspectionIntervalHm || 2500;
    records.forEach((rec, idx) => {
      const scheduledTarget = Math.round(intervalHm * (idx + 1));
      const variance = rec.hmAtService - scheduledTarget;
      const health = Math.max(
        0,
        Math.round((1 - rec.hmAtService / activeComponent.targetLifetimeHm) * 100)
      );

      points.push({
        id: `pt-hist-${rec.id}`,
        dateLabel: `${rec.date.slice(5)} (${Math.round(rec.hmAtService / 1000)}k)`,
        fullDate: rec.date,
        actualHm: rec.hmAtService,
        scheduledHm: scheduledTarget,
        projectedHm: null,
        healthPercent: health,
        eventType: 'historical_pm',
        serviceName: `${rec.serviceType} (WO: ${rec.workOrderNo || 'N/A'})`,
        technicianNotes: rec.technicianNotes,
        variance,
      });
    });

    // 3. Current Actual Reading (Today)
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const currentScheduled = Math.round(activeComponent.targetLifetimeHm * 0.65);
    const currentVariance = activeComponent.actualHm - currentScheduled;
    const currentHealth = Math.max(
      0,
      Math.round((1 - activeComponent.actualHm / activeComponent.targetLifetimeHm) * 100)
    );

    points.push({
      id: 'pt-current',
      dateLabel: `Hari Ini (${Math.round(activeComponent.actualHm / 1000)}k)`,
      fullDate: todayStr,
      actualHm: activeComponent.actualHm,
      scheduledHm: currentScheduled,
      projectedHm: activeComponent.actualHm,
      healthPercent: currentHealth,
      eventType: 'current',
      serviceName: `Status Terkini Unit ${activeComponent.unitId || unitCode}`,
      technicianNotes: `Actual Hour Meter terbaca ${activeComponent.actualHm.toLocaleString()} HM. Tindakan rekomendasi: ${activeComponent.recommendedAction}`,
      variance: currentVariance,
    });

    // 4. Projections & Future Scheduled PM Checkpoints
    if (timeHorizon !== 'HISTORICAL_ONLY') {
      const avgMonthlyHm = 350; // standard mining dump truck pace ~350 HM/month
      const futureCheckpoints = timeHorizon === 'FULL_LIFECYCLE' ? 6 : 3;

      let lastHm = activeComponent.actualHm;
      let lastSched = currentScheduled;

      for (let i = 1; i <= futureCheckpoints; i++) {
        const futureDate = new Date(today);
        futureDate.setMonth(futureDate.getMonth() + i * 2);
        const fDateStr = futureDate.toISOString().slice(0, 10);

        lastHm += avgMonthlyHm * 2;
        lastSched += avgMonthlyHm * 2;

        const fHealth = Math.max(
          0,
          Math.round((1 - lastHm / activeComponent.targetLifetimeHm) * 100)
        );

        points.push({
          id: `pt-future-${i}`,
          dateLabel: `+${i * 2} Bln (${Math.round(lastHm / 1000)}k)`,
          fullDate: fDateStr,
          actualHm: null,
          scheduledHm: lastSched,
          projectedHm: lastHm,
          healthPercent: fHealth,
          eventType: 'future_pm',
          serviceName: `Rencana PM ${Math.round(lastSched)} HM`,
          technicianNotes:
            lastHm >= activeComponent.targetLifetimeHm
              ? 'PERINGATAN: Melewati Target Lifetime 100%! Jadwalkan Overhaul / Penggantian Total.'
              : lastHm >= warningLimitHm
              ? 'PERHATIAN: Memasuki Zona Warning 80%. Siapkan part cadangan dan SOS sampling.'
              : 'Jadwal servis preventif normal sesuai HM berkala.',
          variance: lastHm - lastSched,
        });
      }
    }

    return points;
  }, [activeComponent, timeHorizon, warningLimitHm, unitCode]);

  // Compute Degradation Metrics
  const degradationRate = useMemo(() => {
    const avgMonthlyHm = 320;
    const monthsToWarning = remainingHm > 0 ? (remainingHm * 0.8) / avgMonthlyHm : 0;
    const monthsToOverdue = remainingHm / avgMonthlyHm;
    const isAccelerated = activeComponent.actualHm > activeComponent.targetLifetimeHm * 0.7;

    return {
      avgMonthlyHm,
      monthsToWarning: Math.max(0, Math.round(monthsToWarning * 10) / 10),
      monthsToOverdue: Math.max(0, Math.round(monthsToOverdue * 10) / 10),
      isAccelerated,
    };
  }, [activeComponent, remainingHm]);

  // SVG Chart Geometry Calculations
  const chartWidth = 840;
  const chartHeight = 320;
  const padding = { top: 25, right: 35, bottom: 45, left: 65 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Maximum scale bounds
  const maxYValue = useMemo(() => {
    if (viewMetric === 'HEALTH') return 100;
    const values: number[] = [
      activeComponent.targetLifetimeHm * 1.15,
      warningLimitHm,
      overdueLimitHm,
    ];
    trendData.forEach((p) => {
      if (p.actualHm !== null) values.push(p.actualHm);
      if (p.projectedHm !== null) values.push(p.projectedHm);
      values.push(p.scheduledHm);
    });
    const maxVal = Math.max(...values, 1000);
    return Math.ceil(maxVal / 5000) * 5000;
  }, [viewMetric, activeComponent, warningLimitHm, overdueLimitHm, trendData]);

  // Coordinate mappers
  const getX = (index: number) => {
    if (trendData.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (trendData.length - 1)) * plotWidth;
  };

  const getY = (val: number | null) => {
    if (val === null) return padding.top + plotHeight;
    const clamped = Math.max(0, Math.min(maxYValue, val));
    return padding.top + plotHeight - (clamped / maxYValue) * plotHeight;
  };

  // Build SVG Paths
  const { actualPath, actualAreaPath, scheduledPath, projectedPath, actualCoordinates } = useMemo(() => {
    let actD = '';
    let actAreaD = '';
    let schedD = '';
    let projD = '';
    const actCoords: { x: number; y: number; point: TrendPoint; index: number }[] = [];

    // Scheduled Line
    trendData.forEach((pt, idx) => {
      const x = getX(idx);
      const val = viewMetric === 'HM' ? pt.scheduledHm : pt.healthPercent || 0;
      const y = getY(val);
      schedD += `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
    });

    // Actual Line (only up to current actual reading)
    const actualPoints = trendData.filter((p) => p.actualHm !== null);
    actualPoints.forEach((pt, idx) => {
      const origIdx = trendData.indexOf(pt);
      const x = getX(origIdx);
      const val = viewMetric === 'HM' ? pt.actualHm! : pt.healthPercent || 0;
      const y = getY(val);
      actCoords.push({ x, y, point: pt, index: origIdx });

      if (idx === 0) {
        actD += `M ${x.toFixed(1)} ${y.toFixed(1)} `;
        actAreaD += `M ${x.toFixed(1)} ${(padding.top + plotHeight).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} `;
      } else {
        actD += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
        actAreaD += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
      }

      if (idx === actualPoints.length - 1) {
        actAreaD += `L ${x.toFixed(1)} ${(padding.top + plotHeight).toFixed(1)} Z`;
      }
    });

    // Projected Line (from current point into future points)
    const currentPt = trendData.find((p) => p.eventType === 'current');
    const futurePoints = trendData.filter((p) => p.eventType === 'future_pm');

    if (currentPt && futurePoints.length > 0) {
      const currentIdx = trendData.indexOf(currentPt);
      const curX = getX(currentIdx);
      const curVal = viewMetric === 'HM' ? currentPt.actualHm! : currentPt.healthPercent || 0;
      const curY = getY(curVal);

      projD += `M ${curX.toFixed(1)} ${curY.toFixed(1)} `;

      futurePoints.forEach((pt) => {
        const origIdx = trendData.indexOf(pt);
        const x = getX(origIdx);
        const val = viewMetric === 'HM' ? pt.projectedHm! : pt.healthPercent || 0;
        const y = getY(val);
        projD += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
      });
    }

    return {
      actualPath: actD,
      actualAreaPath: actAreaD,
      scheduledPath: schedD,
      projectedPath: projD,
      actualCoordinates: actCoords,
    };
  }, [trendData, viewMetric, maxYValue]);

  // Y-Axis Grid steps
  const yTicks = useMemo(() => {
    const count = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.round((maxYValue / count) * i));
    }
    return ticks;
  }, [maxYValue]);

  // Threshold Y positions
  const warningY = getY(viewMetric === 'HM' ? warningLimitHm : 100 - thresholds.warningPercent);
  const overdueY = getY(viewMetric === 'HM' ? overdueLimitHm : 0);

  // Active Hovered Point Info
  const activeHoverPoint = hoveredPointIndex !== null ? trendData[hoveredPointIndex] : null;

  // Handle Chart Mouse Move for Hover Crosshairs
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = chartWidth / rect.width;
    const scaledMouseX = mouseX * scaleX;

    let closestIdx = 0;
    let minDistance = Infinity;

    trendData.forEach((_, idx) => {
      const ptX = getX(idx);
      const dist = Math.abs(scaledMouseX - ptX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setHoveredPointIndex(closestIdx);
  };

  // Export Trend Data as CSV
  const handleExportCsv = () => {
    const headers = [
      'Milestone',
      'Tanggal',
      'Actual HM',
      'Scheduled HM',
      'Projected HM',
      'Health %',
      'Event / Servis',
      'Catatan',
    ];
    const rows = trendData.map((p) => [
      p.dateLabel,
      p.fullDate,
      p.actualHm !== null ? p.actualHm : '',
      p.scheduledHm,
      p.projectedHm !== null ? p.projectedHm : '',
      p.healthPercent !== null ? `${p.healthPercent}%` : '',
      `"${(p.serviceName || '').replace(/"/g, '""')}"`,
      `"${(p.technicianNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MINEROZ_Trend_Degradasi_${activeComponent.id}_${activeComponent.unitId || unitCode}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl max-h-[94vh] bg-[#0c1017] border border-amber-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
          
          {/* 1. MODAL TOP HEADER */}
          <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#121824] via-[#10151f] to-[#0c1017] border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-tech text-sm sm:text-base font-bold text-white tracking-wider">
                    TREND DEGRADASI & JADWAL PREVENTIVE MAINTENANCE
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold hidden sm:inline">
                    INTERACTIVE SVG ENGINE
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  Monitoring Komparasi Jam Operasional Aktual (Actual HM) vs Rencana Pemeliharaan Berkala
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Component Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsComponentDropdownOpen(!isComponentDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-amber-300">
                    #{activeComponent.number.toString().padStart(2, '0')}
                  </span>
                  <span className="truncate max-w-[110px] sm:max-w-[180px]">
                    {activeComponent.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isComponentDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-72 max-h-64 overflow-y-auto bg-[#0d131d] border border-slate-700 rounded-lg shadow-2xl z-50 p-1 divide-y divide-slate-800/60 animate-in fade-in zoom-in-95">
                    {allComponents.map((c) => {
                      const isSelected = c.id === activeComponent.id;
                      const cStat = getComponentStatus(c, thresholds);
                      const cColor = getStatusColor(cStat);
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectComponent(c.id);
                            setIsComponentDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-xs hover:bg-slate-800/80 transition-colors ${
                            isSelected ? 'bg-amber-500/15 text-amber-300' : 'text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-[10px] text-amber-400 font-bold">
                              #{c.number.toString().padStart(2, '0')}
                            </span>
                            <span className="truncate">{c.name}</span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${cColor.bg} ${cColor.text}`}
                          >
                            {cStat}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Tutup (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. BODY CONTENT (SCROLLABLE) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Top KPI Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              {/* Card 1: Actual vs Target Lifetime */}
              <div className="bg-[#101520] p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Actual HM / Target
                </span>
                <div className="mt-1.5">
                  <div className="text-base font-bold text-amber-400">
                    {activeComponent.actualHm.toLocaleString()} <span className="text-xs text-slate-400 font-normal">HM</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>Target: {activeComponent.targetLifetimeHm.toLocaleString()} HM</span>
                    <span className={`font-bold ${statusColor.text}`}>{lifeUsedPct}%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Remaining Lifetime */}
              <div className="bg-[#101520] p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Sisa Umur (Remaining)
                </span>
                <div className="mt-1.5">
                  <div
                    className={`text-base font-bold ${
                      remainingHm <= 0 ? 'text-rose-400' : remainingHm < 3000 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {remainingHm.toLocaleString()} <span className="text-xs text-slate-400 font-normal">HM</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Est. {degradationRate.monthsToOverdue} Bulan pemakaian aktif
                  </div>
                </div>
              </div>

              {/* Card 3: Degradation Rate */}
              <div className="bg-[#101520] p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  Laju Keausan (Burn Rate)
                </span>
                <div className="mt-1.5">
                  <div className="text-base font-bold text-slate-200">
                    ~{degradationRate.avgMonthlyHm}{' '}
                    <span className="text-xs text-slate-400 font-normal">HM / Bulan</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    {lifeUsedPct >= 100 ? (
                      <span className="text-rose-400 font-semibold">Overdue Limit Reached</span>
                    ) : lifeUsedPct >= thresholds.warningPercent ? (
                      <span className="text-amber-400 font-semibold">Warning Phase Active</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Normal Degradation Pace</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: Next Scheduled PM */}
              <div className="bg-[#101520] p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                  Inspeksi / Servis Berikut
                </span>
                <div className="mt-1.5">
                  <div className="text-sm font-bold text-white truncate" title={activeComponent.nextInspectionDate}>
                    {activeComponent.nextInspectionDate}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Interval tiap {activeComponent.inspectionIntervalHm.toLocaleString()} HM
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Controls Bar */}
            <div className="bg-[#10141e] px-3.5 py-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Left: Metric Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-tech font-bold uppercase text-[11px]">
                  Tampilan Metrik:
                </span>
                <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-700">
                  <button
                    onClick={() => setViewMetric('HM')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      viewMetric === 'HM'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Akumulasi Jam (HM)
                  </button>
                  <button
                    onClick={() => setViewMetric('HEALTH')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      viewMetric === 'HEALTH'
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Indeks Kesehatan / Sisa (%)
                  </button>
                </div>
              </div>

              {/* Right: Horizon & Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 font-tech font-bold uppercase text-[11px]">
                  Rentang:
                </span>
                <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-700">
                  <button
                    onClick={() => setTimeHorizon('HISTORICAL_ONLY')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      timeHorizon === 'HISTORICAL_ONLY'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Historis Saja
                  </button>
                  <button
                    onClick={() => setTimeHorizon('FORECAST')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      timeHorizon === 'FORECAST'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    + Proyeksi 6 Bulan
                  </button>
                  <button
                    onClick={() => setTimeHorizon('FULL_LIFECYCLE')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      timeHorizon === 'FULL_LIFECYCLE'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Siklus Penuh
                  </button>
                </div>

                {/* Export CSV button */}
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium transition-colors"
                  title="Unduh data trend dalam format CSV"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unduh CSV</span>
                </button>
              </div>
            </div>

            {/* 3. ROCK-SOLID INTERACTIVE SVG CHART */}
            <div className="bg-[#0b0e14] p-4 rounded-xl border border-slate-800 shadow-inner relative select-none" ref={svgContainerRef}>
              
              {/* Legend & Threshold Badges */}
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono flex-wrap gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Actual HM Toggle */}
                  <button
                    onClick={() => setShowActualLine(!showActualLine)}
                    className={`flex items-center gap-1.5 transition-opacity ${showActualLine ? 'opacity-100' : 'opacity-40'}`}
                    title="Klik untuk tampilkan/sembunyikan garis aktual"
                  >
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-xs" />
                    <span className="text-slate-200 font-sans font-medium text-[11px] sm:text-xs">
                      Actual HM (Aktual)
                    </span>
                  </button>

                  {/* Scheduled Plan Toggle */}
                  <button
                    onClick={() => setShowScheduledLine(!showScheduledLine)}
                    className={`flex items-center gap-1.5 transition-opacity ${showScheduledLine ? 'opacity-100' : 'opacity-40'}`}
                    title="Klik untuk tampilkan/sembunyikan rencana servis"
                  >
                    <span className="w-3.5 h-0.5 border-t-2 border-dashed border-cyan-400 inline-block" />
                    <span className="text-slate-200 font-sans font-medium text-[11px] sm:text-xs">
                      Rencana PM (Scheduled Plan)
                    </span>
                  </button>

                  {/* Future Projection Toggle */}
                  {timeHorizon !== 'HISTORICAL_ONLY' && (
                    <button
                      onClick={() => setShowProjectedLine(!showProjectedLine)}
                      className={`flex items-center gap-1.5 transition-opacity ${showProjectedLine ? 'opacity-100' : 'opacity-40'}`}
                      title="Klik untuk tampilkan/sembunyikan garis proyeksi"
                    >
                      <span className="w-3.5 h-0.5 border-t-2 border-dotted border-orange-400 inline-block" />
                      <span className="text-slate-200 font-sans font-medium text-[11px] sm:text-xs">
                        Proyeksi HM (Forecast)
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-amber-400 font-mono">
                    Warning: {thresholds.warningPercent}% ({warningLimitHm.toLocaleString()} HM)
                  </span>
                  <span>•</span>
                  <span className="text-rose-400 font-mono">
                    Target Limit: {thresholds.overduePercent}% ({overdueLimitHm.toLocaleString()} HM)
                  </span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="relative w-full overflow-hidden rounded-lg bg-[#080b10] border border-slate-900">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-72 sm:h-88 cursor-crosshair"
                  onMouseMove={handleSvgMouseMove}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                >
                  <defs>
                    {/* Amber Gradient Area for Actual HM */}
                    <linearGradient id="amberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Cyan Gradient for Scheduled */}
                    <linearGradient id="cyanLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>

                    {/* Filter Glow */}
                    <filter id="glowYellow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.6" />
                    </filter>
                  </defs>

                  {/* Horizontal Grid Lines & Y-Axis Labels */}
                  {yTicks.map((val) => {
                    const y = getY(val);
                    return (
                      <g key={val}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 4}
                          fill="#64748b"
                          fontSize="10"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {viewMetric === 'HM' ? `${(val / 1000).toFixed(0)}k HM` : `${val}%`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Threshold Reference Lines */}
                  {/* Warning Line (80%) */}
                  <g>
                    <line
                      x1={padding.left}
                      y1={warningY}
                      x2={chartWidth - padding.right}
                      y2={warningY}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth="1.2"
                      opacity="0.85"
                    />
                    <text
                      x={chartWidth - padding.right - 5}
                      y={warningY - 5}
                      fill="#f59e0b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                      fontWeight="bold"
                    >
                      Batas Warning ({thresholds.warningPercent}%)
                    </text>
                  </g>

                  {/* Overdue / Target Line (100%) */}
                  <g>
                    <line
                      x1={padding.left}
                      y1={overdueY}
                      x2={chartWidth - padding.right}
                      y2={overdueY}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      strokeWidth="1.2"
                      opacity="0.9"
                    />
                    <text
                      x={chartWidth - padding.right - 5}
                      y={overdueY - 5}
                      fill="#ef4444"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                      fontWeight="bold"
                    >
                      Target Limit ({thresholds.overduePercent}%)
                    </text>
                  </g>

                  {/* X-Axis Vertical Guide Lines & Labels */}
                  {trendData.map((pt, idx) => {
                    const x = getX(idx);
                    const isHovered = hoveredPointIndex === idx;
                    return (
                      <g key={pt.id}>
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={padding.top + plotHeight}
                          stroke={isHovered ? '#3b82f6' : '#1e293b'}
                          strokeWidth={isHovered ? '1.5' : '1'}
                          strokeDasharray={isHovered ? 'none' : '2 4'}
                        />
                        <text
                          x={x}
                          y={padding.top + plotHeight + 16}
                          fill={isHovered ? '#f59e0b' : '#64748b'}
                          fontSize="9.5"
                          fontFamily="monospace"
                          textAnchor="middle"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                        >
                          {pt.dateLabel.split(' ')[0]}
                        </text>
                        <text
                          x={x}
                          y={padding.top + plotHeight + 28}
                          fill={isHovered ? '#cbd5e1' : '#475569'}
                          fontSize="8.5"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {pt.dateLabel.split(' ')[1] || ''}
                        </text>
                      </g>
                    );
                  })}

                  {/* 1. Actual HM Area Under Curve */}
                  {showActualLine && actualAreaPath && (
                    <path d={actualAreaPath} fill="url(#amberAreaGrad)" />
                  )}

                  {/* 2. Scheduled Maintenance Plan Line (Cyan Dashed) */}
                  {showScheduledLine && scheduledPath && (
                    <path
                      d={scheduledPath}
                      fill="none"
                      stroke="url(#cyanLineGrad)"
                      strokeWidth="2"
                      strokeDasharray="5 5"
                    />
                  )}

                  {/* 3. Future Forecast Projection (Orange Dotted) */}
                  {showProjectedLine && projectedPath && timeHorizon !== 'HISTORICAL_ONLY' && (
                    <path
                      d={projectedPath}
                      fill="none"
                      stroke="#fb923c"
                      strokeWidth="2.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* 4. Actual Operating HM Line (Amber Solid) */}
                  {showActualLine && actualPath && (
                    <path
                      d={actualPath}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Scheduled Dots */}
                  {showScheduledLine &&
                    trendData.map((pt, idx) => {
                      const x = getX(idx);
                      const val = viewMetric === 'HM' ? pt.scheduledHm : pt.healthPercent || 0;
                      const y = getY(val);
                      return (
                        <circle
                          key={`sched-${pt.id}`}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#06b6d4"
                          stroke="#080b10"
                          strokeWidth="1.5"
                        />
                      );
                    })}

                  {/* Actual Checkpoint Dots */}
                  {showActualLine &&
                    actualCoordinates.map((c) => {
                      const isHovered = hoveredPointIndex === c.index;
                      return (
                        <g key={`act-${c.point.id}`}>
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={isHovered ? 7 : 4.5}
                            fill="#f59e0b"
                            stroke="#0b0e14"
                            strokeWidth="2"
                            filter={isHovered ? 'url(#glowYellow)' : undefined}
                            className="transition-all duration-150"
                          />
                          {isHovered && (
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r="11"
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth="1.5"
                              opacity="0.8"
                            />
                          )}
                        </g>
                      );
                    })}

                  {/* Projected Dots */}
                  {showProjectedLine &&
                    timeHorizon !== 'HISTORICAL_ONLY' &&
                    trendData
                      .filter((p) => p.eventType === 'future_pm')
                      .map((pt) => {
                        const origIdx = trendData.indexOf(pt);
                        const x = getX(origIdx);
                        const val = viewMetric === 'HM' ? pt.projectedHm! : pt.healthPercent || 0;
                        const y = getY(val);
                        return (
                          <circle
                            key={`proj-${pt.id}`}
                            cx={x}
                            cy={y}
                            r="3.5"
                            fill="#fb923c"
                            stroke="#080b10"
                            strokeWidth="1.5"
                          />
                        );
                      })}

                  {/* Interactive Cursor Line on Hover */}
                  {hoveredPointIndex !== null && (
                    <line
                      x1={getX(hoveredPointIndex)}
                      y1={padding.top}
                      x2={getX(hoveredPointIndex)}
                      y2={padding.top + plotHeight}
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}
                </svg>

                {/* Floating Interactive Tooltip */}
                {activeHoverPoint && hoveredPointIndex !== null && (
                  <div
                    className="absolute pointer-events-none z-30 transition-all duration-75 ease-out"
                    style={{
                      left: `${Math.min(
                        72,
                        Math.max(12, (hoveredPointIndex / (trendData.length - 1)) * 100)
                      )}%`,
                      top: '12px',
                      transform:
                        hoveredPointIndex > trendData.length / 2
                          ? 'translateX(-95%)'
                          : 'translateX(5%)',
                    }}
                  >
                    <div className="bg-[#0b0e14]/95 border border-amber-500/60 p-3 rounded-xl shadow-2xl text-xs max-w-xs backdrop-blur-md font-sans">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                        <span className="font-bold text-amber-400 font-tech tracking-wide text-xs">
                          {activeHoverPoint.dateLabel}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {activeHoverPoint.eventType.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1 font-mono text-slate-200 text-[11px]">
                        {activeHoverPoint.actualHm !== null && (
                          <div className="flex justify-between items-center text-amber-400">
                            <span>Actual HM:</span>
                            <span className="font-bold">{activeHoverPoint.actualHm.toLocaleString()} HM</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-cyan-300">
                          <span>Rencana PM:</span>
                          <span>{activeHoverPoint.scheduledHm.toLocaleString()} HM</span>
                        </div>

                        {activeHoverPoint.projectedHm !== null && (
                          <div className="flex justify-between items-center text-orange-400">
                            <span>Proyeksi HM:</span>
                            <span className="font-bold">{activeHoverPoint.projectedHm.toLocaleString()} HM</span>
                          </div>
                        )}

                        {activeHoverPoint.variance !== undefined && (
                          <div className="flex justify-between items-center text-slate-400 pt-0.5 border-t border-slate-800/80">
                            <span>Variansi:</span>
                            <span
                              className={
                                activeHoverPoint.variance > 0
                                  ? 'text-rose-400 font-semibold'
                                  : 'text-emerald-400'
                              }
                            >
                              {activeHoverPoint.variance > 0 ? `+${activeHoverPoint.variance.toLocaleString()}` : activeHoverPoint.variance.toLocaleString()} HM
                            </span>
                          </div>
                        )}

                        {activeHoverPoint.healthPercent !== null && (
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Kesehatan:</span>
                            <span className="font-bold">{activeHoverPoint.healthPercent}% Sisa</span>
                          </div>
                        )}
                      </div>

                      {activeHoverPoint.serviceName && (
                        <div className="mt-2 pt-2 border-t border-slate-800 text-slate-300">
                          <span className="text-[10px] text-slate-500 block uppercase font-tech">
                            Tindakan / Event:
                          </span>
                          <span className="font-semibold text-slate-200 text-[11px]">
                            {activeHoverPoint.serviceName}
                          </span>
                        </div>
                      )}

                      {activeHoverPoint.technicianNotes && (
                        <p className="mt-1 text-[10px] text-slate-400 italic line-clamp-3">
                          "{activeHoverPoint.technicianNotes}"
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. HISTORICAL DEGRADATION & MAINTENANCE CHECKPOINTS TABLE */}
            <div className="bg-[#10141e] rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span className="font-tech text-xs font-bold text-white tracking-wider">
                    RIWAYAT SERVIS BERKALA & LOG DEGRADASI KOMPONEN
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Total Checkpoint: {trendData.length} Titik
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#0b0e14] text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal / Titik</th>
                      <th className="py-2.5 px-3">Event / Tipe Servis</th>
                      <th className="py-2.5 px-3 text-right">Actual HM</th>
                      <th className="py-2.5 px-3 text-right">Rencana PM</th>
                      <th className="py-2.5 px-3 text-right">Variansi</th>
                      <th className="py-2.5 px-3 text-center">Status Kondisi</th>
                      <th className="py-2.5 px-3">Catatan Lapangan & Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {trendData.map((pt, idx) => {
                      const isCurrent = pt.eventType === 'current';
                      const isFuture = pt.eventType === 'future_pm';
                      const isHovered = hoveredPointIndex === idx;
                      return (
                        <tr
                          key={pt.id}
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                            isHovered
                              ? 'bg-amber-500/15'
                              : isCurrent
                              ? 'bg-amber-500/10 font-semibold'
                              : isFuture
                              ? 'bg-slate-900/30 text-slate-400'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="text-white font-medium">{pt.dateLabel}</div>
                            <div className="text-[10px] text-slate-500 font-sans">{pt.fullDate}</div>
                          </td>

                          <td className="py-2 px-3 font-sans">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                pt.eventType === 'install'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : pt.eventType === 'current'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : pt.eventType === 'future_pm'
                                  ? 'bg-purple-500/15 text-purple-300'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {pt.serviceName}
                            </span>
                          </td>

                          <td className="py-2 px-3 text-right font-bold text-amber-400 whitespace-nowrap">
                            {pt.actualHm !== null ? `${pt.actualHm.toLocaleString()} HM` : '-'}
                          </td>

                          <td className="py-2 px-3 text-right text-cyan-400 whitespace-nowrap">
                            {pt.scheduledHm.toLocaleString()} HM
                          </td>

                          <td
                            className={`py-2 px-3 text-right whitespace-nowrap ${
                              (pt.variance || 0) > 0
                                ? 'text-rose-400 font-bold'
                                : 'text-emerald-400'
                            }`}
                          >
                            {pt.variance !== undefined
                              ? `${pt.variance > 0 ? '+' : ''}${pt.variance.toLocaleString()} HM`
                              : '-'}
                          </td>

                          <td className="py-2 px-3 text-center whitespace-nowrap font-sans">
                            {pt.healthPercent !== null && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  pt.healthPercent >= 70
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : pt.healthPercent >= 30
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {pt.healthPercent}% Sisa
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-3 text-slate-300 font-sans max-w-xs truncate" title={pt.technicianNotes}>
                            {pt.technicianNotes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 5. MODAL FOOTER */}
          <div className="px-4 sm:px-6 py-3 bg-[#0a0d13] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">
                Standar Degradasi: Analisis regresi linier berdasarkan siklus hauling batubara Hino 500 FM 260 JD.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCsv}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Ekspor CSV</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold tracking-wide transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>

        </div>
      </div>
  );
};

export const DegradationTrendModal: React.FC<DegradationTrendModalProps> = ({
  isOpen,
  onClose,
  selectedComponent,
  allComponents,
  onSelectComponent,
  thresholds,
  unitCode = 'DT-088',
}) => {
  if (!isOpen) return null;

  const activeComponent =
    selectedComponent ||
    (allComponents && allComponents.length > 0 ? allComponents[0] : null);

  if (!activeComponent) return null;

  return (
    <ErrorBoundary fallbackTitle="Terjadi Kendala pada Modal Trend HM">
      <DegradationTrendContent
        onClose={onClose}
        activeComponent={activeComponent}
        allComponents={allComponents}
        onSelectComponent={onSelectComponent}
        thresholds={thresholds}
        unitCode={unitCode}
      />
    </ErrorBoundary>
  );
};

