export type ComponentCriticality = 'Critical' | 'High Cost' | 'Wear';

export type ComponentCondition = 'Optimal' | 'Fair' | 'Attention' | 'Critical';

export type ComponentStatus = 'NORMAL' | 'WARNING' | 'OVERDUE' | 'NOT_AVAILABLE';

export type ViewMode = 'COMPLETE' | 'XRAY' | 'EXPLODED' | 'INSPECTION';

export type CameraPreset = 'ISOMETRIC' | 'FRONT' | 'SIDE' | 'TOP' | 'REAR';

export type SystemCategory =
  | 'Engine & Turbocharger'
  | 'Powertrain & Transmission'
  | 'Axle & Differential'
  | 'Cooling System'
  | 'Fuel System'
  | 'Exhaust System'
  | 'Brake System'
  | 'Steering System'
  | 'Suspension & Chassis'
  | 'Dump Body & Hoist'
  | 'Tyres & Wheels'
  | 'Electrical System'
  | 'Cabin & Interior';

export type ServiceType =
  | 'Periodic Maintenance (PM)'
  | 'Oil Sampling (SOS)'
  | 'Component Replacement'
  | 'Overhaul / Rebuild'
  | 'Calibration & Adjustment'
  | 'Greasing & Torque Check'
  | 'Corrective Repair';

export interface MaintenanceRecord {
  id: string;
  componentId: string;
  date: string;
  serviceType: ServiceType;
  hmAtService: number;
  technician: string;
  technicianNotes: string;
  workOrderNo?: string;
  replacedParts?: string[];
  statusOutcome: 'Completed' | 'Monitor Next Shift' | 'Follow-up Required';
}

export interface HinoComponent {
  id: string;
  number: number;
  name: string;
  nameId: string; // Indonesian title
  systemCategory: SystemCategory;
  subComponents: string[];
  unitId: string;
  serialNumber: string;
  installHm: number;
  actualHm: number;
  targetLifetimeHm: number;
  criticality: ComponentCriticality;
  condition: ComponentCondition;
  lastReplacementDate: string;
  nextInspectionDate: string;
  inspectionIntervalHm: number;
  recommendedAction: string;
  maintenanceNotes: string;
  typicalLifeRange: string;
  meshGroupKeys: string[]; // keys corresponding to 3D meshes
  explodedOffset: [number, number, number]; // [x, y, z] direction offset for exploded view
  isCustomModelAvailable?: boolean;
  maintenanceHistory?: MaintenanceRecord[];
}

export interface LifetimeThresholds {
  warningPercent: number; // default 80%
  overduePercent: number; // default 100%
}

export type UnitOperationalStatus = 'OPERATIONAL' | 'BREAKDOWN' | 'STANDBY' | 'MAINTENANCE';

export interface DumpTruckUnit {
  id: string; // e.g. "DT-088"
  unitCode: string; // e.g. "DT-088"
  model: string; // e.g. "Hino 500 FM 260 JD (6x4 Mining Dump)"
  vinSerial: string; // e.g. "MHKFM8JNK-08801"
  siteLocation: string; // e.g. "Pit Mahakam - Block A"
  status: UnitOperationalStatus;
  currentTotalHm: number; // e.g. 14250
  driverOrTechnician?: string;
  year?: number;
  notes?: string;
  components: HinoComponent[];
}

export interface ComponentFilter {
  searchQuery: string;
  category: string;
  criticality: 'ALL' | ComponentCriticality;
  status: 'ALL' | ComponentStatus;
}

