'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STANDARD_PANELS } from '@/data/materialsAndPanels';
import { RotateCw, Sparkles, Box, Shield, Eye, Layers } from 'lucide-react';

interface Vehicle3DShowroomProps {
  selectedPanelIds: string[];
  onTogglePanel: (panelId: string) => void;
  hoveredPanelId: string | null;
  onHoverPanel: (panelId: string | null) => void;
  vehicleModelPath?: string;
  vehicleName?: string;
}

export const Vehicle3DShowroom: React.FC<Vehicle3DShowroomProps> = ({
  selectedPanelIds,
  onTogglePanel,
  hoveredPanelId,
  onHoverPanel,
  vehicleModelPath = '/models/golf_gti_mk7.glb',
  vehicleName = 'Volkswagen Golf GTI Clubsport MK7',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [ppfFinish, setPpfFinish] = useState<'GLOSS' | 'MATTE'>('GLOSS');
  const [colorMode, setColorMode] = useState<'TORNADO_RED' | 'OBSIDIAN_BLACK' | 'PURE_WHITE'>('TORNADO_RED');

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const carModelRef = useRef<THREE.Group | null>(null);
  const panelMeshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Automotive Paint Colors
  const PAINT_COLORS = {
    TORNADO_RED: 0xbd182d,
    OBSIDIAN_BLACK: 0x121418,
    PURE_WHITE: 0xf3f4f6,
  };

  // Helper to classify spatial position (relative -0.5 to +0.5) to panel ID
  const classifyRelCoordsToPanel = (relX: number, relY: number, relZ: number): string => {
    // Elevated rear wing / spoiler
    if (relZ < -0.30 && relY > 0.15) return 'rear_wing_spoiler';
    // Roof
    if (relY > 0.16 && relZ > -0.28 && relZ < 0.12 && Math.abs(relX) < 0.38) return 'roof';
    // Hood
    if (relZ > 0.10 && relZ < 0.42 && Math.abs(relX) < 0.35 && relY > -0.06) return 'hood';
    // Front Bumper / Splitter / Fog lights / Headlights
    if (relZ >= 0.38) {
      if (relY < -0.22) return 'front_splitter';
      if (Math.abs(relX) > 0.28 && relY < -0.05) return 'fog_lights';
      if (Math.abs(relX) > 0.22 && relY >= -0.05) return 'headlights';
      return 'front_bumper';
    }
    // Front Fenders
    if (relZ > 0.08 && relZ <= 0.38 && Math.abs(relX) >= 0.30) {
      return relX < 0 ? 'fender_left' : 'fender_right';
    }
    // Doors & Mirrors
    if (relZ > -0.18 && relZ <= 0.10 && Math.abs(relX) >= 0.28) {
      if (Math.abs(relX) > 0.42 && relY > 0.05) return 'mirrors';
      return 'doors_front';
    }
    // Quarter Panels
    if (relZ <= -0.18 && relZ > -0.40 && Math.abs(relX) >= 0.28) {
      return 'quarter_panels';
    }
    // Trunk / Tailgate
    if (relZ <= -0.32 && Math.abs(relX) < 0.35 && relY > -0.05) {
      return 'trunk';
    }
    // Rear Bumper / Diffuser
    if (relZ <= -0.36) {
      if (relY < -0.18) return 'rear_diffuser';
      return 'rear_bumper';
    }
    return 'front_bumper';
  };

  // Splits a monolithic car paint BufferGeometry into discrete panel meshes
  const splitPaintMeshIntoPanels = (
    srcMesh: THREE.Mesh,
    carBox: THREE.Box3,
    factoryColor: number
  ): THREE.Group => {
    const group = new THREE.Group();
    group.name = 'CarPaint_PanelGroup';

    const geom = srcMesh.geometry.clone().toNonIndexed();
    const posAttr = geom.attributes.position;
    const normAttr = geom.attributes.normal;
    const uvAttr = geom.attributes.uv;
    const triCount = posAttr.count / 3;

    const carSize = carBox.getSize(new THREE.Vector3());
    const carCenter = carBox.getCenter(new THREE.Vector3());

    const panelTriangleMap = new Map<string, number[]>();

    for (let t = 0; t < triCount; t++) {
      const i = t * 3;
      const cx = (posAttr.getX(i) + posAttr.getX(i + 1) + posAttr.getX(i + 2)) / 3;
      const cy = (posAttr.getY(i) + posAttr.getY(i + 1) + posAttr.getY(i + 2)) / 3;
      const cz = (posAttr.getZ(i) + posAttr.getZ(i + 1) + posAttr.getZ(i + 2)) / 3;

      const relX = (cx - carCenter.x) / (carSize.x || 1);
      const relY = (cy - carCenter.y) / (carSize.y || 1);
      const relZ = (cz - carCenter.z) / (carSize.z || 1);

      const panelId = classifyRelCoordsToPanel(relX, relY, relZ);
      if (!panelTriangleMap.has(panelId)) {
        panelTriangleMap.set(panelId, []);
      }
      panelTriangleMap.get(panelId)!.push(t);
    }

    panelTriangleMap.forEach((triangles, panelId) => {
      const pGeom = new THREE.BufferGeometry();
      const pCount = triangles.length;
      const newPos = new Float32Array(pCount * 9);
      const newNorm = normAttr ? new Float32Array(pCount * 9) : null;
      const newUV = uvAttr ? new Float32Array(pCount * 6) : null;

      for (let dt = 0; dt < pCount; dt++) {
        const st = triangles[dt];
        const srcIdx = st * 3;
        const destIdx = dt * 3;

        for (let v = 0; v < 3; v++) {
          newPos[(destIdx + v) * 3] = posAttr.getX(srcIdx + v);
          newPos[(destIdx + v) * 3 + 1] = posAttr.getY(srcIdx + v);
          newPos[(destIdx + v) * 3 + 2] = posAttr.getZ(srcIdx + v);

          if (normAttr && newNorm) {
            newNorm[(destIdx + v) * 3] = normAttr.getX(srcIdx + v);
            newNorm[(destIdx + v) * 3 + 1] = normAttr.getY(srcIdx + v);
            newNorm[(destIdx + v) * 3 + 2] = normAttr.getZ(srcIdx + v);
          }

          if (uvAttr && newUV) {
            newUV[(destIdx + v) * 2] = uvAttr.getX(srcIdx + v);
            newUV[(destIdx + v) * 2 + 1] = uvAttr.getY(srcIdx + v);
          }
        }
      }

      pGeom.setAttribute('position', new THREE.BufferAttribute(newPos, 3));
      if (newNorm) pGeom.setAttribute('normal', new THREE.BufferAttribute(newNorm, 3));
      if (newUV) pGeom.setAttribute('uv', new THREE.BufferAttribute(newUV, 2));

      const panelMat = new THREE.MeshStandardMaterial({
        color: factoryColor,
        roughness: 0.18,
        metalness: 0.35,
      });

      const pMesh = new THREE.Mesh(pGeom, panelMat);
      pMesh.name = `panel_${panelId}`;
      pMesh.userData = {
        panelId,
        isPanel: true,
        defaultColor: factoryColor,
      };
      pMesh.castShadow = true;
      pMesh.receiveShadow = true;

      group.add(pMesh);

      if (!panelMeshesRef.current.has(panelId)) {
        panelMeshesRef.current.set(panelId, []);
      }
      panelMeshesRef.current.get(panelId)!.push(pMesh);
    });

    return group;
  };

  // Update materials when selectedPanelIds, hoveredPanelId, or ppfFinish changes
  const updateMaterials = useCallback(() => {
    panelMeshesRef.current.forEach((meshes, panelId) => {
      const isSel = selectedPanelIds.includes(panelId);
      const isHov = hoveredPanelId === panelId;

      meshes.forEach((mesh) => {
        if (!mesh.material) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (isSel) {
          // Film PPF Applied: Crimson Glowing Protection or Stealth Satin Matte
          if (ppfFinish === 'GLOSS') {
            mat.color.setHex(0xe61937); // Supercar Red PPF Film
            mat.roughness = 0.08;       // High-Gloss mirror clearcoat
            mat.metalness = 0.40;
            mat.emissive.setHex(isHov ? 0xff2d4e : 0x730c1b);
            mat.emissiveIntensity = isHov ? 0.45 : 0.22;
          } else {
            // Matte / Frosted Stealth PPF
            mat.color.setHex(0xcc152f);
            mat.roughness = 0.65;       // Frosted Satin
            mat.metalness = 0.15;
            mat.emissive.setHex(isHov ? 0xff2d4e : 0x4a0812);
            mat.emissiveIntensity = isHov ? 0.35 : 0.15;
          }
        } else if (isHov) {
          // Hovered unselected: Soft white / cyan preview
          mat.color.setHex(0x38bdf8);
          mat.roughness = 0.25;
          mat.metalness = 0.3;
          mat.emissive.setHex(0x0284c7);
          mat.emissiveIntensity = 0.35;
        } else {
          // Normal Factory Paint
          const baseColor = PAINT_COLORS[colorMode];
          mat.color.setHex(baseColor);
          mat.roughness = 0.18;
          mat.metalness = 0.35;
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
    });
  }, [selectedPanelIds, hoveredPanelId, ppfFinish, colorMode]);

  useEffect(() => {
    updateMaterials();
  }, [updateMaterials]);

  // Main Three.js Scene Setup & Model Loading
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070a);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(4.8, 2.1, 5.2);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Prevent dipping beneath floor
    controls.minDistance = 2.5;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffffff, 2.5);
    mainSpot.position.set(5, 8, 5);
    mainSpot.angle = Math.PI / 4;
    mainSpot.penumbra = 0.8;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 2048;
    mainSpot.shadow.mapSize.height = 2048;
    scene.add(mainSpot);

    const rimLight = new THREE.DirectionalLight(0xe61937, 1.2);
    rimLight.position.set(-6, 3, -5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(0, 4, -6);
    scene.add(fillLight);

    // 6. Luxury Circular Turntable Floor
    const floorGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.08, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090b10,
      roughness: 0.35,
      metalness: 0.8,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.04;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Turntable Edge Ring in PlusCars Crimson
    const ringGeo = new THREE.RingGeometry(5.15, 5.25, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xe61937, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.001;
    scene.add(ringMesh);

    // 7. Load GLB Model
    setIsLoading(true);
    setLoadProgress(0);
    setLoadError(null);
    panelMeshesRef.current.clear();

    const loader = new GLTFLoader();
    loader.load(
      vehicleModelPath,
      (gltf) => {
        const car = gltf.scene;
        carModelRef.current = car;

        // Hide interior, engine, seats to expose clean exterior
        car.traverse((child) => {
          const name = (child.name || '').toLowerCase();
          if (
            name.includes('interior') ||
            name.includes('seat') ||
            name.includes('engine') ||
            name.includes('pedal') ||
            name.includes('shifter') ||
            name.includes('dash') ||
            name.includes('gauge') ||
            name.includes('steering') ||
            name.includes('suspension') ||
            name.includes('undercarriage')
          ) {
            child.visible = false;
          }
        });

        // Normalize scale & center
        const rawBox = new THREE.Box3().setFromObject(car);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const maxRawDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
        if (maxRawDim > 8 || maxRawDim < 1.0) {
          const factor = 4.26 / maxRawDim;
          car.scale.multiplyScalar(factor);
        }

        const scaledBox = new THREE.Box3().setFromObject(car);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        car.position.x -= scaledCenter.x;
        car.position.y -= scaledBox.min.y; // Sit cleanly on ground
        car.position.z -= scaledCenter.z;

        const finalBox = new THREE.Box3().setFromObject(car);

        // Split paint mesh into panels
        const meshesToSplit: THREE.Mesh[] = [];
        car.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const name = (mesh.name || '').toLowerCase();

            if (name.includes('carpaint') || name.includes('car_paint') || name.includes('phong2') || name.includes('phong3')) {
              meshesToSplit.push(mesh);
            }
          }
        });

        meshesToSplit.forEach((paintMesh) => {
          const panelGroup = splitPaintMeshIntoPanels(paintMesh, finalBox, PAINT_COLORS[colorMode]);
          paintMesh.visible = false;
          paintMesh.parent?.add(panelGroup);
        });

        scene.add(car);
        setIsLoading(false);
        updateMaterials();
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error('Error loading 3D vehicle model:', err);
        setLoadError('No se pudo cargar el modelo 3D. Asegúrate de que el archivo .glb exista.');
        setIsLoading(false);
      }
    );

    // 8. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isRotating;
        controlsRef.current.autoRotateSpeed = 1.2;
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [vehicleModelPath]);

  // Raycasting Click & Hover Handlers
  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    for (const hit of intersects) {
      if (hit.object && hit.object.userData && hit.object.userData.panelId) {
        onTogglePanel(hit.object.userData.panelId);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    let foundPanelId: string | null = null;
    for (const hit of intersects) {
      if (hit.object && hit.object.userData && hit.object.userData.panelId) {
        foundPanelId = hit.object.userData.panelId;
        break;
      }
    }

    if (foundPanelId !== hoveredPanelId) {
      onHoverPanel(foundPanelId);
    }
  };

  // Camera presets
  const setCameraAngle = (view: 'iso' | 'front' | 'side' | 'rear' | 'top') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    controls.target.set(0, 0.65, 0);

    if (view === 'iso') camera.position.set(4.8, 2.1, 5.2);
    else if (view === 'front') camera.position.set(0, 1.1, 6.2);
    else if (view === 'side') camera.position.set(6.2, 1.1, 0);
    else if (view === 'rear') camera.position.set(0, 1.2, -6.2);
    else if (view === 'top') camera.position.set(0, 7.5, 0.1);

    camera.lookAt(controls.target);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '520px', background: '#06070a', overflow: 'hidden' }}>
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        onClick={handlePointerDown}
        onMouseMove={handlePointerMove}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6, 7, 10, 0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 40,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ width: 44, height: 44, border: '3px solid rgba(230, 25, 55, 0.2)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>Cargando Showroom 3D...</div>
            <div style={{ color: '#8893a4', fontSize: '11px', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {vehicleName} ({loadProgress}%)
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6, 7, 10, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 45,
          }}
        >
          <div style={{ background: '#171922', border: '1px solid #ef4444', borderRadius: '12px', padding: '20px', maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: '8px' }}>Error de Asset 3D</div>
            <p style={{ color: '#9aa4b2', fontSize: '12px', marginBottom: '14px' }}>{loadError}</p>
          </div>
        </div>
      )}

      {/* Controls Overlay Bar */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {/* Left: Camera Angles */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(12, 14, 20, 0.85)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)', pointerEvents: 'auto' }}>
          {(['iso', 'front', 'side', 'rear', 'top'] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setCameraAngle(view)}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#cbd5e1',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {view === 'iso' && '360°'}
              {view === 'front' && 'Frente'}
              {view === 'side' && 'Lateral'}
              {view === 'rear' && 'Atrás'}
              {view === 'top' && 'Techo'}
            </button>
          ))}
        </div>

        {/* Right: PPF Film Finish & Turntable Rotation */}
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
          {/* PPF Finish Switch */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(12, 14, 20, 0.85)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)' }}>
            <button
              type="button"
              onClick={() => setPpfFinish('GLOSS')}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 700,
                color: ppfFinish === 'GLOSS' ? '#ffffff' : '#8893a4',
                background: ppfFinish === 'GLOSS' ? 'var(--accent-red)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              PPF Gloss
            </button>
            <button
              type="button"
              onClick={() => setPpfFinish('MATTE')}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 700,
                color: ppfFinish === 'MATTE' ? '#ffffff' : '#8893a4',
                background: ppfFinish === 'MATTE' ? '#334155' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              PPF Matte
            </button>
          </div>

          {/* Auto Rotation Button */}
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              color: isRotating ? '#ffffff' : '#8893a4',
              background: isRotating ? 'var(--accent-red-subtle)' : 'rgba(12, 14, 20, 0.85)',
              border: `1px solid ${isRotating ? 'var(--accent-red-border)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
            }}
          >
            <RotateCw style={{ width: 13, height: 13 }} />
            {isRotating ? 'Pausar Giro' : 'Girar 360°'}
          </button>
        </div>
      </div>

      {/* Floating 3D Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255, 255, 255, 0.35)',
          pointerEvents: 'none',
          letterSpacing: '0.04em',
        }}
      >
        CLICK EN EL AUTO PARA SELECCIONAR PANELES · ARRASTRA PARA ROTAR · RUEDA DEL RATÓN PARA ZOOM
      </div>
    </div>
  );
};
