import { DumpTruckUnit, HinoComponent, UnitOperationalStatus } from '../types';
import { INITIAL_HINO_COMPONENTS } from './hinoComponentsData';

export const STORAGE_KEY_FLEET = 'mineroz_hino500_fleet_v2';
export const STORAGE_KEY_ACTIVE_UNIT = 'mineroz_hino500_active_unit_v2';

/**
 * Helper to clone standard 19 Hino components for a given unit with scaled HM
 */
export function createDefaultComponentsForUnit(
  unitCode: string,
  baseHm: number = 12000
): HinoComponent[] {
  return INITIAL_HINO_COMPONENTS.map((comp) => {
    // Scale HM proportionally with minor realistic variation per component
    const ratio = Math.max(0.15, Math.min(1.2, baseHm / 14000));
    let customActualHm = Math.round(comp.actualHm * ratio);
    
    // Ensure actualHm does not exceed target unless unit has very high HM
    if (baseHm < 10000 && customActualHm > comp.targetLifetimeHm * 0.8) {
      customActualHm = Math.round(comp.targetLifetimeHm * 0.45);
    }

    return {
      ...comp,
      unitId: unitCode,
      serialNumber: `${comp.id.slice(0, 3).toUpperCase()}-${unitCode}-${Math.floor(1000 + Math.random() * 9000)}`,
      actualHm: customActualHm,
      // Fresh copy of maintenance history with matching unit
      maintenanceHistory: comp.maintenanceHistory?.map((h) => ({
        ...h,
        id: `${h.id}-${unitCode}`,
      })),
    };
  });
}

// 10 Initial Dump Truck Units for Mining Fleet
export const INITIAL_10_UNITS: DumpTruckUnit[] = [
  {
    id: 'DT-088',
    unitCode: 'DT-088',
    model: 'Hino 500 FM 260 JD (6x4 Mining Dump)',
    vinSerial: 'MHKFM8JNK-08801',
    siteLocation: 'Pit Mahakam - Block A',
    status: 'OPERATIONAL',
    currentTotalHm: 14250,
    driverOrTechnician: 'Agus Santoso / Budi P.',
    year: 2022,
    notes: 'Hauling batubara rute Pit ke ROM-1. Unit operasional utama, performa mesin optimal.',
    components: INITIAL_HINO_COMPONENTS.map((c) => ({ ...c, unitId: 'DT-088' })),
  },
  {
    id: 'DT-089',
    unitCode: 'DT-089',
    model: 'Hino 500 FM 260 JD (6x4 Heavy Duty)',
    vinSerial: 'MHKFM8JNK-08902',
    siteLocation: 'Pit Mahakam - Block B',
    status: 'OPERATIONAL',
    currentTotalHm: 8450,
    driverOrTechnician: 'Hendra Wijaya / Fajar N.',
    year: 2023,
    notes: 'Unit armada baru. Baru saja selesai PM-500. Kondisi suspensi dan powertrain sangat prima.',
    components: createDefaultComponentsForUnit('DT-089', 8450),
  },
  {
    id: 'DT-090',
    unitCode: 'DT-090',
    model: 'Hino 500 FM 280 TI (6x4 High Roof)',
    vinSerial: 'MHKFM8JNK-09003',
    siteLocation: 'Workshop Bay 1',
    status: 'MAINTENANCE',
    currentTotalHm: 18920,
    driverOrTechnician: 'Rudi Hartono / Bambang S.',
    year: 2021,
    notes: 'Sedang dalam jadwal penggantian kampas rem (brake lining) dan clutch booster pack.',
    components: createDefaultComponentsForUnit('DT-090', 18920),
  },
  {
    id: 'DT-091',
    unitCode: 'DT-091',
    model: 'Hino 500 FM 260 JD (6x4)',
    vinSerial: 'MHKFM8JNK-09104',
    siteLocation: 'Pit Sebuku - East Flank',
    status: 'OPERATIONAL',
    currentTotalHm: 11300,
    driverOrTechnician: 'Dedi Kurniawan / Agus P.',
    year: 2022,
    notes: 'Hauling overburden (OB) ke disposal selatan. Tekanan boost turbo 1.45 bar stabil.',
    components: createDefaultComponentsForUnit('DT-091', 11300),
  },
  {
    id: 'DT-092',
    unitCode: 'DT-092',
    model: 'Hino 500 FM 350 GY (6x4 Extreme Mining)',
    vinSerial: 'MHKFM8JNK-09205',
    siteLocation: 'Coal Processing Plant (CPP)',
    status: 'OPERATIONAL',
    currentTotalHm: 6800,
    driverOrTechnician: 'Iwan Setiawan / Hendra G.',
    year: 2023,
    notes: 'Hauling crushed coal. Dump body dilengkapi wear plate Hardox 450.',
    components: createDefaultComponentsForUnit('DT-092', 6800),
  },
  {
    id: 'DT-093',
    unitCode: 'DT-093',
    model: 'Hino 500 FM 260 JD',
    vinSerial: 'MHKFM8JNK-09306',
    siteLocation: 'Disposal Area West',
    status: 'OPERATIONAL',
    currentTotalHm: 19850,
    driverOrTechnician: 'Slamet Riyadi / Budi S.',
    year: 2021,
    notes: 'Mendekati target major overhaul 20.000 HM. Cek blowby gas dan differential inter-axle.',
    components: createDefaultComponentsForUnit('DT-093', 19850),
  },
  {
    id: 'DT-094',
    unitCode: 'DT-094',
    model: 'Hino 500 FM 260 JD',
    vinSerial: 'MHKFM8JNK-09407',
    siteLocation: 'Workshop Main Bay 3',
    status: 'BREAKDOWN',
    currentTotalHm: 21400,
    driverOrTechnician: 'Ahmad Zaki / Tim Overhaul',
    year: 2020,
    notes: 'Komponen final drive differential belakang aus, menunggu suku cadang pinion gear.',
    components: createDefaultComponentsForUnit('DT-094', 21400),
  },
  {
    id: 'DT-095',
    unitCode: 'DT-095',
    model: 'Hino 500 FM 280 TI',
    vinSerial: 'MHKFM8JNK-09508',
    siteLocation: 'ROM Stockpile 2',
    status: 'STANDBY',
    currentTotalHm: 13600,
    driverOrTechnician: 'Doni Prasetyo / Joko W.',
    year: 2022,
    notes: 'Unit stand-by cadangan shift malam. Bahan bakar penuh, siap dispatch seketika.',
    components: createDefaultComponentsForUnit('DT-095', 13600),
  },
  {
    id: 'DT-096',
    unitCode: 'DT-096',
    model: 'Hino 500 FM 260 JD',
    vinSerial: 'MHKFM8JNK-09609',
    siteLocation: 'Pit Mahakam - South',
    status: 'OPERATIONAL',
    currentTotalHm: 16150,
    driverOrTechnician: 'Eko Purwanto / Agus P.',
    year: 2021,
    notes: 'Operasi reguler 2 shift. Tekanan oli dan suhu transmisi berada dalam batas aman.',
    components: createDefaultComponentsForUnit('DT-096', 16150),
  },
  {
    id: 'DT-097',
    unitCode: 'DT-097',
    model: 'Hino 500 FM 350 GY (Extreme Mining)',
    vinSerial: 'MHKFM8JNK-09710',
    siteLocation: 'Hauling Road Km 14',
    status: 'OPERATIONAL',
    currentTotalHm: 4120,
    driverOrTechnician: 'Wahyu Hidayat / Fajar N.',
    year: 2024,
    notes: 'Unit paling baru dalam armada. Target Mechanical Availability (MA) dipertahankan >95%.',
    components: createDefaultComponentsForUnit('DT-097', 4120),
  },
];

/**
 * Load fleet units from localStorage or return default 10 units
 */
export function loadStoredFleet(): DumpTruckUnit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FLEET);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure each unit has components array
        return parsed.map((unit) => ({
          ...unit,
          components:
            Array.isArray(unit.components) && unit.components.length > 0
              ? unit.components
              : createDefaultComponentsForUnit(unit.unitCode || unit.id, unit.currentTotalHm || 12000),
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to load fleet from localStorage:', err);
  }
  return INITIAL_10_UNITS;
}

/**
 * Save fleet units to localStorage
 */
export function saveStoredFleet(fleet: DumpTruckUnit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FLEET, JSON.stringify(fleet));
  } catch (err) {
    console.warn('Failed to save fleet to localStorage:', err);
  }
}

/**
 * Load or initialize active unit ID
 */
export function loadStoredActiveUnitId(fleet: DumpTruckUnit[]): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_UNIT);
    if (raw && fleet.some((u) => u.id === raw)) {
      return raw;
    }
  } catch (err) {
    console.warn('Failed to load active unit ID:', err);
  }
  return fleet[0]?.id || 'DT-088';
}

/**
 * Save active unit ID
 */
export function saveStoredActiveUnitId(unitId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_UNIT, unitId);
  } catch (err) {
    console.warn('Failed to save active unit ID:', err);
  }
}
