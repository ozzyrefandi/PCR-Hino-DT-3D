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
import { Truck, CheckCircle2, Shield, Wrench } from 'lucide-react';

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

      {/* 4. INDUSTRIAL TECHNICAL FOOTER */}
      <footer className="relative z-10 bg-[#080a0e] border-t border-slate-800/90 px-3 lg:px-6 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-tech">
        {/* Left Tagline */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 glow-yellow-sm" />
          <span className="text-amber-400 font-bold tracking-wider">MINEROZ</span>
          <span className="text-slate-600">|</span>
          <span className="tracking-widest text-slate-300">
            RIGHT COMPONENT • RIGHT TIME • RIGHT COST
          </span>
        </div>

        {/* Center Pillars */}
        <div className="hidden lg:flex items-center gap-4 text-[10px] text-slate-400 tracking-wider">
          <span>PLAN LEBIH TEPAT</span>
          <span>•</span>
          <span>MONITOR LEBIH MUDAH</span>
          <span>•</span>
          <span>MAINTENANCE LEBIH EFISIEN</span>
          <span>•</span>
          <span>PRODUCTION LEBIH MAKSIMAL</span>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-3 text-[10px] font-code text-slate-400">
          <span className="hidden sm:inline">DATA STORAGE: BROWSER LOCAL</span>
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
    </div>
  );
}
