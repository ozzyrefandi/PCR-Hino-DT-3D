import { HinoComponent, ComponentStatus, LifetimeThresholds, MaintenanceRecord } from '../types';
import { DEFAULT_MAINTENANCE_HISTORIES } from './maintenanceHistories';

export const DEFAULT_THRESHOLDS: LifetimeThresholds = {
  warningPercent: 80,
  overduePercent: 100,
};

export const INITIAL_HINO_COMPONENTS: HinoComponent[] = [
  {
    id: 'engine-assy',
    number: 1,
    name: 'Engine Assembly (J08E / A09C)',
    nameId: 'Engine Assembly (Mesin Diesel 6-Silinder)',
    systemCategory: 'Engine & Turbocharger',
    subComponents: ['Engine Block', 'Cylinder Head', 'Piston & Liner', 'Crankshaft', 'Camshaft', 'Valves & Timing Gear'],
    unitId: 'DT-HN500-042',
    serialNumber: 'J08E-UN-98241',
    installHm: 0,
    actualHm: 12000,
    targetLifetimeHm: 20000,
    criticality: 'Critical',
    condition: 'Optimal',
    lastReplacementDate: '2024-04-15',
    nextInspectionDate: '2026-11-10',
    inspectionIntervalHm: 250,
    recommendedAction: 'Jadwalkan pengambilan sample oli (SOS / Oil Sampling) setiap 250 HM. Cek celah klep & blowby gas.',
    maintenanceNotes: 'Tergantung model & kondisi beban operasi tambang. Perhatikan kompresi dan temperatur coolant.',
    typicalLifeRange: '15.000 – 25.000 HM',
    meshGroupKeys: ['engine', 'engine_block'],
    explodedOffset: [0, 1.8, 0.6],
    maintenanceHistory: [
      {
        id: 'hist-eng-01',
        componentId: 'engine-assy',
        date: '2024-04-15',
        serviceType: 'Periodic Maintenance (PM)',
        hmAtService: 12000,
        technician: 'Agus Pratama (ID: MNZ-104)',
        workOrderNo: 'WO-ENG-2024-0415',
        statusOutcome: 'Completed',
        replacedParts: ['Filter Oli Engine (15607-2190)', 'Filter Solar Primer (23390-E0011)', 'Oli 15W-40 CI-4 28L'],
        technicianNotes: 'Penggantian oli mesin & filter oli rutin PM 250. Pengambilan sampel oli SOS untuk uji ICP lab spektrometri. Pemeriksaan blow-by gas normal pada 2.2 kPa. Tekanan oli idle 1.6 bar, high idle 4.2 bar.',
      },
      {
        id: 'hist-eng-02',
        componentId: 'engine-assy',
        date: '2024-01-10',
        serviceType: 'Calibration & Adjustment',
        hmAtService: 10500,
        technician: 'Hendra Gunawan (ID: MNZ-077)',
        workOrderNo: 'WO-ENG-2024-0110',
        statusOutcome: 'Completed',
        replacedParts: ['Gasket Valve Cover (11213-E0010)'],
        technicianNotes: 'Penyetelan celah klep intake (0.30mm) & exhaust (0.45mm) sesuai Shop Manual Hino J08E. Pengecekan torque baut cylinder head 180 Nm. Tidak ditemukan keausan abnormal pada rocker arm.',
      },
      {
        id: 'hist-eng-03',
        componentId: 'engine-assy',
        date: '2023-09-22',
        serviceType: 'Oil Sampling (SOS)',
        hmAtService: 8200,
        technician: 'Agus Pratama (ID: MNZ-104)',
        workOrderNo: 'WO-SOS-2023-0922',
        statusOutcome: 'Completed',
        technicianNotes: 'Laporan lab SOS keluar: Fe 14 ppm, Cu 3 ppm, Al 2 ppm, Cr 1 ppm, Si 6 ppm. Viskositas 14.2 cSt @ 100°C. Tidak ada pengenceran bahan bakar (fuel dilution 0%) dan tidak ada jejak glikol.',
      },
      {
        id: 'hist-eng-04',
        componentId: 'engine-assy',
        date: '2023-05-04',
        serviceType: 'Greasing & Torque Check',
        hmAtService: 5800,
        technician: 'Fajar Nugraha (ID: MNZ-419)',
        workOrderNo: 'WO-ENG-2023-0504',
        statusOutcome: 'Completed',
        replacedParts: ['V-Belt Serpentine Alternator'],
        technicianNotes: 'Pengecekan belt tensioner dan penggantian V-belt yang mulai retak mikro. Pemeriksaan kebocoran sil kruk as depan & belakang kering.',
      },
    ],
  },
  {
    id: 'turbocharger',
    number: 2,
    name: 'Turbocharger Unit',
    nameId: 'Turbocharger Assembly & Wastegate',
    systemCategory: 'Engine & Turbocharger',
    subComponents: ['Turbine Housing', 'Compressor Wheel', 'Center Housing (CHRA)', 'Wastegate Actuator', 'Oil Feed Line'],
    unitId: 'DT-HN500-042',
    serialNumber: 'TB-GAR-77312',
    installHm: 2000,
    actualHm: 21500,
    targetLifetimeHm: 25000,
    criticality: 'High Cost',
    condition: 'Attention',
    lastReplacementDate: '2023-08-19',
    nextInspectionDate: '2026-10-28',
    inspectionIntervalHm: 500,
    recommendedAction: 'Lakukan pengecekan radial & axial shaft play, cek kebocoran oli di kompresor housing, periksa boost pressure sensor.',
    maintenanceNotes: 'Cek performa boost & kebersihan oli mesin. Jangan matikan mesin seketika setelah heavy hauling (idle cooldown).',
    typicalLifeRange: '20.000 – 30.000 HM',
    meshGroupKeys: ['turbocharger'],
    explodedOffset: [1.6, 1.5, 0.6],
  },
  {
    id: 'transmission',
    number: 3,
    name: 'Transmission Assembly (Eaton / Hino 9S)',
    nameId: 'Transmisi 9-Speed Heavy Mining',
    systemCategory: 'Powertrain & Transmission',
    subComponents: ['Gearbox Casing', 'Main Shaft & Countershaft', 'Synchronizer Rings', 'Shift Fork & Tower', 'PTO Drive Gear'],
    unitId: 'DT-HN500-042',
    serialNumber: 'TR-HN9-55092',
    installHm: 0,
    actualHm: 27800,
    targetLifetimeHm: 30000,
    criticality: 'High Cost',
    condition: 'Attention',
    lastReplacementDate: '2022-11-04',
    nextInspectionDate: '2026-11-01',
    inspectionIntervalHm: 500,
    recommendedAction: 'Periksa temperatur oli transmisi, drain magnetic plug untuk cek serpihan metal gram, cek perpindahan gigi 3-4 dan reverse.',
    maintenanceNotes: 'Cek temperatur & oli pelumas berkala. Overhaul kit harus disiapkan jika HM mendekati 30.000.',
    typicalLifeRange: '20.000 – 35.000 HM',
    meshGroupKeys: ['transmission'],
    explodedOffset: [0, -0.7, -1.0],
  },
  {
    id: 'clutch-torque',
    number: 4,
    name: 'Clutch / Torque Converter Assembly',
    nameId: 'Kopling Plat Ganda / Torque Converter',
    systemCategory: 'Powertrain & Transmission',
    subComponents: ['Clutch Disc Heavy Duty', 'Pressure Plate', 'Release Bearing', 'Flywheel Ring', 'Booster Clutch'],
    unitId: 'DT-HN500-042',
    serialNumber: 'CL-HD430-109',
    installHm: 1000,
    actualHm: 22400,
    targetLifetimeHm: 22000,
    criticality: 'High Cost',
    condition: 'Critical',
    lastReplacementDate: '2023-01-14',
    nextInspectionDate: '2026-10-22',
    inspectionIntervalHm: 250,
    recommendedAction: 'OVERDUE: Segera jadwalkan penggantian clutch disc & release bearing sebelum terjadi slip di tanjakan tambang curam!',
    maintenanceNotes: 'Cek slip kopling & kenaikan temperatur bell housing saat membawa muatan over-burden (OB).',
    typicalLifeRange: '20.000 – 30.000 HM',
    meshGroupKeys: ['clutch'],
    explodedOffset: [0, 1.1, -0.3],
  },
  {
    id: 'drive-shaft',
    number: 5,
    name: 'Drive Shaft / Propeller Shaft',
    nameId: 'Kopel / Propeller Shaft & Cross Joint',
    systemCategory: 'Powertrain & Transmission',
    subComponents: ['Front Propeller Tube', 'Inter-Axle Propeller Shaft', 'Spider / Universal Cross Joints (U-Joint)', 'Center Support Bearing', 'Slip Yoke'],
    unitId: 'DT-HN500-042',
    serialNumber: 'PS-MIN-33821',
    installHm: 0,
    actualHm: 16500,
    targetLifetimeHm: 40000,
    criticality: 'Wear',
    condition: 'Optimal',
    lastReplacementDate: '2024-02-18',
    nextInspectionDate: '2026-12-05',
    inspectionIntervalHm: 250,
    recommendedAction: 'Greasing berkala pada niple cross joint & slip joint dengan grease EP2 tahan air dan debu tambang.',
    maintenanceNotes: 'Cek dynamic balancing dan grease niple. Waspadai getaran saat deselerasi muatan.',
    typicalLifeRange: '30.000 – 50.000 HM',
    meshGroupKeys: ['propshaft'],
    explodedOffset: [0, -1.0, -2.2],
  },
  {
    id: 'differential',
    number: 6,
    name: 'Differential Assembly (Front & Rear Tandem)',
    nameId: 'Gardan Tengah & Belakang (Differential Carrier)',
    systemCategory: 'Axle & Differential',
    subComponents: ['Crown Wheel / Ring Gear', 'Drive Pinion', 'Differential Case & Spider Gears', 'Inter-Axle Differential Lock', 'Side Bearings'],
    unitId: 'DT-HN500-042',
    serialNumber: 'DF-TAN-88029',
    installHm: 0,
    actualHm: 29500,
    targetLifetimeHm: 35000,
    criticality: 'High Cost',
    condition: 'Attention',
    lastReplacementDate: '2022-09-10',
    nextInspectionDate: '2026-11-15',
    inspectionIntervalHm: 1000,
    recommendedAction: 'Periksa backlash ring gear & pinion, ganti oli gardan SAE 85W-140 GL-5, bersihkan breather vent dari lumpur.',
    maintenanceNotes: 'Cek backlash, kontaminasi air akibat melintasi genangan pit tambang, dan suara dengung bearing.',
    typicalLifeRange: '25.000 – 40.000 HM',
    meshGroupKeys: ['diff_middle', 'diff_rear'],
    explodedOffset: [0, -1.2, -4.5],
  },
  {
    id: 'final-drive',
    number: 7,
    name: 'Final Drive & Planetary Hub',
    nameId: 'Final Drive Hub Reduksi Roda',
    systemCategory: 'Axle & Differential',
    subComponents: ['Planetary Gear Set', 'Sun Gear', 'Ring Gear Hub', 'Floating Duo-Cone Seals', 'Wheel Hub Bearings'],
    unitId: 'DT-HN500-042',
    serialNumber: 'FD-HUB-40118',
    installHm: 0,
    actualHm: 18200,
    targetLifetimeHm: 28000,
    criticality: 'High Cost',
    condition: 'Optimal',
    lastReplacementDate: '2023-05-20',
    nextInspectionDate: '2026-11-20',
    inspectionIntervalHm: 500,
    recommendedAction: 'Inspeksi level oli hub roda samping dan cek indikasi kebocoran duo-cone seal.',
    maintenanceNotes: 'Cek kondisi oli reduksi dan deteksi noise pada planetary gears saat berbelok di haul road.',
    typicalLifeRange: '20.000 – 35.000 HM',
    meshGroupKeys: ['wheel_hubs'],
    explodedOffset: [2.0, 0, -4.5],
  },
  {
    id: 'axle-housing',
    number: 8,
    name: 'Axle Housing Assembly (Front & Rear)',
    nameId: 'Housing Gardan Depan & Belakang',
    systemCategory: 'Axle & Differential',
    subComponents: ['Front Steer Axle I-Beam', 'Tandem Rear Axle Housings', 'King Pin & Bushing', 'Bogie Pivot Bracket', 'Torque Rod Mounts'],
    unitId: 'DT-HN500-042',
    serialNumber: 'AX-HOU-99011',
    installHm: 0,
    actualHm: 26000,
    targetLifetimeHm: 35000,
    criticality: 'High Cost',
    condition: 'Fair',
    lastReplacementDate: '2023-02-11',
    nextInspectionDate: '2026-12-01',
    inspectionIntervalHm: 1000,
    recommendedAction: 'Magnetic particle inspection (MPI) atau cek visual retak (crack) pada area bracket spring seat dan kingpin.',
    maintenanceNotes: 'Cek keretakan struktur logam akibat fatigue benturan jalan hauling bergelombang (washboard).',
    typicalLifeRange: '25.000 – 45.000 HM',
    meshGroupKeys: ['front_axle', 'rear_axle'],
    explodedOffset: [0, -1.5, -3.2],
  },
  {
    id: 'hydraulic-pump',
    number: 9,
    name: 'Hydraulic Hoist Pump & Cylinder',
    nameId: 'Pompa Hidrolik Hoist & Silinder Tipping',
    systemCategory: 'Dump Body & Hoist',
    subComponents: ['Hydraulic Gear Pump (PTO Driven)', 'Multi-Stage Telescopic Hoist Ram', 'Directional Control Valve', 'Hydraulic Oil Tank & Filter', 'High Pressure Steel Braided Hoses'],
    unitId: 'DT-HN500-042',
    serialNumber: 'HY-PMP-19403',
    installHm: 0,
    actualHm: 18400,
    targetLifetimeHm: 20000,
    criticality: 'High Cost',
    condition: 'Attention',
    lastReplacementDate: '2023-10-12',
    nextInspectionDate: '2026-10-30',
    inspectionIntervalHm: 250,
    recommendedAction: 'WARNING: Life Used mencapai 92%. Cek tekanan relief valve (210 bar), ganti return oil filter, cek scoring pada rod chrome silinder.',
    maintenanceNotes: 'Cek tekanan hidrolik & deteksi kebocoran seal pada setiap stage silinder hidrolik dump.',
    typicalLifeRange: '15.000 – 25.000 HM',
    meshGroupKeys: ['hydraulic', 'hoist_cylinder'],
    explodedOffset: [-1.8, 1.2, -1.0],
  },
  {
    id: 'steering-system',
    number: 10,
    name: 'Steering Gearbox & Linkage',
    nameId: 'Steering Gearbox & Power Steering',
    systemCategory: 'Steering System',
    subComponents: ['Power Steering Gearbox', 'Pitman Arm', 'Drag Link & Ball Joints', 'Tie Rod Assembly', 'Hydraulic Vane Steering Pump'],
    unitId: 'DT-HN500-042',
    serialNumber: 'ST-GBX-55110',
    installHm: 0,
    actualHm: 14200,
    targetLifetimeHm: 28000,
    criticality: 'High Cost',
    condition: 'Optimal',
    lastReplacementDate: '2024-05-09',
    nextInspectionDate: '2026-11-25',
    inspectionIntervalHm: 250,
    recommendedAction: 'Periksa free play setir (maksimal 30mm), cek kondisi karet boot tie rod dan kebocoran oli ATF power steering.',
    maintenanceNotes: 'Cek oli pelumas power steering & clearance play steering knuckle untuk keamanan kendali driver.',
    typicalLifeRange: '20.000 – 35.000 HM',
    meshGroupKeys: ['steering'],
    explodedOffset: [1.8, -0.2, 1.6],
  },
  {
    id: 'brake-system',
    number: 11,
    name: 'Pneumatic Brake System & Air Compressor',
    nameId: 'Sistem Rem Angin Penuh (Full Air S-Cam)',
    systemCategory: 'Brake System',
    subComponents: ['Twin Cylinder Air Compressor', 'Air Dryer & Moisture Ejector', 'Air Reservoir Tanks (3x)', 'Spring Brake Actuator Chambers (Tristop)', 'Brake Drums & Heavy Linings'],
    unitId: 'DT-HN500-042',
    serialNumber: 'BR-FUL-60291',
    installHm: 0,
    actualHm: 24600,
    targetLifetimeHm: 30000,
    criticality: 'Wear',
    condition: 'Attention',
    lastReplacementDate: '2023-06-17',
    nextInspectionDate: '2026-10-25',
    inspectionIntervalHm: 250,
    recommendedAction: 'WARNING: 82% Life Used. Drain tangki udara harian untuk buang kondensasi air, ukur ketebalan kampas rem (lining > 8mm), periksa pushrod stroke.',
    maintenanceNotes: 'Cek kebocoran kompresor udara & performa pengereman darurat (emergency spring brake).',
    typicalLifeRange: '20.000 – 40.000 HM',
    meshGroupKeys: ['brakes'],
    explodedOffset: [-1.6, -0.8, -3.0],
  },
  {
    id: 'cooling-system',
    number: 12,
    name: 'Cooling System & Radiator',
    nameId: 'Radiator, Water Pump & Intercooler',
    systemCategory: 'Cooling System',
    subComponents: ['Heavy Duty Radiator Core', 'Water Pump Impeller & Mechanical Seal', 'Viscous / Hydraulic Driven Fan', 'Air-to-Air Intercooler', 'Thermostat Dual Valve'],
    unitId: 'DT-HN500-042',
    serialNumber: 'CL-RAD-78229',
    installHm: 0,
    actualHm: 11500,
    targetLifetimeHm: 22000,
    criticality: 'Wear',
    condition: 'Optimal',
    lastReplacementDate: '2024-06-01',
    nextInspectionDate: '2026-11-18',
    inspectionIntervalHm: 250,
    recommendedAction: 'Cuci kisi-kisi radiator dari debu batubara / tanah merah dengan water jet tekanan rendah. Uji konsentrasi coolant glycol (50:50).',
    maintenanceNotes: 'Cek kebocoran coolant, fungsi clutch fan saat temperatur mesin mencapai 88°C, dan kebersihan intercooler.',
    typicalLifeRange: '15.000 – 30.000 HM',
    meshGroupKeys: ['cooling_system'],
    explodedOffset: [0, 0.8, 3.2],
  },
  {
    id: 'electrical-system',
    number: 13,
    name: 'Electrical & Engine Control Unit (ECU)',
    nameId: 'Kelistrikan, Alternator & ECU',
    systemCategory: 'Electrical System',
    subComponents: ['24V 90A High-Output Alternator', 'Heavy Duty Reduction Starter Motor (6.0 kW)', 'Dual 150Ah Mining Battery Bank', 'Common Rail ECU & Harness', 'Mine Safety Beacon & Work Lights'],
    unitId: 'DT-HN500-042',
    serialNumber: 'EL-ECU-31998',
    installHm: 0,
    actualHm: 21000,
    targetLifetimeHm: 30000,
    criticality: 'High Cost',
    condition: 'Fair',
    lastReplacementDate: '2023-09-02',
    nextInspectionDate: '2026-12-10',
    inspectionIntervalHm: 500,
    recommendedAction: 'Tes output pengisian alternator (target: 27.5V - 28.5V), periksa kekencangan terminal aki dan proteksi harness dari gesekan chassis.',
    maintenanceNotes: 'Cek charging voltage & resistansi ground chassis. Bersihkan sensor-sensor dari tumpukan debu.',
    typicalLifeRange: '20.000 – 40.000 HM',
    meshGroupKeys: ['electrical'],
    explodedOffset: [-1.9, 0.2, 0.8],
  },
  {
    id: 'suspension',
    number: 14,
    name: 'Heavy Duty Suspension System',
    nameId: 'Suspensi Leaf Spring & Shock Absorber',
    systemCategory: 'Suspension & Chassis',
    subComponents: ['Front Multi-Leaf Spring Pack (12 Daun)', 'Rear Inverted Trunnion Bogie Spring Pack (16 Daun)', 'Heavy Telescopic Hydraulic Shock Absorbers', 'U-Bolts & Torque Rods with Rubber Bushing', 'Stabilizer Bar'],
    unitId: 'DT-HN500-042',
    serialNumber: 'SP-LEF-44102',
    installHm: 0,
    actualHm: 23100,
    targetLifetimeHm: 28000,
    criticality: 'Wear',
    condition: 'Attention',
    lastReplacementDate: '2023-04-05',
    nextInspectionDate: '2026-11-05',
    inspectionIntervalHm: 250,
    recommendedAction: 'WARNING: 82.5% Life Used. Periksa keretakan lembar daun pegas utama, re-torque mur U-Bolt (850 Nm), cek kebocoran oli shock absorber.',
    maintenanceNotes: 'Cek kekuatan pegas daun & potensi kebocoran seal oli shock absorber akibat beban over-tonnage.',
    typicalLifeRange: '20.000 – 35.000 HM',
    meshGroupKeys: ['suspension'],
    explodedOffset: [0, -0.9, -2.5],
  },
  {
    id: 'tyres-wheels',
    number: 15,
    name: 'Tyres & Wheels (10x Mining Grade 11.00R20)',
    nameId: 'Ban & Velg Tambang (10 Roda 6x4)',
    systemCategory: 'Tyres & Wheels',
    subComponents: ['11.00R20 Mining Lug Tires (E-4 Deep Tread)', '20-Inch Heavy Steel Disc Wheels', 'Wheel Studs & Flange Nuts (10 Baut)', 'Valve Stems & Heat Caps', 'Dual Tire Spacer Bands'],
    unitId: 'DT-HN500-042',
    serialNumber: 'TY-R20-00817',
    installHm: 5000,
    actualHm: 17200,
    targetLifetimeHm: 16000,
    criticality: 'Wear',
    condition: 'Critical',
    lastReplacementDate: '2024-01-20',
    nextInspectionDate: '2026-10-21',
    inspectionIntervalHm: 100,
    recommendedAction: 'OVERDUE (107%): Kedalaman tread ban roda penggerak belakang kiri luar sudah < 5mm. Segera lakukan rotasi / ganti ban baru untuk mencegah blowout di jalan tanjakan!',
    maintenanceNotes: 'Cek pola keausan tidak merata (tread wear), tekanan angin harian (115 PSI dingin), dan retak akibat batu tajam tambang.',
    typicalLifeRange: '10.000 – 25.000 HM',
    meshGroupKeys: ['wheels'],
    explodedOffset: [2.5, 0, 0],
  },
  {
    id: 'fuel-system',
    number: 16,
    name: 'Fuel System & Common Rail Injection',
    nameId: 'Sistem Bahan Bakar Solar & Injeksi Common Rail',
    systemCategory: 'Fuel System',
    subComponents: ['300L Steel Fuel Tank with Baffle', 'Primary Water-Separator Filter (10 Micron)', 'Secondary Fuel Filter (2 Micron)', 'Common Rail High Pressure Fuel Pump', 'Electronic Piezo Injectors (6x)'],
    unitId: 'DT-HN500-042',
    serialNumber: 'FL-CMR-50211',
    installHm: 0,
    actualHm: 13900,
    targetLifetimeHm: 25000,
    criticality: 'High Cost',
    condition: 'Optimal',
    lastReplacementDate: '2024-03-22',
    nextInspectionDate: '2026-11-12',
    inspectionIntervalHm: 250,
    recommendedAction: 'Ganti filter solar primer & sekunder, kuras air sedimenter bawah setiap pagi, cek fuel rail pressure saat beban puncak.',
    maintenanceNotes: 'Cek kualitas bahan bakar solar (kadar air / sulfur B35) untuk melindungi injector common rail presisi tinggi.',
    typicalLifeRange: '15.000 – 30.000 HM',
    meshGroupKeys: ['fuel_system'],
    explodedOffset: [-1.8, -0.4, 0.4],
  },
  {
    id: 'exhaust-system',
    number: 17,
    name: 'Exhaust System & Emission Control',
    nameId: 'Knalpot & Sistem Kontrol Emisi (DPF/SCR)',
    systemCategory: 'Exhaust System',
    subComponents: ['Cast Iron Exhaust Manifold', 'Stainless Flexible Exhaust Pipe', 'DPF / Catalytic Canister Silencer', 'Vertical Mining Exhaust Tailpipe Stack', 'Heat Shields & Clamps'],
    unitId: 'DT-HN500-042',
    serialNumber: 'EX-SCR-88402',
    installHm: 0,
    actualHm: 19100,
    targetLifetimeHm: 30000,
    criticality: 'Wear',
    condition: 'Optimal',
    lastReplacementDate: '2023-11-29',
    nextInspectionDate: '2026-12-15',
    inspectionIntervalHm: 500,
    recommendedAction: 'Cek kebocoran gas buang pada sambungan flex pipe, periksa backpressure knalpot, bersihkan kerak jelaga soot.',
    maintenanceNotes: 'Cek kebocoran & backpressure knalpot. Pastikan heat shield tidak bergetar dan membakar kabel sekitarnya.',
    typicalLifeRange: '20.000 – 40.000 HM',
    meshGroupKeys: ['exhaust'],
    explodedOffset: [1.7, 0.5, 0.2],
  },
  {
    id: 'dump-body',
    number: 18,
    name: 'Dump Rock Vessel Body & Chassis Frame',
    nameId: 'Bak Dump Tambang (Vessel) & Rangka Chassis',
    systemCategory: 'Dump Body & Hoist',
    subComponents: ['High Tensile Hardox 450 Steel Vessel (16 m³)', 'Cab Canopy Rock Protector Guard', 'Heavy Rear Pivot Hinges & Pins', 'Ladder Frame Chassis C-Channels', 'Dump Body Stabilizer Scissors'],
    unitId: 'DT-HN500-042',
    serialNumber: 'DB-VES-00331',
    installHm: 0,
    actualHm: 28200,
    targetLifetimeHm: 30000,
    criticality: 'High Cost',
    condition: 'Attention',
    lastReplacementDate: '2022-10-01',
    nextInspectionDate: '2026-10-24',
    inspectionIntervalHm: 500,
    recommendedAction: 'WARNING: 94% Life Used. Lakukan Ultrasonic Thickness Gauge (UTG) pada pelat lantai bak dump, cek keretakan las pada engsel pivot belakang.',
    maintenanceNotes: 'Cek retak plat & kebocoran oli hoist cylinder. Pastikan rubber cushion damper pada chassis tidak aus terbakar.',
    typicalLifeRange: '20.000 – 40.000 HM',
    meshGroupKeys: ['dump_body', 'chassis'],
    explodedOffset: [0, 2.2, -2.4],
  },
  {
    id: 'cabin-interior',
    number: 19,
    name: 'Mining Cab, ROPS/FOPS & Controls',
    nameId: 'Kabin Operator, Pelindung ROPS/FOPS & Interior',
    systemCategory: 'Cabin & Interior',
    subComponents: ['Reinforced Steel Cab Shell', 'ROPS / FOPS Safety Canopy Structure', 'Air Suspension Ergonomic Operator Seat', 'Digital Instrument Cluster & Gauge Panel', 'Cab Tilting Hydraulic Mechanism & Latches'],
    unitId: 'DT-HN500-042',
    serialNumber: 'CB-ROP-10022',
    installHm: 0,
    actualHm: 12000,
    targetLifetimeHm: 45000,
    criticality: 'High Cost',
    condition: 'Optimal',
    lastReplacementDate: '2024-04-15',
    nextInspectionDate: '2027-04-15',
    inspectionIntervalHm: 1000,
    recommendedAction: 'Periksa fungsi cab tilt lock sensor, periksa karet mounting kabin dan efektivitas filter AC kabin dari debu silica tambang.',
    maintenanceNotes: 'Struktur safety ROPS/FOPS krusial untuk perlindungan operator jika terjadi longsor batu atau insiden rollover.',
    typicalLifeRange: '35.000 – 50.000 HM',
    meshGroupKeys: ['cabin'],
    explodedOffset: [0, 1.4, 2.8],
  },
];

export function calculateRemainingHm(targetHm: number, actualHm: number): number {
  return Math.max(0, targetHm - actualHm);
}

export function calculateLifeUsedPercent(targetHm: number, actualHm: number): number {
  if (targetHm <= 0) return 0;
  const pct = (actualHm / targetHm) * 100;
  return Math.round(pct * 10) / 10;
}

export function calculateComponentStatus(
  actualHm: number,
  targetHm: number,
  thresholds: LifetimeThresholds = DEFAULT_THRESHOLDS
): ComponentStatus {
  if (targetHm <= 0 || actualHm === undefined || isNaN(actualHm)) {
    return 'NOT_AVAILABLE';
  }
  const pct = calculateLifeUsedPercent(targetHm, actualHm);
  if (pct >= thresholds.overduePercent) {
    return 'OVERDUE';
  }
  if (pct >= thresholds.warningPercent) {
    return 'WARNING';
  }
  return 'NORMAL';
}

export function getComponentStatus(
  component: HinoComponent,
  thresholds: LifetimeThresholds = DEFAULT_THRESHOLDS
): ComponentStatus {
  return calculateComponentStatus(component.actualHm, component.targetLifetimeHm, thresholds);
}

export function getStatusColor(status: ComponentStatus): {
  bg: string;
  text: string;
  border: string;
  hex: string;
  label: string;
} {
  switch (status) {
    case 'NORMAL':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        hex: '#10b981',
        label: 'Normal (> 20% sisa)',
      };
    case 'WARNING':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        hex: '#f59e0b',
        label: 'Warning (10 - 20% sisa)',
      };
    case 'OVERDUE':
      return {
        bg: 'bg-red-500/15',
        text: 'text-red-400',
        border: 'border-red-500/40',
        hex: '#ef4444',
        label: 'Overdue (< 10% sisa / Exceeded)',
      };
    case 'NOT_AVAILABLE':
    default:
      return {
        bg: 'bg-slate-500/15',
        text: 'text-slate-400',
        border: 'border-slate-500/40',
        hex: '#94a3b8',
        label: 'Data Belum Tersedia',
      };
  }
}

export function getCriticalityBadge(criticality: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (criticality) {
    case 'Critical':
      return {
        bg: 'bg-rose-950/70',
        text: 'text-rose-400',
        border: 'border-rose-500/50',
      };
    case 'High Cost':
      return {
        bg: 'bg-amber-950/70',
        text: 'text-amber-400',
        border: 'border-amber-500/50',
      };
    case 'Wear':
    default:
      return {
        bg: 'bg-sky-950/70',
        text: 'text-sky-400',
        border: 'border-sky-500/50',
      };
  }
}

export const STORAGE_KEY_COMPONENTS = 'mineroz_hino500_components_v1';
export const STORAGE_KEY_THRESHOLDS = 'mineroz_hino500_thresholds_v1';

export function loadStoredComponents(): HinoComponent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPONENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((comp: HinoComponent) => {
          const initMatch = INITIAL_HINO_COMPONENTS.find((i) => i.id === comp.id);
          const explodedOffset = initMatch ? initMatch.explodedOffset : comp.explodedOffset;
          const maintenanceHistory =
            !comp.maintenanceHistory || comp.maintenanceHistory.length === 0
              ? DEFAULT_MAINTENANCE_HISTORIES[comp.id] || []
              : comp.maintenanceHistory;

          return {
            ...comp,
            explodedOffset,
            maintenanceHistory,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load components from localStorage:', err);
  }
  return INITIAL_HINO_COMPONENTS.map((comp) => ({
    ...comp,
    maintenanceHistory: comp.maintenanceHistory || DEFAULT_MAINTENANCE_HISTORIES[comp.id] || [],
  }));
}

export function addMaintenanceRecordToComponent(
  components: HinoComponent[],
  componentId: string,
  record: Omit<MaintenanceRecord, 'id' | 'componentId'>
): HinoComponent[] {
  const newRecord: MaintenanceRecord = {
    ...record,
    id: `hist-${componentId}-${Date.now()}`,
    componentId,
  };

  return components.map((comp) => {
    if (comp.id === componentId) {
      const existingHistory = comp.maintenanceHistory || [];
      return {
        ...comp,
        maintenanceHistory: [newRecord, ...existingHistory],
      };
    }
    return comp;
  });
}

export function deleteMaintenanceRecordFromComponent(
  components: HinoComponent[],
  componentId: string,
  recordId: string
): HinoComponent[] {
  return components.map((comp) => {
    if (comp.id === componentId) {
      const existingHistory = comp.maintenanceHistory || [];
      return {
        ...comp,
        maintenanceHistory: existingHistory.filter((r) => r.id !== recordId),
      };
    }
    return comp;
  });
}

export function saveStoredComponents(components: HinoComponent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMPONENTS, JSON.stringify(components));
  } catch (err) {
    console.warn('Failed to save components to localStorage:', err);
  }
}

export function loadStoredThresholds(): LifetimeThresholds {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THRESHOLDS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load thresholds from localStorage:', err);
  }
  return DEFAULT_THRESHOLDS;
}

export function saveStoredThresholds(thresholds: LifetimeThresholds): void {
  try {
    localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(thresholds));
  } catch (err) {
    console.warn('Failed to save thresholds to localStorage:', err);
  }
}
