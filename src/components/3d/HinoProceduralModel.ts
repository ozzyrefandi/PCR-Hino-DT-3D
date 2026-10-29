import * as THREE from 'three';

export interface ComponentMeshInfo {
  group: THREE.Group;
  componentId: string;
  originalPosition: THREE.Vector3;
  originalRotation: THREE.Euler;
  explodedOffset: THREE.Vector3;
  materials: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
}

export function createHino500Model(): {
  rootGroup: THREE.Group;
  componentMeshMap: Map<string, ComponentMeshInfo>;
  dumpBodyPivotGroup: THREE.Group;
} {
  const root = new THREE.Group();
  root.name = 'HINO_500_MINING_TRUCK';

  const componentMeshMap = new Map<string, ComponentMeshInfo>();

  // Base PBR Materials
  const miningGreenMat = new THREE.MeshStandardMaterial({
    color: 0x55802c, // Authentic Hino 500 Mining Green
    roughness: 0.35,
    metalness: 0.25,
  });

  const miningGreenDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3e611e,
    roughness: 0.45,
    metalness: 0.2,
  });

  const darkChassisMat = new THREE.MeshStandardMaterial({
    color: 0x181c22,
    roughness: 0.5,
    metalness: 0.7,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x717984,
    roughness: 0.35,
    metalness: 0.85,
  });

  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x2b313a,
    roughness: 0.7,
    metalness: 0.5,
  });

  const engineAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.8,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.95,
  });

  const turboGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.25,
    metalness: 0.85,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.35,
    metalness: 0.8,
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: 0x16181b,
    roughness: 0.85,
    metalness: 0.05,
  });

  const wheelRimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.8,
  });

  const safetyYellowMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.4,
    metalness: 0.3,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.85,
    ior: 1.5,
    thickness: 0.5,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0xffeedd,
    emissiveIntensity: 0.4,
  });

  const redLightMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0x991b1b,
    emissiveIntensity: 0.5,
  });

  const helperRegisterComponent = (
    id: string,
    group: THREE.Group,
    offset: [number, number, number]
  ) => {
    group.name = id;
    const materials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData = { componentId: id, partName: child.name || id };
        materials.set(child, child.material);
      }
    });

    componentMeshMap.set(id, {
      group,
      componentId: id,
      originalPosition: group.position.clone(),
      originalRotation: group.rotation.clone(),
      explodedOffset: new THREE.Vector3(...offset),
      materials,
    });
    root.add(group);
  };

  // ==========================================
  // 1. CHASSIS FRAME (Rangka Utama C-Channel)
  // ==========================================
  const chassisGroup = new THREE.Group();
  {
    // Dual Longitudinal C-Channel rails
    const railGeom = new THREE.BoxGeometry(0.12, 0.28, 9.2);
    const leftRail = new THREE.Mesh(railGeom, darkChassisMat);
    leftRail.position.set(-0.46, 0.9, -0.6);
    const rightRail = new THREE.Mesh(railGeom, darkChassisMat);
    rightRail.position.set(0.46, 0.9, -0.6);
    chassisGroup.add(leftRail, rightRail);

    // Crossmembers (7 cross bars along frame)
    const crossGeom = new THREE.BoxGeometry(0.84, 0.18, 0.12);
    const crossZPositions = [3.4, 2.0, 0.6, -0.8, -2.2, -3.6, -4.9];
    crossZPositions.forEach((z) => {
      const cm = new THREE.Mesh(crossGeom, darkChassisMat);
      cm.position.set(0, 0.9, z);
      chassisGroup.add(cm);
    });

    // Front Bumper heavy steel
    const bumperGeom = new THREE.BoxGeometry(2.4, 0.42, 0.35);
    const frontBumper = new THREE.Mesh(bumperGeom, darkChassisMat);
    frontBumper.position.set(0, 0.65, 3.85);
    chassisGroup.add(frontBumper);

    // Tow hook / pin at front
    const towPinGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 16);
    const towPin = new THREE.Mesh(towPinGeom, steelMat);
    towPin.rotation.x = Math.PI / 2;
    towPin.position.set(0, 0.65, 4.05);
    chassisGroup.add(towPin);

    // Under-run side protector guards (left & right safety bars)
    const guardRailGeom = new THREE.CylinderGeometry(0.03, 0.03, 2.6, 12);
    [-1.05, 1.05].forEach((x) => {
      const gTop = new THREE.Mesh(guardRailGeom, darkChassisMat);
      gTop.rotation.x = Math.PI / 2;
      gTop.position.set(x, 0.58, -0.6);

      const gBottom = new THREE.Mesh(guardRailGeom, darkChassisMat);
      gBottom.rotation.x = Math.PI / 2;
      gBottom.position.set(x, 0.38, -0.6);

      chassisGroup.add(gTop, gBottom);
    });

    // Rear under-run bar & light brackets
    const rearBarGeom = new THREE.BoxGeometry(2.3, 0.14, 0.12);
    const rearBar = new THREE.Mesh(rearBarGeom, darkChassisMat);
    rearBar.position.set(0, 0.55, -5.1);
    chassisGroup.add(rearBar);

    // Rear brake lights
    const rearLightGeom = new THREE.BoxGeometry(0.24, 0.08, 0.04);
    [-0.8, 0.8].forEach((x) => {
      const rl = new THREE.Mesh(rearLightGeom, redLightMat);
      rl.position.set(x, 0.55, -5.18);
      chassisGroup.add(rl);
    });
  }
  helperRegisterComponent('chassis', chassisGroup, [0, -0.4, 0]);

  // ==========================================
  // 2. CABIN & INTERIOR (Kabin Hino 500)
  // ==========================================
  const cabinGroup = new THREE.Group();
  {
    // Main Cab lower shell
    const cabLowerGeom = new THREE.BoxGeometry(2.35, 1.35, 1.95);
    const cabLower = new THREE.Mesh(cabLowerGeom, miningGreenMat);
    cabLower.position.set(0, 1.85, 2.75);
    cabinGroup.add(cabLower);

    // Cab upper roof / taper
    const cabRoofGeom = new THREE.BoxGeometry(2.3, 0.45, 1.75);
    const cabRoof = new THREE.Mesh(cabRoofGeom, miningGreenDarkMat);
    cabRoof.position.set(0, 2.62, 2.7);
    cabinGroup.add(cabRoof);

    // Aerodynamic Sun Visor over windshield
    const visorGeom = new THREE.BoxGeometry(2.38, 0.12, 0.35);
    const visor = new THREE.Mesh(visorGeom, darkChassisMat);
    visor.position.set(0, 2.72, 3.72);
    visor.rotation.x = 0.25;
    cabinGroup.add(visor);

    // Front Windshield Glass
    const windshieldGeom = new THREE.BoxGeometry(2.05, 0.8, 0.04);
    const windshield = new THREE.Mesh(windshieldGeom, glassMat);
    windshield.position.set(0, 2.2, 3.73);
    windshield.rotation.x = -0.12;
    cabinGroup.add(windshield);

    // Side Door Windows
    const sideWinGeom = new THREE.BoxGeometry(0.04, 0.65, 0.95);
    const leftWin = new THREE.Mesh(sideWinGeom, glassMat);
    leftWin.position.set(-1.18, 2.2, 2.75);
    const rightWin = new THREE.Mesh(sideWinGeom, glassMat);
    rightWin.position.set(1.18, 2.2, 2.75);
    cabinGroup.add(leftWin, rightWin);

    // HINO Front Grille (dark matte with chrome wings)
    const grilleGeom = new THREE.BoxGeometry(1.6, 0.55, 0.08);
    const grille = new THREE.Mesh(grilleGeom, darkChassisMat);
    grille.position.set(0, 1.48, 3.74);
    cabinGroup.add(grille);

    // Hino Chrome Wings / Center Logo bar
    const emblemGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.05, 16);
    const emblem = new THREE.Mesh(emblemGeom, chromeMat);
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, 1.55, 3.79);
    cabinGroup.add(emblem);

    // Headlights
    const headlightGeom = new THREE.BoxGeometry(0.35, 0.22, 0.08);
    [-0.85, 0.85].forEach((x) => {
      const hl = new THREE.Mesh(headlightGeom, headlightMat);
      hl.position.set(x, 1.15, 3.82);
      cabinGroup.add(hl);
    });

    // Side Mirrors
    [-1.32, 1.32].forEach((x) => {
      const mirrorArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8),
        darkChassisMat
      );
      mirrorArm.position.set(x, 2.25, 3.4);
      const mirrorHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.42, 0.18),
        darkChassisMat
      );
      mirrorHousing.position.set(x, 2.25, 3.4);
      cabinGroup.add(mirrorArm, mirrorHousing);
    });

    // Cab Interior: Seats & Steering wheel
    const seatGeom = new THREE.BoxGeometry(0.5, 0.65, 0.5);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const seatDriver = new THREE.Mesh(seatGeom, seatMat);
    seatDriver.position.set(-0.6, 1.7, 2.5);
    const seatPassenger = new THREE.Mesh(seatGeom, seatMat);
    seatPassenger.position.set(0.6, 1.7, 2.5);
    cabinGroup.add(seatDriver, seatPassenger);

    // Steering wheel
    const steerTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.025, 8, 20),
      darkChassisMat
    );
    steerTorus.position.set(-0.6, 1.95, 3.1);
    steerTorus.rotation.x = 0.6;
    cabinGroup.add(steerTorus);
  }
  helperRegisterComponent('cabin-interior', cabinGroup, [0, 1.4, 2.8]);

  // ==========================================
  // 3. DUMP BODY & ROCK VESSEL (Bak Tambang)
  // ==========================================
  const dumpBodyGroup = new THREE.Group();
  const dumpBodyPivotGroup = new THREE.Group();
  dumpBodyPivotGroup.position.set(0, 1.15, -4.8); // Hinge pivot at rear chassis
  {
    // Main vessel box interior relative to pivot
    // Floor
    const floorGeom = new THREE.BoxGeometry(2.45, 0.14, 5.4);
    const vesselFloor = new THREE.Mesh(floorGeom, miningGreenMat);
    vesselFloor.position.set(0, 0.25, 2.6);
    dumpBodyGroup.add(vesselFloor);

    // Slanted Sides (Left & Right walls)
    const wallGeom = new THREE.BoxGeometry(0.1, 1.35, 5.4);
    const leftWall = new THREE.Mesh(wallGeom, miningGreenMat);
    leftWall.position.set(-1.22, 0.95, 2.6);
    const rightWall = new THREE.Mesh(wallGeom, miningGreenMat);
    rightWall.position.set(1.22, 0.95, 2.6);
    dumpBodyGroup.add(leftWall, rightWall);

    // Front bulkhead wall
    const frontWallGeom = new THREE.BoxGeometry(2.45, 1.45, 0.12);
    const frontWall = new THREE.Mesh(frontWallGeom, miningGreenDarkMat);
    frontWall.position.set(0, 1.0, 5.25);
    dumpBodyGroup.add(frontWall);

    // Rock Protector Canopy over cabin
    const canopyGeom = new THREE.BoxGeometry(2.48, 0.1, 1.6);
    const canopy = new THREE.Mesh(canopyGeom, miningGreenDarkMat);
    canopy.position.set(0, 1.75, 5.9);
    canopy.rotation.x = -0.15;
    dumpBodyGroup.add(canopy);

    // Vertical structural reinforcement ribs on sides (Mining Spec)
    const ribGeom = new THREE.BoxGeometry(0.08, 1.25, 0.08);
    for (let r = 0; r < 6; r++) {
      const zOffset = 0.5 + r * 0.85;
      const leftRib = new THREE.Mesh(ribGeom, miningGreenDarkMat);
      leftRib.position.set(-1.28, 0.95, zOffset);
      const rightRib = new THREE.Mesh(ribGeom, miningGreenDarkMat);
      rightRib.position.set(1.28, 0.95, zOffset);
      dumpBodyGroup.add(leftRib, rightRib);
    }

    // Rear tailgate / chute
    const rearWallGeom = new THREE.BoxGeometry(2.45, 1.1, 0.1);
    const rearWall = new THREE.Mesh(rearWallGeom, miningGreenDarkMat);
    rearWall.position.set(0, 0.85, 0.0);
    dumpBodyGroup.add(rearWall);

    // Safety Chevron sticker banner at rear
    const chevronGeom = new THREE.BoxGeometry(2.2, 0.18, 0.02);
    const chevronMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.5,
    });
    const chevron = new THREE.Mesh(chevronGeom, chevronMat);
    chevron.position.set(0, 0.45, -0.06);
    dumpBodyGroup.add(chevron);
  }
  dumpBodyPivotGroup.add(dumpBodyGroup);
  helperRegisterComponent('dump-body', dumpBodyPivotGroup, [0, 2.2, -2.4]);

  // ==========================================
  // 4. HYDRAULIC HOIST CYLINDER & PUMP
  // ==========================================
  const hydraulicGroup = new THREE.Group();
  {
    // Telescopic Hoist Ram (3 stages)
    const cylinderBaseGeom = new THREE.CylinderGeometry(0.18, 0.18, 1.4, 20);
    const cylinderBase = new THREE.Mesh(cylinderBaseGeom, safetyYellowMat);
    cylinderBase.position.set(0, 1.5, 0.95);
    cylinderBase.rotation.x = 0.15;

    const chromeStage1Geom = new THREE.CylinderGeometry(0.14, 0.14, 1.2, 20);
    const chromeStage1 = new THREE.Mesh(chromeStage1Geom, chromeMat);
    chromeStage1.position.set(0, 1.9, 0.88);
    chromeStage1.rotation.x = 0.15;

    const chromeStage2Geom = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 20);
    const chromeStage2 = new THREE.Mesh(chromeStage2Geom, chromeMat);
    chromeStage2.position.set(0, 2.3, 0.82);
    chromeStage2.rotation.x = 0.15;

    hydraulicGroup.add(cylinderBase, chromeStage1, chromeStage2);

    // Hydraulic Fluid Reservoir Tank (side mounted)
    const hydTankGeom = new THREE.BoxGeometry(0.45, 0.65, 0.75);
    const hydTank = new THREE.Mesh(hydTankGeom, darkChassisMat);
    hydTank.position.set(0.85, 0.85, 0.6);

    // Hydraulic sight glass
    const sightGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.25, 0.05),
      glassMat
    );
    sightGlass.position.set(1.08, 0.85, 0.6);

    // Hydraulic Gear Pump
    const pumpGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16);
    const hydPump = new THREE.Mesh(pumpGeom, castIronMat);
    hydPump.rotation.z = Math.PI / 2;
    hydPump.position.set(0.55, 0.65, 0.15);

    // Hydraulic high pressure hoses
    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.55, 0.65, 0.15),
      new THREE.Vector3(0.3, 0.8, 0.5),
      new THREE.Vector3(0.0, 1.2, 0.9),
    ]);
    const hoseGeom = new THREE.TubeGeometry(hoseCurve, 16, 0.03, 8, false);
    const hose = new THREE.Mesh(hoseGeom, darkChassisMat);

    hydraulicGroup.add(hydTank, sightGlass, hydPump, hose);
  }
  helperRegisterComponent('hydraulic-pump', hydraulicGroup, [-1.8, 1.2, -1.0]);

  // ==========================================
  // 5. ENGINE ASSEMBLY (J08E Diesel Inline-6)
  // ==========================================
  const engineGroup = new THREE.Group();
  {
    // Engine Block cast iron
    const blockGeom = new THREE.BoxGeometry(0.65, 0.68, 1.15);
    const block = new THREE.Mesh(blockGeom, castIronMat);
    block.position.set(0, 1.05, 2.45);

    // Cylinder Head & Valve Cover
    const headGeom = new THREE.BoxGeometry(0.55, 0.26, 1.15);
    const head = new THREE.Mesh(headGeom, engineAlloyMat);
    head.position.set(0, 1.48, 2.45);

    // Ribbed Oil Pan
    const panGeom = new THREE.BoxGeometry(0.52, 0.22, 1.05);
    const pan = new THREE.Mesh(panGeom, darkChassisMat);
    pan.position.set(0, 0.62, 2.45);

    // Front Pulley & Serpentine Belt
    const pulleyGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 20);
    const pulley = new THREE.Mesh(pulleyGeom, steelMat);
    pulley.rotation.x = Math.PI / 2;
    pulley.position.set(0, 0.95, 3.05);

    // Intake Manifold
    const intakeGeom = new THREE.BoxGeometry(0.18, 0.18, 1.05);
    const intake = new THREE.Mesh(intakeGeom, engineAlloyMat);
    intake.position.set(-0.38, 1.35, 2.45);

    engineGroup.add(block, head, pan, pulley, intake);
  }
  helperRegisterComponent('engine-assy', engineGroup, [0, 1.8, 0.6]);

  // ==========================================
  // 6. TURBOCHARGER UNIT
  // ==========================================
  const turboGroup = new THREE.Group();
  {
    // Turbine Housing (Golden Bronze)
    const turbineGeom = new THREE.TorusGeometry(0.14, 0.065, 12, 20);
    const turbine = new THREE.Mesh(turbineGeom, turboGoldMat);
    turbine.rotation.y = Math.PI / 2;
    turbine.position.set(0.42, 1.32, 2.25);

    // Compressor Housing (Aluminum Alloy)
    const compGeom = new THREE.TorusGeometry(0.15, 0.07, 12, 20);
    const comp = new THREE.Mesh(compGeom, engineAlloyMat);
    comp.rotation.y = Math.PI / 2;
    comp.position.set(0.42, 1.32, 2.48);

    // Wastegate Actuator Canister
    const actGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.14, 12);
    const actuator = new THREE.Mesh(actGeom, chromeMat);
    actuator.position.set(0.48, 1.5, 2.36);

    // Boost pipe connecting to intercooler
    const pipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.42, 1.32, 2.55),
      new THREE.Vector3(0.48, 1.25, 2.95),
      new THREE.Vector3(0.25, 1.15, 3.35),
    ]);
    const boostPipe = new THREE.Mesh(
      new THREE.TubeGeometry(pipeCurve, 16, 0.05, 8, false),
      steelMat
    );

    turboGroup.add(turbine, comp, actuator, boostPipe);
  }
  helperRegisterComponent('turbocharger', turboGroup, [1.6, 1.5, 0.6]);

  // ==========================================
  // 7. COOLING SYSTEM (Radiator, Fan & Intercooler)
  // ==========================================
  const coolingGroup = new THREE.Group();
  {
    // Heavy Mining Radiator Core
    const radGeom = new THREE.BoxGeometry(1.45, 0.88, 0.15);
    const radMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.7,
      metalness: 0.6,
    });
    const radiator = new THREE.Mesh(radGeom, radMat);
    radiator.position.set(0, 1.2, 3.52);

    // Intercooler Core (Mounted in front of radiator)
    const icGeom = new THREE.BoxGeometry(1.25, 0.45, 0.08);
    const intercooler = new THREE.Mesh(icGeom, engineAlloyMat);
    intercooler.position.set(0, 0.95, 3.65);

    // Cooling Fan & Shroud
    const shroudGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 24, 1, true);
    const shroud = new THREE.Mesh(shroudGeom, darkChassisMat);
    shroud.rotation.x = Math.PI / 2;
    shroud.position.set(0, 1.2, 3.35);

    // Fan blades
    const fanBladeGeom = new THREE.BoxGeometry(0.74, 0.1, 0.02);
    const fanMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const fan1 = new THREE.Mesh(fanBladeGeom, fanMat);
    fan1.position.set(0, 1.2, 3.35);
    const fan2 = fan1.clone();
    fan2.rotation.z = Math.PI / 3;
    const fan3 = fan1.clone();
    fan3.rotation.z = (Math.PI * 2) / 3;

    coolingGroup.add(radiator, intercooler, shroud, fan1, fan2, fan3);
  }
  helperRegisterComponent('cooling-system', coolingGroup, [0, 0.8, 3.2]);

  // ==========================================
  // ==========================================
  // 8. TRANSMISSION & CLUTCH / TORQUE CONVERTER
  // ==========================================
  const transGroup = new THREE.Group();
  {
    // Transmission Casing (9-Speed Heavy Duty Gearbox)
    const transCaseGeom = new THREE.BoxGeometry(0.55, 0.55, 1.15);
    const transCase = new THREE.Mesh(transCaseGeom, engineAlloyMat);
    transCase.position.set(0, 0.85, 0.85);

    // Output Flange
    const flangeGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16);
    const flange = new THREE.Mesh(flangeGeom, steelMat);
    flange.rotation.x = Math.PI / 2;
    flange.position.set(0, 0.78, 0.24);

    // PTO Gearbox unit on side
    const ptoGeom = new THREE.BoxGeometry(0.24, 0.28, 0.32);
    const pto = new THREE.Mesh(ptoGeom, castIronMat);
    pto.position.set(0.35, 0.75, 0.82);

    transGroup.add(transCase, flange, pto);
  }
  helperRegisterComponent('transmission', transGroup, [0, -0.7, -1.0]);

  // Clutch / Torque Converter Assembly
  const clutchGroup = new THREE.Group();
  {
    // Bellhousing Casing (attaches to rear of engine and front of transmission)
    const bellGeom = new THREE.CylinderGeometry(0.42, 0.49, 0.44, 24);
    const bell = new THREE.Mesh(bellGeom, engineAlloyMat);
    bell.rotation.x = Math.PI / 2;
    bell.position.set(0, 0.95, 1.65);

    // Flywheel Starter Ring Gear
    const ringGeom = new THREE.CylinderGeometry(0.51, 0.51, 0.05, 32);
    const flywheelRing = new THREE.Mesh(ringGeom, steelMat);
    flywheelRing.rotation.x = Math.PI / 2;
    flywheelRing.position.set(0, 0.95, 1.84);

    // Internal Torque Converter Impeller / Turbine Torus
    const tcGeom = new THREE.TorusGeometry(0.30, 0.08, 16, 24);
    const torqueConverter = new THREE.Mesh(tcGeom, turboGoldMat);
    torqueConverter.rotation.y = Math.PI / 2;
    torqueConverter.position.set(0, 0.95, 1.65);

    // Heavy Clutch Friction Disc Pack
    const discGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.07, 24);
    const clutchDisc = new THREE.Mesh(discGeom, castIronMat);
    clutchDisc.rotation.x = Math.PI / 2;
    clutchDisc.position.set(0, 0.95, 1.65);

    // Pneumatic Clutch Slave Cylinder Booster
    const boosterGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.28, 16);
    const booster = new THREE.Mesh(boosterGeom, castIronMat);
    booster.position.set(-0.46, 0.92, 1.65);

    // Pushrod linkage
    const pushrodGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8);
    const pushrod = new THREE.Mesh(pushrodGeom, steelMat);
    pushrod.position.set(-0.42, 0.82, 1.65);

    clutchGroup.add(bell, flywheelRing, torqueConverter, clutchDisc, booster, pushrod);
  }
  helperRegisterComponent('clutch-torque', clutchGroup, [0, 1.1, -0.3]);

  // ==========================================
  // 9. PROPELLER / DRIVE SHAFT & U-JOINTS
  // ==========================================
  const propGroup = new THREE.Group();
  {
    // Front Propshaft (Transmission to Center Bearing)
    const shaft1Geom = new THREE.CylinderGeometry(0.05, 0.05, 1.45, 16);
    const shaft1 = new THREE.Mesh(shaft1Geom, steelMat);
    shaft1.rotation.x = 1.62;
    shaft1.position.set(0, 0.72, -0.48);

    // Center Support Bearing Carrier
    const centerBearingGeom = new THREE.TorusGeometry(0.12, 0.04, 8, 16);
    const centerBearing = new THREE.Mesh(centerBearingGeom, castIronMat);
    centerBearing.position.set(0, 0.69, -1.2);

    // Rear Propshaft (Center Bearing to Tandem Intermediate Axle)
    const shaft2Geom = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 16);
    const shaft2 = new THREE.Mesh(shaft2Geom, steelMat);
    shaft2.rotation.x = 1.62;
    shaft2.position.set(0, 0.66, -1.95);

    // Inter-Axle Jackshaft (Between middle and rear diff)
    const shaft3Geom = new THREE.CylinderGeometry(0.045, 0.045, 1.25, 16);
    const shaft3 = new THREE.Mesh(shaft3Geom, steelMat);
    shaft3.rotation.x = 1.57;
    shaft3.position.set(0, 0.62, -3.35);

    // U-Joint spiders
    const uJointGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const uj1 = new THREE.Mesh(uJointGeom, turboGoldMat);
    uj1.position.set(0, 0.76, 0.22);
    const uj2 = new THREE.Mesh(uJointGeom, turboGoldMat);
    uj2.position.set(0, 0.68, -1.18);
    const uj3 = new THREE.Mesh(uJointGeom, turboGoldMat);
    uj3.position.set(0, 0.63, -2.7);

    propGroup.add(shaft1, centerBearing, shaft2, shaft3, uj1, uj2, uj3);
  }
  helperRegisterComponent('drive-shaft', propGroup, [0, -1.0, -2.2]);

  // ==========================================
  // 10. FRONT AXLE & STEERING LINKAGE
  // ==========================================
  const frontAxleGroup = new THREE.Group();
  {
    // Forged I-Beam front axle
    const beamGeom = new THREE.BoxGeometry(1.9, 0.14, 0.12);
    const beam = new THREE.Mesh(beamGeom, castIronMat);
    beam.position.set(0, 0.58, 2.45);

    // Steering Knuckles left and right
    [-0.95, 0.95].forEach((x) => {
      const knuckle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.28, 12),
        steelMat
      );
      knuckle.position.set(x, 0.58, 2.45);
      frontAxleGroup.add(knuckle);
    });

    // Tie-rod connecting steering knuckles
    const tieRodGeom = new THREE.CylinderGeometry(0.025, 0.025, 1.85, 12);
    const tieRod = new THREE.Mesh(tieRodGeom, steelMat);
    tieRod.rotation.z = Math.PI / 2;
    tieRod.position.set(0, 0.52, 2.36);

    frontAxleGroup.add(beam, tieRod);
  }
  helperRegisterComponent('axle-housing', frontAxleGroup, [0, -1.5, -3.2]);

  // Steering Gearbox & linkage
  const steeringGroup = new THREE.Group();
  {
    const steerBoxGeom = new THREE.BoxGeometry(0.24, 0.32, 0.28);
    const steerBox = new THREE.Mesh(steerBoxGeom, castIronMat);
    steerBox.position.set(-0.55, 0.88, 2.75);

    const pitmanGeom = new THREE.BoxGeometry(0.05, 0.25, 0.05);
    const pitman = new THREE.Mesh(pitmanGeom, steelMat);
    pitman.position.set(-0.58, 0.72, 2.68);
    pitman.rotation.x = 0.3;

    const dragLinkGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.85, 12);
    const dragLink = new THREE.Mesh(dragLinkGeom, steelMat);
    dragLink.rotation.x = 1.35;
    dragLink.position.set(-0.72, 0.62, 2.5);

    steeringGroup.add(steerBox, pitman, dragLink);
  }
  helperRegisterComponent('steering-system', steeringGroup, [1.8, -0.2, 1.6]);

  // ==========================================
  // 11. REAR TANDEM AXLES & DIFFERENTIALS
  // ==========================================
  const diffGroup = new THREE.Group();
  {
    // Middle Axle Housing
    const axleMidGeom = new THREE.CylinderGeometry(0.12, 0.12, 2.1, 16);
    const axleMid = new THREE.Mesh(axleMidGeom, castIronMat);
    axleMid.rotation.z = Math.PI / 2;
    axleMid.position.set(0, 0.58, -2.7);

    // Middle Diff Pumpkin (Telur Gardan Tengah)
    const diffPumpkinGeom = new THREE.SphereGeometry(0.26, 16, 16);
    const diffMid = new THREE.Mesh(diffPumpkinGeom, castIronMat);
    diffMid.position.set(0, 0.58, -2.7);

    // Rear Axle Housing
    const axleRearGeom = new THREE.CylinderGeometry(0.12, 0.12, 2.1, 16);
    const axleRear = new THREE.Mesh(axleRearGeom, castIronMat);
    axleRear.rotation.z = Math.PI / 2;
    axleRear.position.set(0, 0.58, -4.0);

    // Rear Diff Pumpkin (Telur Gardan Belakang)
    const diffRear = new THREE.Mesh(diffPumpkinGeom, castIronMat);
    diffRear.position.set(0, 0.58, -4.0);

    diffGroup.add(axleMid, diffMid, axleRear, diffRear);
  }
  helperRegisterComponent('differential', diffGroup, [0, -1.2, -4.5]);

  // Final Drive & Planetary Hubs
  const finalDriveGroup = new THREE.Group();
  {
    const hubGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 16);
    // 4 rear wheel positions (left and right of both tandem axles)
    const hubCoords = [
      [-1.12, 0.58, -2.7],
      [1.12, 0.58, -2.7],
      [-1.12, 0.58, -4.0],
      [1.12, 0.58, -4.0],
    ];
    hubCoords.forEach(([x, y, z]) => {
      const hub = new THREE.Mesh(hubGeom, steelMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(x, y, z);
      finalDriveGroup.add(hub);
    });
  }
  helperRegisterComponent('final-drive', finalDriveGroup, [2.0, 0, -4.5]);

  // ==========================================
  // 12. BRAKE SYSTEM (Pneumatic Tanks & Chambers)
  // ==========================================
  const brakeGroup = new THREE.Group();
  {
    // Compressed Air Tanks (Trio of cylindrical air vessels on chassis)
    const airTankGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.75, 16);
    const tank1 = new THREE.Mesh(airTankGeom, darkChassisMat);
    tank1.rotation.x = Math.PI / 2;
    tank1.position.set(-0.75, 0.7, -0.6);

    const tank2 = new THREE.Mesh(airTankGeom, darkChassisMat);
    tank2.rotation.x = Math.PI / 2;
    tank2.position.set(-0.75, 0.7, -1.4);

    // Brake Chambers (Tristop spring brakes near rear hubs)
    const chamberGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.18, 12);
    const brakeChambers = [
      [-0.82, 0.75, 2.45],
      [0.82, 0.75, 2.45],
      [-0.82, 0.75, -2.7],
      [0.82, 0.75, -2.7],
      [-0.82, 0.75, -4.0],
      [0.82, 0.75, -4.0],
    ];
    brakeChambers.forEach(([x, y, z]) => {
      const bc = new THREE.Mesh(chamberGeom, castIronMat);
      bc.position.set(x, y, z);
      brakeGroup.add(bc);
    });

    brakeGroup.add(tank1, tank2);
  }
  helperRegisterComponent('brake-system', brakeGroup, [-1.6, -0.8, -3.0]);

  // ==========================================
  // 13. SUSPENSION SYSTEM (Heavy Leaf Springs)
  // ==========================================
  const suspensionGroup = new THREE.Group();
  {
    // Front Leaf Spring Packs (curved semi-elliptic)
    const frontSpringGeom = new THREE.BoxGeometry(0.12, 0.16, 1.45);
    const fSpringL = new THREE.Mesh(frontSpringGeom, steelMat);
    fSpringL.position.set(-0.52, 0.68, 2.45);
    const fSpringR = new THREE.Mesh(frontSpringGeom, steelMat);
    fSpringR.position.set(0.52, 0.68, 2.45);

    // Front Hydraulic Shock Absorbers
    const shockGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 12);
    [-0.56, 0.56].forEach((x) => {
      const shock = new THREE.Mesh(shockGeom, safetyYellowMat);
      shock.position.set(x, 0.82, 2.45);
      suspensionGroup.add(shock);
    });

    // Rear Bogie Trunnion Spring (Inverted leaf spring pack connecting tandem axles)
    const bogieSpringGeom = new THREE.BoxGeometry(0.16, 0.22, 1.6);
    const bSpringL = new THREE.Mesh(bogieSpringGeom, castIronMat);
    bSpringL.position.set(-0.58, 0.72, -3.35);
    const bSpringR = new THREE.Mesh(bogieSpringGeom, castIronMat);
    bSpringR.position.set(0.58, 0.72, -3.35);

    // Heavy Trunnion Pivot Center Base
    const trunnionGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.28, 16);
    [-0.58, 0.58].forEach((x) => {
      const trun = new THREE.Mesh(trunnionGeom, darkChassisMat);
      trun.rotation.z = Math.PI / 2;
      trun.position.set(x, 0.65, -3.35);
      suspensionGroup.add(trun);
    });

    suspensionGroup.add(fSpringL, fSpringR, bSpringL, bSpringR);
  }
  helperRegisterComponent('suspension', suspensionGroup, [0, -0.9, -2.5]);

  // ==========================================
  // 14. FUEL SYSTEM (300L Fuel Tank & Filters)
  // ==========================================
  const fuelGroup = new THREE.Group();
  {
    // Cylindrical 300L Fuel Tank (mounted on left chassis side)
    const fuelTankGeom = new THREE.CylinderGeometry(0.32, 0.32, 1.5, 24);
    const fuelTank = new THREE.Mesh(fuelTankGeom, darkChassisMat);
    fuelTank.rotation.x = Math.PI / 2;
    fuelTank.position.set(-0.85, 0.78, 0.8);

    // Aluminum mounting straps
    const strapGeom = new THREE.TorusGeometry(0.33, 0.02, 8, 24);
    const strap1 = new THREE.Mesh(strapGeom, steelMat);
    strap1.rotation.y = Math.PI / 2;
    strap1.position.set(-0.85, 0.78, 1.25);
    const strap2 = new THREE.Mesh(strapGeom, steelMat);
    strap2.rotation.y = Math.PI / 2;
    strap2.position.set(-0.85, 0.78, 0.35);

    // Fuel water separator filter
    const filterGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.28, 12);
    const filter = new THREE.Mesh(filterGeom, steelMat);
    filter.position.set(-0.75, 0.95, 1.65);

    fuelGroup.add(fuelTank, strap1, strap2, filter);
  }
  helperRegisterComponent('fuel-system', fuelGroup, [-1.8, -0.4, 0.4]);

  // ==========================================
  // 15. EXHAUST SYSTEM & VERTICAL MINING STACK
  // ==========================================
  const exhaustGroup = new THREE.Group();
  {
    // Exhaust Manifold & Downpipe
    const manifoldGeom = new THREE.BoxGeometry(0.18, 0.22, 0.95);
    const manifold = new THREE.Mesh(manifoldGeom, castIronMat);
    manifold.position.set(0.38, 1.15, 2.35);

    // DPF / Catalytic Converter Canister
    const dpfGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16);
    const dpf = new THREE.Mesh(dpfGeom, steelMat);
    dpf.rotation.x = Math.PI / 2;
    dpf.position.set(0.85, 0.82, 1.45);

    // Vertical Mining Exhaust Stack Pipe
    const stackGeom = new THREE.CylinderGeometry(0.07, 0.07, 2.2, 16);
    const stack = new THREE.Mesh(stackGeom, steelMat);
    stack.position.set(0.98, 2.1, 1.8);

    // 45-degree angle rain cut / spark arrestor at top
    const capGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.15, 16);
    const cap = new THREE.Mesh(capGeom, steelMat);
    cap.position.set(0.98, 3.2, 1.8);
    cap.rotation.x = 0.4;

    exhaustGroup.add(manifold, dpf, stack, cap);
  }
  helperRegisterComponent('exhaust-system', exhaustGroup, [1.7, 0.5, 0.2]);

  // ==========================================
  // 16. ELECTRICAL SYSTEM & BATTERY BOX
  // ==========================================
  const elecGroup = new THREE.Group();
  {
    // 24V Mining Dual Battery Box (weatherproof enclosure)
    const battBoxGeom = new THREE.BoxGeometry(0.55, 0.4, 0.75);
    const battBox = new THREE.Mesh(battBoxGeom, darkChassisMat);
    battBox.position.set(-0.82, 0.78, -0.2);

    // Battery Isolation Safety Switch (Mine Red/Yellow Lockout switch)
    const switchGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12);
    const lockoutSwitch = new THREE.Mesh(switchGeom, redLightMat);
    lockoutSwitch.rotation.z = Math.PI / 2;
    lockoutSwitch.position.set(-1.12, 0.82, -0.2);

    // 24V Alternator
    const altGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 16);
    const alternator = new THREE.Mesh(altGeom, engineAlloyMat);
    alternator.rotation.z = Math.PI / 2;
    alternator.position.set(-0.35, 1.15, 2.75);

    // Heavy Starter Motor
    const starterGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.28, 16);
    const starter = new THREE.Mesh(starterGeom, castIronMat);
    starter.position.set(-0.32, 0.82, 1.85);

    elecGroup.add(battBox, lockoutSwitch, alternator, starter);
  }
  helperRegisterComponent('electrical-system', elecGroup, [-1.9, 0.2, 0.8]);

  // ==========================================
  // 17. TYRES & WHEELS (10x Heavy Mining 6x4)
  // ==========================================
  const wheelsGroup = new THREE.Group();
  {
    // Reusable single wheel mesh builder
    const createSingleWheel = (isDual = false, isLeft = true) => {
      const wheelSubGroup = new THREE.Group();

      // Tire Tread Outer (Torus with thick tube)
      const tireGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.32, 28);
      const tire = new THREE.Mesh(tireGeom, tireRubberMat);
      tire.rotation.z = Math.PI / 2;
      wheelSubGroup.add(tire);

      // Steel Rim
      const rimGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.33, 20);
      const rim = new THREE.Mesh(rimGeom, wheelRimMat);
      rim.rotation.z = Math.PI / 2;
      wheelSubGroup.add(rim);

      // 10 Wheel Stud Nuts
      const nutGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8);
      for (let n = 0; n < 10; n++) {
        const angle = (n / 10) * Math.PI * 2;
        const nut = new THREE.Mesh(nutGeom, steelMat);
        nut.rotation.z = Math.PI / 2;
        nut.position.set(
          isLeft ? 0.17 : -0.17,
          Math.cos(angle) * 0.22,
          Math.sin(angle) * 0.22
        );
        wheelSubGroup.add(nut);
      }

      // Center Hub Cap
      const hubCapGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16);
      const hubCap = new THREE.Mesh(hubCapGeom, castIronMat);
      hubCap.rotation.z = Math.PI / 2;
      hubCap.position.set(isLeft ? 0.18 : -0.18, 0, 0);
      wheelSubGroup.add(hubCap);

      return wheelSubGroup;
    };

    // Front Steer Wheels (Single wheel on each side)
    const frontLeft = createSingleWheel(false, true);
    frontLeft.position.set(-1.08, 0.58, 2.45);
    const frontRight = createSingleWheel(false, false);
    frontRight.position.set(1.08, 0.58, 2.45);
    wheelsGroup.add(frontLeft, frontRight);

    // Tandem Middle Dual Wheels (2 wheels on each side = 4 total)
    const midLeftInner = createSingleWheel(true, true);
    midLeftInner.position.set(-0.95, 0.58, -2.7);
    const midLeftOuter = createSingleWheel(true, true);
    midLeftOuter.position.set(-1.3, 0.58, -2.7);

    const midRightInner = createSingleWheel(true, false);
    midRightInner.position.set(0.95, 0.58, -2.7);
    const midRightOuter = createSingleWheel(true, false);
    midRightOuter.position.set(1.3, 0.58, -2.7);

    wheelsGroup.add(midLeftInner, midLeftOuter, midRightInner, midRightOuter);

    // Tandem Rear Dual Wheels (2 wheels on each side = 4 total)
    const rearLeftInner = createSingleWheel(true, true);
    rearLeftInner.position.set(-0.95, 0.58, -4.0);
    const rearLeftOuter = createSingleWheel(true, true);
    rearLeftOuter.position.set(-1.3, 0.58, -4.0);

    const rearRightInner = createSingleWheel(true, false);
    rearRightInner.position.set(0.95, 0.58, -4.0);
    const rearRightOuter = createSingleWheel(true, false);
    rearRightOuter.position.set(1.3, 0.58, -4.0);

    wheelsGroup.add(rearLeftInner, rearLeftOuter, rearRightInner, rearRightOuter);
  }
  helperRegisterComponent('tyres-wheels', wheelsGroup, [2.5, 0, 0]);

  return { rootGroup: root, componentMeshMap, dumpBodyPivotGroup };
}
