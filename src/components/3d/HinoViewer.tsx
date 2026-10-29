import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HinoComponent, ViewMode, CameraPreset } from '../../types';
import { createHino500Model, ComponentMeshInfo } from './HinoProceduralModel';

interface HinoViewerProps {
  selectedComponent: HinoComponent | null;
  onSelectComponent: (componentId: string | null) => void;
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  explodedProgress: number; // 0 to 1
  isTipping: boolean;
  components: HinoComponent[];
  customModelFile: File | null;
  onModelLoaded?: (meshNames: string[]) => void;
}

export const HinoViewer: React.FC<HinoViewerProps> = ({
  selectedComponent,
  onSelectComponent,
  viewMode,
  cameraPreset,
  explodedProgress,
  isTipping,
  components,
  customModelFile,
  onModelLoaded,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Mesh & Model state
  const componentMeshMapRef = useRef<Map<string, ComponentMeshInfo>>(new Map());
  const dumpPivotRef = useRef<THREE.Group | null>(null);
  const rootModelRef = useRef<THREE.Group | null>(null);
  const customModelRef = useRef<THREE.Group | null>(null);

  // Animation & Interpolation targets
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(7, 5, 8));
  const targetControlsTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 0));
  const isTransitioningCameraRef = useRef<boolean>(false);
  const currentExplodedRef = useRef<number>(0);
  const targetExplodedRef = useRef<number>(0);
  const currentTipAngleRef = useRef<number>(0);
  const targetTipAngleRef = useRef<number>(0);

  // 2D Screen Callout Position for Selected Component
  const [calloutScreenPos, setCalloutScreenPos] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Highlight Outline / Bounding Box Helper
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);

  // Keep latest props in refs for animation loop
  const viewModeRef = useRef<ViewMode>(viewMode);
  viewModeRef.current = viewMode;
  targetExplodedRef.current = explodedProgress;
  targetTipAngleRef.current = isTipping ? 0.75 : 0; // ~43 degrees
  const selectedComponentRef = useRef<HinoComponent | null>(selectedComponent);
  selectedComponentRef.current = selectedComponent;

  // Initialize Scene, Renderer, Controls
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.025);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.2, 80);
    camera.position.set(7, 5, 8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Studio Environment Lighting (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio 3-Point Light Rig
    // Warm Key Light
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.4);
    keyLight.position.set(8, 12, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 35;
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    scene.add(keyLight);

    // Cool Sky / Ground Hemisphere Light Fill
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 1.2);
    scene.add(hemiLight);

    // Cool Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-8, 6, -9);
    scene.add(rimLight);

    // Front soft fill
    const frontFill = new THREE.DirectionalLight(0xfacc15, 0.6);
    frontFill.position.set(0, 4, 10);
    scene.add(frontFill);

    // 6. Contact Shadow Plane & Technical Ground Grid
    const groundGrid = new THREE.GridHelper(40, 40, 0xeab308, 0x1e2633);
    groundGrid.position.y = 0.01;
    groundGrid.material.opacity = 0.35;
    groundGrid.material.transparent = true;
    scene.add(groundGrid);

    // Radial dark contact shadow under truck
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 250);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 14),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, 0.02, -0.4);
    scene.add(shadowPlane);

    // 7. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.5;
    controls.maxDistance = 35;
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // Don't go below ground
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;

    // 8. Build Procedural Hino 500 3D Model
    const { rootGroup, componentMeshMap, dumpBodyPivotGroup } = createHino500Model();
    rootModelRef.current = rootGroup;
    componentMeshMapRef.current = componentMeshMap;
    dumpPivotRef.current = dumpBodyPivotGroup;
    scene.add(rootGroup);

    // Selection Box Helper
    const selBox = new THREE.BoxHelper(new THREE.Mesh(), 0xfacc15);
    selBox.visible = false;
    scene.add(selBox);
    selectionBoxRef.current = selBox;

    // 9. Resize Listener
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    const compBox = new THREE.Box3();
    const worldPos = new THREE.Vector3();
    const boxSize = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth camera interpolation if transitioning
      if (isTransitioningCameraRef.current) {
        camera.position.lerp(targetCameraPosRef.current, Math.min(delta * 5.0, 0.3));
        controls.target.lerp(targetControlsTargetRef.current, Math.min(delta * 5.0, 0.3));
        if (
          camera.position.distanceTo(targetCameraPosRef.current) < 0.05 &&
          controls.target.distanceTo(targetControlsTargetRef.current) < 0.05
        ) {
          isTransitioningCameraRef.current = false;
        }
      }

      controls.update();

      // Smooth Exploded View animation
      const explodedDelta = targetExplodedRef.current - currentExplodedRef.current;
      if (Math.abs(explodedDelta) > 0.001) {
        currentExplodedRef.current += explodedDelta * Math.min(delta * 7, 0.4);
      } else {
        currentExplodedRef.current = targetExplodedRef.current;
      }

      // Smooth Dump Body Tipping
      const tipDelta = targetTipAngleRef.current - currentTipAngleRef.current;
      if (Math.abs(tipDelta) > 0.001) {
        currentTipAngleRef.current += tipDelta * Math.min(delta * 5, 0.3);
      } else {
        currentTipAngleRef.current = targetTipAngleRef.current;
      }

      // Apply Tipping rotation to Dump Body Pivot
      if (dumpPivotRef.current) {
        dumpPivotRef.current.rotation.x = -currentTipAngleRef.current;
      }

      // Apply Exploded Offset to all component groups
      componentMeshMapRef.current.forEach((info) => {
        const factor = currentExplodedRef.current;
        info.group.position.x = info.originalPosition.x + info.explodedOffset.x * factor;
        info.group.position.y = info.originalPosition.y + info.explodedOffset.y * factor;
        info.group.position.z = info.originalPosition.z + info.explodedOffset.z * factor;
      });

      // Update Callout 2D Position for Selected Component
      const activeId = selectedComponentRef.current?.id;
      if (activeId && componentMeshMapRef.current.has(activeId)) {
        const info = componentMeshMapRef.current.get(activeId)!;
        
        // Compute the EXACT bounding box and center of the selected component in world space
        compBox.setFromObject(info.group);
        compBox.getCenter(worldPos);
        compBox.getSize(boxSize);
        worldPos.y += boxSize.y * 0.5 + 0.15; // Directly at top of the component mesh!

        const projected = worldPos.clone().project(camera);
        const curWidth = mountRef.current?.clientWidth || width;
        const curHeight = mountRef.current?.clientHeight || height;
        const halfWidth = curWidth / 2;
        const halfHeight = curHeight / 2;
        const isBehind = projected.z > 1;

        if (!isBehind) {
          const screenX = projected.x * halfWidth + halfWidth;
          const screenY = -(projected.y * halfHeight) + halfHeight;
          setCalloutScreenPos({ x: screenX, y: screenY, visible: true });
        } else {
          setCalloutScreenPos((prev) => (prev ? { ...prev, visible: false } : null));
        }

        // Update Box Helper around the selected component
        if (selectionBoxRef.current) {
          selectionBoxRef.current.setFromObject(info.group);
          selectionBoxRef.current.visible = true;
          selectionBoxRef.current.update();
        }
      } else {
        setCalloutScreenPos(null);
        if (selectionBoxRef.current) {
          selectionBoxRef.current.visible = false;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Materials according to View Mode and Selection
  useEffect(() => {
    if (!componentMeshMapRef.current) return;

    const xrayColorMap: Record<string, number> = {
      'engine-assy': 0xf97316, // Engine Orange
      'turbocharger': 0xeab308, // Turbo Gold
      'transmission': 0x06b6d4, // Transmission Cyan
      'clutch-torque': 0x38bdf8,
      'drive-shaft': 0xf59e0b, // Propshaft Amber
      'differential': 0x84cc16, // Differential Lime
      'final-drive': 0x10b981,
      'axle-housing': 0x64748b,
      'hydraulic-pump': 0xfacc15, // Hydraulic Yellow
      'steering-system': 0xa855f7, // Steering Purple
      'brake-system': 0xef4444, // Brake Red
      'cooling-system': 0x0ea5e9, // Cooling Sky
      'electrical-system': 0xeab308,
      'suspension': 0x14b8a6,
      'tyres-wheels': 0x334155,
      'fuel-system': 0x22c55e,
      'exhaust-system': 0xf43f5e,
      'dump-body': 0x0284c7,
      'cabin-interior': 0x0284c7,
      'chassis': 0x0f172a,
    };

    componentMeshMapRef.current.forEach((info, compId) => {
      const isSelected = selectedComponent?.id === compId;

      info.group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const originalMat = info.materials.get(child);
        if (!originalMat) return;

        if (viewMode === 'COMPLETE') {
          // Restore OEM PBR appearance
          child.material = originalMat;
          child.visible = true;
        } else if (viewMode === 'XRAY') {
          // Body & Cab & Chassis become holographic see-through
          if (
            compId === 'cabin-interior' ||
            compId === 'dump-body' ||
            compId === 'chassis'
          ) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x0284c7,
              transparent: true,
              opacity: 0.16,
              roughness: 0.2,
              metalness: 0.8,
              depthWrite: false,
              wireframe: false,
            });
          } else {
            // Mechanical powertrain glows in vivid industrial colors
            const neonColor = xrayColorMap[compId] || 0xeab308;
            child.material = new THREE.MeshStandardMaterial({
              color: neonColor,
              emissive: neonColor,
              emissiveIntensity: 0.45,
              roughness: 0.2,
              metalness: 0.6,
            });
          }
          child.visible = true;
        } else if (viewMode === 'INSPECTION') {
          // Spotlight selected component, ghost out everything else
          if (isSelected) {
            child.material = originalMat;
            child.visible = true;
          } else {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x1e293b,
              transparent: true,
              opacity: 0.08,
              depthWrite: false,
            });
            child.visible = true;
          }
        } else if (viewMode === 'EXPLODED') {
          // Full materials displayed, exploded outward
          child.material = originalMat;
          child.visible = true;
        }
      });
    });
  }, [viewMode, selectedComponent]);

  // Handle Camera Presets
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    isTransitioningCameraRef.current = true;

    switch (cameraPreset) {
      case 'ISOMETRIC':
        targetCameraPosRef.current.set(7, 5, 8);
        targetControlsTargetRef.current.set(0, 1.2, 0);
        break;
      case 'FRONT':
        targetCameraPosRef.current.set(0, 2.2, 9.5);
        targetControlsTargetRef.current.set(0, 1.6, 2.5);
        break;
      case 'SIDE':
        targetCameraPosRef.current.set(10.5, 2.4, 0);
        targetControlsTargetRef.current.set(0, 1.3, -0.4);
        break;
      case 'TOP':
        targetCameraPosRef.current.set(0, 14, 0.01);
        targetControlsTargetRef.current.set(0, 0, -0.4);
        break;
      case 'REAR':
        targetCameraPosRef.current.set(0, 2.5, -10.5);
        targetControlsTargetRef.current.set(0, 1.4, -3.2);
        break;
    }
  }, [cameraPreset]);

  // Zoom to Selected Component & Immediately update selection box
  useEffect(() => {
    if (!selectedComponent) {
      if (selectionBoxRef.current) {
        selectionBoxRef.current.visible = false;
      }
      setCalloutScreenPos(null);
      return;
    }
    if (!cameraRef.current || !controlsRef.current) return;
    const meshInfo = componentMeshMapRef.current.get(selectedComponent.id);
    if (!meshInfo) {
      if (selectionBoxRef.current) {
        selectionBoxRef.current.visible = false;
      }
      return;
    }

    // Immediately snap BoxHelper to newly selected component
    if (selectionBoxRef.current) {
      selectionBoxRef.current.setFromObject(meshInfo.group);
      selectionBoxRef.current.visible = true;
      selectionBoxRef.current.update();
    }

    const box = new THREE.Box3().setFromObject(meshInfo.group);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1.2);

    // Position camera slightly offset from component center
    targetControlsTargetRef.current.copy(center);
    targetCameraPosRef.current.set(
      center.x + maxDim * 1.8,
      center.y + maxDim * 1.2,
      center.z + maxDim * 1.8
    );
    isTransitioningCameraRef.current = true;
  }, [selectedComponent]);

  // Handle Raycasting Pointer Click & Hover
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const targetRoot = customModelRef.current || rootModelRef.current;
      if (!targetRoot) return;

      const intersects = raycaster.intersectObjects(targetRoot.children, true);

      if (intersects.length > 0) {
        // Find component ID from userData
        let clickedCompId: string | null = null;
        let obj: THREE.Object3D | null = intersects[0].object;

        while (obj && obj !== targetRoot) {
          if (obj.userData?.componentId) {
            clickedCompId = obj.userData.componentId;
            break;
          }
          if (componentMeshMapRef.current.has(obj.name)) {
            clickedCompId = obj.name;
            break;
          }
          obj = obj.parent;
        }

        if (clickedCompId) {
          onSelectComponent(clickedCompId);
          return;
        }
      }

      // If clicked empty space, deselect
      onSelectComponent(null);
    },
    [onSelectComponent]
  );

  // Handle Custom GLB Model Upload
  useEffect(() => {
    if (!customModelFile || !sceneRef.current) return;
    setIsLoadingModel(true);
    setLoadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const loader = new GLTFLoader();

      loader.parse(
        buffer,
        '',
        (gltf) => {
          setIsLoadingModel(false);

          // Hide procedural model
          if (rootModelRef.current) {
            rootModelRef.current.visible = false;
          }
          // Remove previous custom model
          if (customModelRef.current && sceneRef.current) {
            sceneRef.current.remove(customModelRef.current);
          }

          const model = gltf.scene;
          customModelRef.current = model;
          sceneRef.current?.add(model);

          // Fit camera to new model bounds
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = cameraRef.current?.fov || 45;
          let cameraZ = Math.abs(maxDim / 2 / Math.tan((fov * Math.PI) / 360));
          cameraZ *= 1.5;

          if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.set(center.x + cameraZ, center.y + cameraZ * 0.7, center.z + cameraZ);
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
          }

          // Extract mesh names for component mapping
          const names: string[] = [];
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.name) names.push(child.name);
            }
          });

          if (onModelLoaded) {
            onModelLoaded(names);
          }
        },
        (error: unknown) => {
          setIsLoadingModel(false);
          const msg = error instanceof Error ? error.message : 'Format tidak valid atau file rusak';
          setLoadError('Gagal memuat model GLB: ' + msg);
        }
      );
    };

    reader.onerror = () => {
      setIsLoadingModel(false);
      setLoadError('Gagal membaca file model.');
    };

    reader.readAsArrayBuffer(customModelFile);
  }, [customModelFile, onModelLoaded]);

  return (
    <div
      ref={mountRef}
      onPointerDown={handlePointerDown}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* 3D Callout Annotation Line & Label */}
      {calloutScreenPos && calloutScreenPos.visible && selectedComponent && (
        <div
          className="absolute pointer-events-none transition-all duration-75"
          style={{
            left: `${calloutScreenPos.x}px`,
            top: `${calloutScreenPos.y}px`,
            transform: 'translate(20px, -60px)',
          }}
        >
          {/* Technical Leader Line */}
          <div className="absolute -left-5 top-7 w-5 h-0.5 bg-amber-400 glow-yellow-sm" />
          <div className="absolute -left-6 top-6 w-2 h-2 rounded-full bg-amber-400 glow-yellow" />

          {/* Floating Callout Card */}
          <div className="bg-[#0f141c]/95 border border-amber-500/80 px-3 py-2 rounded-sm shadow-2xl backdrop-blur-md min-w-[210px] glow-yellow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-amber-500/30 pb-1 mb-1.5">
              <span className="font-tech text-xs tracking-wider font-bold text-amber-400">
                [ {selectedComponent.number.toString().padStart(2, '0')} ] {selectedComponent.name}
              </span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-code">
                {selectedComponent.actualHm.toLocaleString()} HM
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-sans flex items-center justify-between">
              <span>Status Umur:</span>
              <span
                className={`font-semibold ${
                  selectedComponent.actualHm >= selectedComponent.targetLifetimeHm
                    ? 'text-red-400'
                    : selectedComponent.actualHm / selectedComponent.targetLifetimeHm >= 0.8
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {Math.round((selectedComponent.actualHm / selectedComponent.targetLifetimeHm) * 100)}% Used
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              {selectedComponent.recommendedAction}
            </div>
          </div>
        </div>
      )}

      {/* Model Loading Spinner */}
      {isLoadingModel && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 pointer-events-none z-20">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="font-tech text-amber-400 text-sm tracking-wider uppercase">
            Memuat Model 3D Hino 500...
          </p>
        </div>
      )}

      {/* Error Banner */}
      {loadError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500 text-red-200 px-4 py-2 rounded text-xs font-mono shadow-xl z-30">
          ⚠️ {loadError}
        </div>
      )}

      {/* Watermark / Coordinates HUD in Corner */}
      <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] font-code text-slate-500 flex items-center gap-3">
        <span>3D ENGINE: THREE.JS R182</span>
        <span>•</span>
        <span>6x4 HEAVY MINING RIG</span>
        <span>•</span>
        <span className="text-amber-400/80">MINEROZ SYSTEM ACTIVE</span>
      </div>
    </div>
  );
};
