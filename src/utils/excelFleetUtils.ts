import * as XLSX from 'xlsx';
import { DumpTruckUnit, HinoComponent, UnitOperationalStatus, ComponentCondition } from '../types';
import { createDefaultComponentsForUnit } from '../data/fleetUnitsData';
import { calculateComponentStatus } from '../data/hinoComponentsData';

export interface ParsedFleetData {
  units: DumpTruckUnit[];
  totalUnitsDetected: number;
  totalComponentRows: number;
  warnings: string[];
}

/**
 * Generate and download an Excel template (.xlsx) for mining fleet
 */
export function downloadFleetExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Armada Dump Truck
  const fleetData = [
    {
      'Unit ID (*)': 'DT-088',
      'Model Unit': 'Hino 500 FM 260 JD (6x4 Mining Dump)',
      'Lokasi Pit / Site': 'Pit Mahakam - Block A',
      'Status Operasional (OPERATIONAL/BREAKDOWN/STANDBY/MAINTENANCE)': 'OPERATIONAL',
      'Total Hour Meter (HM) Unit': 14250,
      'Nomor Rangka / VIN': 'MHKFM8JNK-08801',
      'Driver / Teknisi Bertanggung Jawab': 'Agus Santoso / Budi P.',
      'Tahun Pembuatan': 2022,
      'Catatan Operasional': 'Hauling batubara ke ROM-1. Mesin optimal.',
    },
    {
      'Unit ID (*)': 'DT-089',
      'Model Unit': 'Hino 500 FM 260 JD (6x4 Heavy Duty)',
      'Lokasi Pit / Site': 'Pit Mahakam - Block B',
      'Status Operasional (OPERATIONAL/BREAKDOWN/STANDBY/MAINTENANCE)': 'OPERATIONAL',
      'Total Hour Meter (HM) Unit': 8450,
      'Nomor Rangka / VIN': 'MHKFM8JNK-08902',
      'Driver / Teknisi Bertanggung Jawab': 'Hendra Wijaya / Fajar N.',
      'Tahun Pembuatan': 2023,
      'Catatan Operasional': 'Baru selesai PM-500 rutin.',
    },
    {
      'Unit ID (*)': 'DT-090',
      'Model Unit': 'Hino 500 FM 280 TI (6x4 High Roof)',
      'Lokasi Pit / Site': 'Workshop Bay 1',
      'Status Operasional (OPERATIONAL/BREAKDOWN/STANDBY/MAINTENANCE)': 'MAINTENANCE',
      'Total Hour Meter (HM) Unit': 18920,
      'Nomor Rangka / VIN': 'MHKFM8JNK-09003',
      'Driver / Teknisi Bertanggung Jawab': 'Rudi Hartono / Bambang S.',
      'Tahun Pembuatan': 2021,
      'Catatan Operasional': 'Perbaikan rem dan booster kopling.',
    },
  ];

  const wsFleet = XLSX.utils.json_to_sheet(fleetData);
  // Set column widths
  wsFleet['!cols'] = [
    { wch: 14 },
    { wch: 35 },
    { wch: 25 },
    { wch: 30 },
    { wch: 22 },
    { wch: 20 },
    { wch: 32 },
    { wch: 16 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsFleet, 'DAFTAR_ARMADA');

  // Sheet 2: Data Komponen & Lifetime HM per Unit
  const componentTemplateData = [
    {
      'Unit ID (*)': 'DT-088',
      'Component ID (*)': 'engine-assy',
      'Nama Komponen': 'Engine Assembly (J08E / A09C)',
      'Serial Number': 'J08E-UN-98241',
      'Actual HM (*)': 12000,
      'Target Lifetime HM (*)': 20000,
      'Kondisi (Optimal/Fair/Attention/Critical)': 'Optimal',
      'Tanggal Penggantian Terakhir': '2024-04-15',
      'Jadwal Inspeksi Berikutnya': '2026-11-10',
      'Tindakan Rekomendasi': 'SOS Oil Sampling rutin setiap 250 HM.',
    },
    {
      'Unit ID (*)': 'DT-088',
      'Component ID (*)': 'turbocharger',
      'Nama Komponen': 'Turbocharger Unit',
      'Serial Number': 'TB-GAR-77312',
      'Actual HM (*)': 21500,
      'Target Lifetime HM (*)': 25000,
      'Kondisi (Optimal/Fair/Attention/Critical)': 'Attention',
      'Tanggal Penggantian Terakhir': '2023-08-19',
      'Jadwal Inspeksi Berikutnya': '2026-10-28',
      'Tindakan Rekomendasi': 'Cek radial & axial play, periksa boost pressure.',
    },
    {
      'Unit ID (*)': 'DT-088',
      'Component ID (*)': 'transmission',
      'Nama Komponen': 'Transmission Assembly (M009 / ZF 9S)',
      'Serial Number': 'TR-M009-55102',
      'Actual HM (*)': 16500,
      'Target Lifetime HM (*)': 18000,
      'Kondisi (Optimal/Fair/Attention/Critical)': 'Attention',
      'Tanggal Penggantian Terakhir': '2024-01-20',
      'Jadwal Inspeksi Berikutnya': '2026-11-05',
      'Tindakan Rekomendasi': 'Cek synchronizer ring, ganti oli transmisi SAE 80W-90.',
    },
  ];

  const wsComp = XLSX.utils.json_to_sheet(componentTemplateData);
  wsComp['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 35 },
    { wch: 20 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsComp, 'KOMPONEN_LIFETIME_HM');

  // Sheet 3: Panduan & Petunjuk
  const guideData = [
    {
      'PETUNJUK PENGISIAN EXCEL MINEROZ HINO 500': '1. Sheet DAFTAR_ARMADA digunakan untuk menambah/update unit dumptruck (contoh: DT-088 s/d DT-097).',
    },
    {
      'PETUNJUK PENGISIAN EXCEL MINEROZ HINO 500': '2. Kolom bertanda (*) Wajib Diisi (Unit ID, Component ID, Actual HM, Target HM).',
    },
    {
      'PETUNJUK PENGISIAN EXCEL MINEROZ HINO 500': '3. Status Operasional yang valid: OPERATIONAL, BREAKDOWN, STANDBY, MAINTENANCE.',
    },
    {
      'PETUNJUK PENGISIAN EXCEL MINEROZ HINO 500': '4. Kondisi Komponen yang valid: Optimal, Fair, Attention, Critical.',
    },
    {
      'PETUNJUK PENGISIAN EXCEL MINEROZ HINO 500': '5. Jika Anda memasukkan Unit baru tanpa baris komponen, sistem otomatis membuat 19 komponen standar Hino 500 untuk unit tersebut.',
    },
    {
      'PETUNJUK PENGISIAN EXCEL MINEROZ HINO 500': '6. Anda dapat langsung mengunggah file .xlsx atau .csv hasil editan ke menu Import di aplikasi MINEROZ.',
    },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PANDUAN_PENGISIAN');

  // Trigger download
  XLSX.writeFile(wb, 'Template_Armada_Hino500_Mineroz.xlsx');
}

/**
 * Export full fleet with all units and components into a complete Excel workbook
 */
export function exportFleetToExcel(
  fleet: DumpTruckUnit[],
  fileNamePrefix: string = 'Mineroz_Mining_Fleet_10_Units'
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan 10 Unit Armada
  const fleetRows = fleet.map((unit) => {
    const totalComps = unit.components.length;
    let normalCount = 0;
    let warningCount = 0;
    let overdueCount = 0;

    unit.components.forEach((c) => {
      const status = calculateComponentStatus(c.actualHm, c.targetLifetimeHm);
      if (status === 'NORMAL') normalCount++;
      else if (status === 'WARNING') warningCount++;
      else if (status === 'OVERDUE') overdueCount++;
    });

    return {
      'Unit ID': unit.unitCode || unit.id,
      'Model Kendaraan': unit.model,
      'Lokasi Tambang (Pit)': unit.siteLocation,
      'Status Operasional': unit.status,
      'Total Hour Meter (HM)': unit.currentTotalHm,
      'VIN / No Rangka': unit.vinSerial,
      'Driver / Mekanik PJ': unit.driverOrTechnician || '-',
      'Tahun': unit.year || 2022,
      'Total Komponen': totalComps,
      'Normal (HM)': normalCount,
      'Warning (HM)': warningCount,
      'Overdue (HM)': overdueCount,
      'Catatan': unit.notes || '',
    };
  });

  const wsFleet = XLSX.utils.json_to_sheet(fleetRows);
  wsFleet['!cols'] = [
    { wch: 14 },
    { wch: 35 },
    { wch: 25 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 26 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsFleet, 'RINGKASAN_ARMADA');

  // Sheet 2: Seluruh Komponen Semua Unit
  const allComponentRows: Record<string, unknown>[] = [];
  fleet.forEach((unit) => {
    unit.components.forEach((c) => {
      const status = calculateComponentStatus(c.actualHm, c.targetLifetimeHm);
      const lifeUsed = Math.min(100, Math.round((c.actualHm / (c.targetLifetimeHm || 1)) * 100));
      const remainingHm = Math.max(0, c.targetLifetimeHm - c.actualHm);

      allComponentRows.push({
        'Unit ID': unit.unitCode || unit.id,
        'Nomor': c.number,
        'Component ID': c.id,
        'Nama Komponen (EN)': c.name,
        'Nama Komponen (ID)': c.nameId,
        'Sistem Kategori': c.systemCategory,
        'Nomor Seri Komponen': c.serialNumber,
        'Actual HM': c.actualHm,
        'Target Lifetime HM': c.targetLifetimeHm,
        'Remaining HM': remainingHm,
        'Life Used (%)': `${lifeUsed}%`,
        'Status HM': status,
        'Kondisi Fisik': c.condition,
        'Kritikalitas': c.criticality,
        'Tanggal Ganti Terakhir': c.lastReplacementDate,
        'Jadwal Inspeksi Berikut': c.nextInspectionDate,
        'Tindakan Rekomendasi': c.recommendedAction,
      });
    });
  });

  const wsComps = XLSX.utils.json_to_sheet(allComponentRows);
  wsComps['!cols'] = [
    { wch: 12 },
    { wch: 8 },
    { wch: 22 },
    { wch: 32 },
    { wch: 35 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsComps, 'KOMPONEN_SEMUA_UNIT');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileNamePrefix}_${dateStr}.xlsx`);
}

/**
 * Export single unit components to CSV
 */
export function exportSingleUnitToCSV(unit: DumpTruckUnit): void {
  const headers = [
    'Unit_ID',
    'Component_ID',
    'Number',
    'Component_Name',
    'System_Category',
    'Serial_Number',
    'Actual_HM',
    'Target_Lifetime_HM',
    'Life_Used_Percent',
    'Status',
    'Condition',
    'Criticality',
    'Last_Replacement_Date',
    'Next_Inspection_Date',
    'Recommended_Action',
  ];

  const rows = unit.components.map((c) => {
    const status = calculateComponentStatus(c.actualHm, c.targetLifetimeHm);
    const lifeUsed = Math.min(100, Math.round((c.actualHm / (c.targetLifetimeHm || 1)) * 100));
    return [
      `"${unit.unitCode || unit.id}"`,
      `"${c.id}"`,
      c.number,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.systemCategory}"`,
      `"${c.serialNumber}"`,
      c.actualHm,
      c.targetLifetimeHm,
      `"${lifeUsed}%"`,
      `"${status}"`,
      `"${c.condition}"`,
      `"${c.criticality}"`,
      `"${c.lastReplacementDate}"`,
      `"${c.nextInspectionDate}"`,
      `"${c.recommendedAction.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `Mineroz_${unit.unitCode || unit.id}_Components_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse an uploaded Excel (.xlsx/.xls) or CSV file
 */
export async function parseExcelOrCsvFleetFile(file: File): Promise<ParsedFleetData> {
  const warnings: string[] = [];
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Map to hold units by Unit ID
  const unitsMap: Map<string, DumpTruckUnit> = new Map();
  let totalComponentRows = 0;

  // 1. First, check if there is a DAFTAR_ARMADA sheet or general units sheet
  const fleetSheetName = workbook.SheetNames.find(
    (name) =>
      name.toLowerCase().includes('armada') ||
      name.toLowerCase().includes('unit') ||
      name.toLowerCase().includes('fleet')
  );

  if (fleetSheetName) {
    const sheet = workbook.Sheets[fleetSheetName];
    const fleetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    fleetRows.forEach((row) => {
      // Find unit id key
      const unitIdKey = Object.keys(row).find(
        (k) =>
          k.toLowerCase().includes('unit id') ||
          k.toLowerCase().includes('unit_id') ||
          k.toLowerCase() === 'id' ||
          k.toLowerCase() === 'unit'
      );
      const rawUnitId = unitIdKey ? String(row[unitIdKey] || '').trim() : '';

      if (rawUnitId) {
        const unitId = rawUnitId;
        const model = String(
          row['Model Unit'] || row['Model Kendaraan'] || row['Model'] || 'Hino 500 FM 260 JD'
        );
        const siteLocation = String(
          row['Lokasi Pit / Site'] || row['Lokasi Tambang (Pit)'] || row['Lokasi'] || 'Pit Mining'
        );
        const rawStatus = String(
          row['Status Operasional (OPERATIONAL/BREAKDOWN/STANDBY/MAINTENANCE)'] ||
            row['Status Operasional'] ||
            row['Status'] ||
            'OPERATIONAL'
        ).toUpperCase();

        const validStatus: UnitOperationalStatus = ['OPERATIONAL', 'BREAKDOWN', 'STANDBY', 'MAINTENANCE'].includes(
          rawStatus
        )
          ? (rawStatus as UnitOperationalStatus)
          : 'OPERATIONAL';

        const totalHm = Number(
          row['Total Hour Meter (HM) Unit'] || row['Total Hour Meter (HM)'] || row['Total HM'] || row['HM'] || 12000
        );
        const vin = String(row['Nomor Rangka / VIN'] || row['VIN / No Rangka'] || row['VIN'] || '');
        const driver = String(
          row['Driver / Teknisi Bertanggung Jawab'] || row['Driver / Mekanik PJ'] || row['Driver'] || ''
        );
        const year = Number(row['Tahun Pembuatan'] || row['Tahun'] || 2022);
        const notes = String(row['Catatan Operasional'] || row['Catatan'] || '');

        unitsMap.set(unitId, {
          id: unitId,
          unitCode: unitId,
          model,
          vinSerial: vin || `VIN-${unitId}`,
          siteLocation,
          status: validStatus,
          currentTotalHm: isNaN(totalHm) ? 12000 : totalHm,
          driverOrTechnician: driver,
          year: isNaN(year) ? 2022 : year,
          notes,
          components: createDefaultComponentsForUnit(unitId, isNaN(totalHm) ? 12000 : totalHm),
        });
      }
    });
  }

  // 2. Next, check for component sheet or rows
  const componentSheetName = workbook.SheetNames.find(
    (name) =>
      name.toLowerCase().includes('komponen') ||
      name.toLowerCase().includes('component') ||
      name.toLowerCase().includes('lifetime')
  ) || workbook.SheetNames[0]; // Fallback to first sheet if only one sheet exists

  if (componentSheetName) {
    const sheet = workbook.Sheets[componentSheetName];
    const compRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    compRows.forEach((row) => {
      // Look for Unit ID
      const unitKey = Object.keys(row).find(
        (k) =>
          k.toLowerCase().includes('unit id') ||
          k.toLowerCase().includes('unit_id') ||
          k.toLowerCase() === 'unit'
      );
      const rawUnitId = unitKey ? String(row[unitKey] || '').trim() : '';

      // Look for Component ID or Name
      const compIdKey = Object.keys(row).find(
        (k) =>
          k.toLowerCase().includes('component id') ||
          k.toLowerCase().includes('component_id') ||
          k.toLowerCase() === 'id'
      );
      const rawCompId = compIdKey ? String(row[compIdKey] || '').trim() : '';

      const compNameKey = Object.keys(row).find(
        (k) =>
          k.toLowerCase().includes('nama komponen') ||
          k.toLowerCase().includes('component name') ||
          k.toLowerCase() === 'name'
      );
      const rawCompName = compNameKey ? String(row[compNameKey] || '').trim() : '';

      // Look for Actual HM and Target HM
      const actualHmKey = Object.keys(row).find(
        (k) =>
          k.toLowerCase().includes('actual hm') ||
          k.toLowerCase().includes('actual_hm') ||
          k.toLowerCase().includes('actual')
      );
      const targetHmKey = Object.keys(row).find(
        (k) =>
          k.toLowerCase().includes('target lifetime hm') ||
          k.toLowerCase().includes('target_hm') ||
          k.toLowerCase().includes('target')
      );

      const actualHm = actualHmKey !== undefined ? Number(row[actualHmKey]) : NaN;
      const targetHm = targetHmKey !== undefined ? Number(row[targetHmKey]) : NaN;

      const conditionKey = Object.keys(row).find(
        (k) => k.toLowerCase().includes('kondisi') || k.toLowerCase().includes('condition')
      );
      const condition = conditionKey ? String(row[conditionKey] || '').trim() : '';

      const serialKey = Object.keys(row).find(
        (k) => k.toLowerCase().includes('serial') || k.toLowerCase().includes('seri')
      );
      const serialNumber = serialKey ? String(row[serialKey] || '').trim() : '';

      if (rawUnitId) {
        // If unit doesn't exist yet, create it
        if (!unitsMap.has(rawUnitId)) {
          unitsMap.set(rawUnitId, {
            id: rawUnitId,
            unitCode: rawUnitId,
            model: 'Hino 500 FM 260 JD (6x4)',
            vinSerial: `VIN-${rawUnitId}`,
            siteLocation: 'Mining Pit Site',
            status: 'OPERATIONAL',
            currentTotalHm: !isNaN(actualHm) ? actualHm : 12000,
            year: 2022,
            notes: 'Diimpor dari file spreadsheet Excel',
            components: createDefaultComponentsForUnit(rawUnitId, !isNaN(actualHm) ? actualHm : 12000),
          });
        }

        const unit = unitsMap.get(rawUnitId)!;
        totalComponentRows++;

        // Find matching component in unit
        const compIdx = unit.components.findIndex(
          (c) =>
            (rawCompId && c.id.toLowerCase() === rawCompId.toLowerCase()) ||
            (rawCompName && c.name.toLowerCase().includes(rawCompName.toLowerCase())) ||
            (rawCompName && c.nameId.toLowerCase().includes(rawCompName.toLowerCase()))
        );

        if (compIdx !== -1) {
          const comp = unit.components[compIdx];
          unit.components[compIdx] = {
            ...comp,
            actualHm: !isNaN(actualHm) ? actualHm : comp.actualHm,
            targetLifetimeHm: !isNaN(targetHm) ? targetHm : comp.targetLifetimeHm,
            condition: ['Optimal', 'Fair', 'Attention', 'Critical'].includes(condition)
              ? (condition as ComponentCondition)
              : comp.condition,
            serialNumber: serialNumber || comp.serialNumber,
          };
        }
      }
    });
  }

  const resultUnits = Array.from(unitsMap.values());

  if (resultUnits.length === 0) {
    warnings.push('Tidak ditemukan data unit valid dengan kolom "Unit ID" di dalam file.');
  }

  return {
    units: resultUnits,
    totalUnitsDetected: resultUnits.length,
    totalComponentRows,
    warnings,
  };
}
