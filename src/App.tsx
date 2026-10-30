import React, { useState, useCallback, useEffect } from 'react';
import {
  HinoComponent,
  ViewMode,
  CameraPreset,
  ComponentStatus,
  LifetimeThresholds,
  MaintenanceRecord,
  DumpTruckUnit,
} from './types';
import {
  loadStoredThresholds,
  saveStoredThresholds,
  DEFAULT_THRESHOLDS,
  addMaintenanceRecordToComponent,
  deleteMaintenanceRecordFromComponent,
} from './data/hinoComponentsData';
import {
  loadStoredFleet,
  saveStoredFleet,
  loadStoredActiveUnitId,
  saveStoredActiveUnitId,
} from './data/fleetUnitsData';
import { HinoViewer } from './components/3d/HinoViewer';
import { Header } from './components/ui/Header';
import { KPIDashboard } from './components/ui/KPIDashboard';
import { ComponentTreePanel } from './components/ui/ComponentTreePanel';
import { ComponentDetailPanel } from './components/ui/ComponentDetailPanel';
import { ControlDock } from './components/ui/ControlDock';
import { ReferencePosterModal } from './components/ui/ReferencePosterModal';
import { ModelUploadModal } from './components/ui/ModelUploadModal';
import { ThresholdSettingsModal } from './components/ui/ThresholdSettingsModal';
import { DataImportExportModal } from './components/ui/DataImportExportModal';
import { FleetManagerModal } from './components/ui/FleetManagerModal';
import { DegradationTrendModal } from './components/ui/DegradationTrendModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Truck, CheckCircle2, Shield, Wrench, Linkedin, Youtube, Link, Coffee, ExternalLink } from 'lucide-react';

export default function App() {
  // Fleet & Multi-Unit State (10 Dump Truck Units)
  const [fleet, setFleet] = useState<DumpTruckUnit[]>(() => loadStoredFleet());
  const [activeUnitId, setActiveUnitId] = useState<string>(() => {
    const initialFleet = loadStoredFleet();
    return loadStoredActiveUnitId(initialFleet);
  });

  // Active Unit and its Components
  const activeUnit = React.useMemo(() => {
    return fleet.find((u) => u.id === activeUnitId) || fleet[0] || null;
  }, [fleet, activeUnitId]);

  const components = React.useMemo(() => {
    return activeUnit?.components || [];
  }, [activeUnit]);

  // Lifetime Thresholds
  const [thresholds, setThresholds] = useState<LifetimeThresholds>(() => loadStoredThresholds());
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>('engine-assy');

  // 3D View State
  const [viewMode, setViewMode] = useState<ViewMode>('COMPLETE');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('ISOMETRIC');
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [isTipping, setIsTipping] = useState<boolean>(false);

  // Layout & Navigation State
  const [isTreePanelOpen, setIsTreePanelOpen] = useState<boolean>(() => window.innerWidth > 1024);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ComponentStatus>('ALL');

  // Custom Model State
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [detectedMeshNames, setDetectedMeshNames] = useState<string[]>([]);

  // Modals
  const [isPosterModalOpen, setIsPosterModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState<boolean>(false);
  const [isTrendModalOpen, setIsTrendModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Active Selected Component Object
  const selectedComponent = React.useMemo(() => {
    if (!selectedComponentId) return null;
    return components.find((c) => c.id === selectedComponentId) || null;
  }, [components, selectedComponentId]);

  // Select Active Unit
  const handleSelectActiveUnit = useCallback((unitId: string) => {
    setActiveUnitId(unitId);
    saveStoredActiveUnitId(unitId);
  }, []);

  // Update Fleet state and persist
  const handleUpdateFleet = useCallback((newFleet: DumpTruckUnit[]) => {
    setFleet(newFleet);
    saveStoredFleet(newFleet);
  }, []);

  // Add new unit to fleet
  const handleAddUnit = useCallback((newUnit: DumpTruckUnit) => {
    setFleet((prev) => {
      const updated = [newUnit, ...prev];
      saveStoredFleet(updated);
      return updated;
    });
    setActiveUnitId(newUnit.id);
    saveStoredActiveUnitId(newUnit.id);
  }, []);

  // Edit existing unit metadata
  const handleEditUnit = useCallback((updatedUnit: DumpTruckUnit) => {
    setFleet((prev) => {
      const updated = prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
      saveStoredFleet(updated);
      return updated;
    });
  }, []);

  // Delete unit from fleet
  const handleDeleteUnit = useCallback((unitId: string) => {
    setFleet((prev) => {
      const updated = prev.filter((u) => u.id !== unitId);
      saveStoredFleet(updated);
      return updated;
    });
    setActiveUnitId((prevId) => {
      if (prevId === unitId) {
        const remaining = fleet.filter((u) => u.id !== unitId);
        const nextId = remaining[0]?.id || 'DT-088';
        saveStoredActiveUnitId(nextId);
        return nextId;
      }
      return prevId;
    });
  }, [fleet]);

  // Persist component updates for active unit
  const handleUpdateComponents = useCallback(
    (newComponents: HinoComponent[]) => {
      setFleet((prev) => {
        const updated = prev.map((u) => {
          if (u.id === activeUnitId) {
            return { ...u, components: newComponents };
          }
          return u;
        });
        saveStoredFleet(updated);
        return updated;
      });
    },
    [activeUnitId]
  );

  // Update single component HM in active unit
  const handleUpdateComponentHm = useCallback(
    (componentId: string, newActualHm: number) => {
      setFleet((prev) => {
        const updated = prev.map((u) => {
          if (u.id === activeUnitId) {
            const updatedComps = u.components.map((c) =>
              c.id === componentId ? { ...c, actualHm: newActualHm } : c
            );
            return { ...u, components: updatedComps };
          }
          return u;
        });
        saveStoredFleet(updated);
        return updated;
      });
    },
    [activeUnitId]
  );

  // Persist threshold updates
  const handleSaveThresholds = useCallback((newThresholds: LifetimeThresholds) => {
    setThresholds(newThresholds);
    saveStoredThresholds(newThresholds);
  }, []);

  // Add maintenance record to component of active unit
  const handleAddMaintenanceRecord = useCallback(
    (componentId: string, record: Omit<MaintenanceRecord, 'id' | 'componentId'>) => {
      setFleet((prev) => {
        const updated = prev.map((u) => {
          if (u.id === activeUnitId) {
            const updatedComps = addMaintenanceRecordToComponent(u.components, componentId, record);
            return { ...u, components: updatedComps };
          }
          return u;
        });
        saveStoredFleet(updated);
        return updated;
      });
    },
    [activeUnitId]
  );

  // Delete maintenance record from component of active unit
  const handleDeleteMaintenanceRecord = useCallback(
    (componentId: string, recordId: string) => {
      setFleet((prev) => {
        const updated = prev.map((u) => {
          if (u.id === activeUnitId) {
            const updatedComps = deleteMaintenanceRecordFromComponent(
              u.components,
              componentId,
              recordId
            );
            return { ...u, components: updatedComps };
          }
          return u;
        });
        saveStoredFleet(updated);
        return updated;
      });
    },
    [activeUnitId]
  );

  // Fullscreen Handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Reset Camera Helper
  const handleResetCamera = () => {
    setCameraPreset('ISOMETRIC');
  };


  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0c10] text-slate-100 flex flex-col select-none">
      {/* 1. TOP HEADER */}
      <Header
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenPosterModal={() => setIsPosterModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
        onOpenTrendModal={() => {
          if (!selectedComponentId && components.length > 0) {
            setSelectedComponentId(components[0].id);
          }
          setIsTrendModalOpen(true);
        }}
        fleet={fleet}
        activeUnitId={activeUnitId}
        onSelectActiveUnit={handleSelectActiveUnit}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* 2. KPI STATUS DASHBOARD */}
      <KPIDashboard
        components={components}
        thresholds={thresholds}
        activeStatusFilter={statusFilter}
        onSelectStatusFilter={setStatusFilter}
        activeUnit={activeUnit}
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
      />

      {/* 3. MAIN INTERACTIVE 3D VIEWPORT */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* 3D Three.js WebGL Canvas */}
        <HinoViewer
          selectedComponent={selectedComponent}
          onSelectComponent={setSelectedComponentId}
          viewMode={viewMode}
          cameraPreset={cameraPreset}
          explodedProgress={explodedProgress}
          isTipping={isTipping}
          components={components}
          customModelFile={customModelFile}
          onModelLoaded={(names) => setDetectedMeshNames(names)}
        />

        {/* Left Side: Component Tree Hierarchy Panel */}
        <ComponentTreePanel
          components={components}
          selectedComponent={selectedComponent}
          onSelectComponent={(id) => {
            setSelectedComponentId(id);
            // If on mobile, auto-close left panel to view 3D
            if (window.innerWidth < 1024) {
              setIsTreePanelOpen(false);
            }
          }}
          thresholds={thresholds}
          statusFilter={statusFilter}
          onSetStatusFilter={setStatusFilter}
          isOpen={isTreePanelOpen}
          onToggleOpen={() => setIsTreePanelOpen(!isTreePanelOpen)}
        />

        {/* Right Side: Component Detail Sheet */}
        {selectedComponent && (
          <ComponentDetailPanel
            component={selectedComponent}
            onClose={() => setSelectedComponentId(null)}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            thresholds={thresholds}
            onUpdateComponentHm={handleUpdateComponentHm}
            onAddMaintenanceRecord={handleAddMaintenanceRecord}
            onDeleteMaintenanceRecord={handleDeleteMaintenanceRecord}
            onOpenTrendModal={(compId) => {
              setSelectedComponentId(compId);
              setIsTrendModalOpen(true);
            }}
          />
        )}

        {/* Bottom Collapsible Dock */}
        <ControlDock
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          cameraPreset={cameraPreset}
          onSetCameraPreset={setCameraPreset}
          explodedProgress={explodedProgress}
          onSetExplodedProgress={setExplodedProgress}
          isTipping={isTipping}
          onToggleTipping={() => setIsTipping(!isTipping)}
          onResetCamera={handleResetCamera}
        />
      </main>

      {/* 4. INDUSTRIAL TECHNICAL FOOTER WITH SOCIAL LINKS */}
      <footer className="relative z-10 bg-[#080a0e] border-t border-slate-800/90 px-3 lg:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-slate-400 font-tech">
        {/* Left Tagline */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 glow-yellow-sm" />
          <span className="text-amber-400 font-bold tracking-wider">MINEROZ</span>
          <span className="text-slate-600">|</span>
          <span className="tracking-widest text-slate-300 hidden sm:inline">
            RIGHT COMPONENT • RIGHT TIME • RIGHT COST
          </span>
        </div>

        {/* Center / Social & Community Links */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/ozzy-refandi-420b2787/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d131f] hover:bg-[#0a66c2]/20 border border-slate-700/80 hover:border-[#0a66c2]/80 text-slate-300 hover:text-white transition-all text-[11px] font-medium tracking-wide shadow-xs"
            title="Kunjungi LinkedIn Ozzy Refandi"
          >
            <Linkedin className="w-3.5 h-3.5 text-[#0a66c2] group-hover:scale-110 transition-transform" />
            <span className="font-sans font-semibold">LinkedIn</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-500 opacity-60 group-hover:opacity-100" />
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/@ozzyrefandi"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#160d0e] hover:bg-[#ff0000]/20 border border-slate-700/80 hover:border-[#ff0000]/80 text-slate-300 hover:text-white transition-all text-[11px] font-medium tracking-wide shadow-xs"
            title="Kunjungi YouTube Channel @ozzyrefandi"
          >
            <Youtube className="w-3.5 h-3.5 text-[#ff0000] group-hover:scale-110 transition-transform" />
            <span className="font-sans font-semibold">YouTube</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-500 opacity-60 group-hover:opacity-100" />
          </a>

          {/* Lynk.id */}
          <a
            href="https://lynk.id/ozzyrefandi"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d161a] hover:bg-cyan-500/20 border border-slate-700/80 hover:border-cyan-500/80 text-slate-300 hover:text-cyan-200 transition-all text-[11px] font-medium tracking-wide shadow-xs"
            title="Kunjungi Lynk.id/ozzyrefandi"
          >
            <Link className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-sans font-semibold">Lynk</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-500 opacity-60 group-hover:opacity-100" />
          </a>

          {/* Traktiran Kopi */}
          <a
            href="https://clicky.id/ozzyrefandi/traktiran-kopi"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/60 hover:border-amber-400 text-amber-300 hover:text-amber-200 transition-all text-[11px] font-bold tracking-wide shadow-sm shadow-amber-950/40"
            title="Traktiran Kopi - Dukung Kreator di clicky.id"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="font-sans">Traktiran Kopi</span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1 rounded text-xs ml-0.5">☕</span>
          </a>
        </div>

        {/* Right Status */}
        <div className="hidden xl:flex items-center gap-3 text-[10px] font-code text-slate-400">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            STANDAR OPERASIONAL TAMBANG
          </span>
        </div>
      </footer>

      {/* MODALS */}
      <ReferencePosterModal
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
      />

      <ModelUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={(file) => {
          setCustomModelFile(file);
          setSelectedComponentId(null);
        }}
        onResetToProcedural={() => {
          setCustomModelFile(null);
          setDetectedMeshNames([]);
        }}
        isCustomModelActive={!!customModelFile}
        detectedMeshNames={detectedMeshNames}
      />

      <ThresholdSettingsModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholds={thresholds}
        onSaveThresholds={handleSaveThresholds}
      />

      <FleetManagerModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        fleet={fleet}
        activeUnitId={activeUnitId}
        onSelectActiveUnit={handleSelectActiveUnit}
        onUpdateFleet={handleUpdateFleet}
        onAddUnit={handleAddUnit}
        onEditUnit={handleEditUnit}
        onDeleteUnit={handleDeleteUnit}
      />

      <DataImportExportModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        components={components}
        onUpdateComponents={handleUpdateComponents}
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
      />

      {/* Degradation Trend Modal */}
      {isTrendModalOpen && (
        <DegradationTrendModal
          isOpen={isTrendModalOpen}
          onClose={() => setIsTrendModalOpen(false)}
          selectedComponent={selectedComponent}
          allComponents={components}
          onSelectComponent={(compId) => setSelectedComponentId(compId)}
          thresholds={thresholds}
          unitCode={activeUnit?.unitCode || 'DT-088'}
        />
      )}
    </div>
  );
}
