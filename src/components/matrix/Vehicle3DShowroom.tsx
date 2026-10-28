'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STANDARD_PANELS } from '@/data/materialsAndPanels';
import { RotateCw, Box, Shield, Eye, Layers, Check } from 'lucide-react';

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

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const carModelRef = useRef<THREE.Group | null>(null);
  const panelMeshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Automotive Materials
  const chromeMatRef = useRef(
    new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.08,
      metalness: 0.95,
    })
  );

  const glossBlackMatRef = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.12,
      metalness: 0.8,
    })
  );

  const tintedGlassMatRef = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x05070a,
      roughness: 0.03,
      metalness: 0.9,
      transparent: false,
    })
  );

  // Exact 3D classification calibrated to the Golf GTI MK7 body geometry
  const classifyCoordsToPanel = (x: number, y: number, z: number): string => {
    // 1. Elevated Clubsport Rear Wing / Spoiler
    if (z < -1.48 && y > 1.18) return 'rear_wing_spoiler';

    // 2. Roof (Techo)
    if (y > 1.15 && z > -1.50 && z < 0.45 && Math.abs(x) < 0.68) return 'roof';

    // 3. Front Splitter / Lower Aero Lip
    if (z >= 1.88 && y < 0.28) return 'front_splitter';

    // 4. Front Bumper Main Fascia
    if (z >= 1.88) return 'front_bumper';

    // 5. Rear Diffuser
    if (z <= -1.85 && y < 0.32) return 'rear_diffuser';

    // 6. Rear Bumper
    if (z <= -1.85) return 'rear_bumper';

    // 7. Hood (Capot Completo) - spans from cowl (z=0.50) to front grille (z=1.88), between fender shutlines
    if (z >= 0.50 && z < 1.88 && Math.abs(x) <= 0.66 && y >= 0.62) {
      return 'hood';
    }

    // 8. Front Fenders (Guardabarros delanteros)
    if (z >= 0.50 && z < 1.88) {
      if (Math.abs(x) > 0.66) return x < 0 ? 'fender_left' : 'fender_right';
      return 'front_bumper'; // Lower air dam / central intake
    }

    // 9. Side Mirrors
    if (Math.abs(x) > 0.88 && y > 0.80 && z > 0.15 && z < 0.50) {
      return 'mirrors';
    }

    // 10. Front Doors (Puertas)
    if (z >= -0.70 && z < 0.50) {
      if (y < 0.38) return 'rockers';
      return 'doors_front';
    }

    // 11. Rear Quarter Panels (Guardabarros traseros / Caderas) & Trunk
    if (z < -0.70 && z > -1.85) {
      if (Math.abs(x) >= 0.65) return 'quarter_panels';
      if (y > 0.50 && y < 1.18) return 'trunk';
      return 'quarter_panels';
    }

    return 'front_bumper';
  };

  // Splits monolithic car paint geometry into discrete, clean panel meshes
  const splitPaintMeshIntoPanels = (srcMesh: THREE.Mesh): THREE.Group => {
    const group = new THREE.Group();
    group.name = 'CarPaint_PanelGroup';

    const geom = srcMesh.geometry.clone().toNonIndexed();
    const posAttr = geom.attributes.position;
    const normAttr = geom.attributes.normal;
    const uvAttr = geom.attributes.uv;
    const triCount = posAttr.count / 3;

    const panelTriangleMap = new Map<string, number[]>();

    for (let t = 0; t < triCount; t++) {
      const i = t * 3;
      const cx = (posAttr.getX(i) + posAttr.getX(i + 1) + posAttr.getX(i + 2)) / 3;
      const cy = (posAttr.getY(i) + posAttr.getY(i + 1) + posAttr.getY(i + 2)) / 3;
      const cz = (posAttr.getZ(i) + posAttr.getZ(i + 1) + posAttr.getZ(i + 2)) / 3;

      const panelId = classifyCoordsToPanel(cx, cy, cz);
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
      if (newNorm) {
        pGeom.setAttribute('normal', new THREE.BufferAttribute(newNorm, 3));
      } else {
        pGeom.computeVertexNormals();
      }
      if (newUV) pGeom.setAttribute('uv', new THREE.BufferAttribute(newUV, 2));

      // Authentic Tornado Red lacquer with showroom clearcoat
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0xbd182d,
        roughness: 0.12,
        metalness: 0.35,
      });

      const pMesh = new THREE.Mesh(pGeom, panelMat);
      pMesh.name = `panel_${panelId}`;
      pMesh.userData = {
        panelId,
        isPanel: true,
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

  // Update materials when selection, hover, or finish changes
  const updateMaterials = useCallback(() => {
    panelMeshesRef.current.forEach((meshes, panelId) => {
      const isSel = selectedPanelIds.includes(panelId);
      const isHov = hoveredPanelId === panelId;

      meshes.forEach((mesh) => {
        if (!mesh.material) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (isSel) {
          // Protected with PPF film (vibrant crimson film with crystal gloss or stealth matte)
          mat.color.setHex(ppfFinish === 'GLOSS' ? 0xcc152f : 0xaa1326);
          mat.roughness = ppfFinish === 'GLOSS' ? 0.05 : 0.65;
          mat.metalness = ppfFinish === 'GLOSS' ? 0.42 : 0.12;
          mat.emissive.setHex(isHov ? 0xff2d4e : 0x6e0917);
          mat.emissiveIntensity = isHov ? 0.45 : 0.22;
        } else if (isHov) {
          // Hovered unselected: Elegant clearcoat sheen over authentic factory red paint
          // Preserves the real red car paint without turning into solid cartoon blue!
          mat.color.setHex(0xc71f35);
          mat.roughness = 0.04;
          mat.metalness = 0.50;
          mat.emissive.setHex(0xe61937); // Warm crimson highlight glow
          mat.emissiveIntensity = 0.38;
        } else {
          // Default unselected factory red paint
          mat.color.setHex(0xbd182d);
          mat.roughness = 0.12;
          mat.metalness = 0.35;
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
    });
  }, [selectedPanelIds, hoveredPanelId, ppfFinish]);

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
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(4.8, 2.0, 5.2);
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
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Never dip under floor
    controls.minDistance = 2.4;
    controls.maxDistance = 9.0;
    controlsRef.current = controls;

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffffff, 2.6);
    mainSpot.position.set(5, 8, 5);
    mainSpot.angle = Math.PI / 4;
    mainSpot.penumbra = 0.8;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 2048;
    mainSpot.shadow.mapSize.height = 2048;
    scene.add(mainSpot);

    const rimLight = new THREE.DirectionalLight(0xe61937, 1.4);
    rimLight.position.set(-6, 3, -5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
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

        // Clean exterior: hide mechanics, engine, interior, pedals, dash
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

        // 8. Scale wheels to authentic Golf GTI 18"/19" Pretoria proportions
        ['w1', 'w2', 'w3', 'w4'].forEach((wheelName) => {
          const wheelObj = car.getObjectByName(wheelName);
          if (wheelObj && wheelObj.parent) {
            const parent = wheelObj.parent;
            parent.updateMatrixWorld(true);

            const box = new THREE.Box3().setFromObject(wheelObj);
            const centerWorld = box.getCenter(new THREE.Vector3());
            const localCenter = parent.worldToLocal(centerWorld.clone());

            const pivot = new THREE.Group();
            pivot.name = `pivot_${wheelName}`;
            pivot.position.copy(localCenter);
            parent.add(pivot);

            wheelObj.position.sub(localCenter);
            pivot.add(wheelObj);
            pivot.scale.set(0.81, 0.81, 0.81);

            const tuckX = 0.052;
            pivot.position.x += localCenter.x > 0 ? -tuckX : tuckX;
          }
        });

        // Normalize scale to 4.26m real Golf GTI length
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
        car.position.y -= scaledBox.min.y; // Sit flush on ground
        car.position.z -= scaledCenter.z;

        // Process materials and split car paint body into discrete panels
        const meshesToSplit: THREE.Mesh[] = [];

        car.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const name = (mesh.name || '').toLowerCase();

            // Preserves Badges in Chrome
            if (name.includes('badge') || name.includes('emblem')) {
              mesh.material = chromeMatRef.current;
              return;
            }

            // Preserves Grilles and trims in Gloss Black
            if (name.includes('grille') || name.includes('chassis') || name.includes('trim')) {
              mesh.material = glossBlackMatRef.current;
              return;
            }

            // Preserves Glass Headlights & Windows
            if (name.includes('glass') || name.includes('window')) {
              mesh.material = tintedGlassMatRef.current;
              return;
            }

            // Preserves Mirrors as a discrete panel
            if (name.includes('mirror')) {
              mesh.userData = {
                panelId: 'mirrors',
                isPanel: true,
              };
              const mMat = new THREE.MeshStandardMaterial({
                color: 0xbd182d,
                roughness: 0.12,
                metalness: 0.35,
              });
              mesh.material = mMat;
              if (!panelMeshesRef.current.has('mirrors')) {
                panelMeshesRef.current.set('mirrors', []);
              }
              panelMeshesRef.current.get('mirrors')!.push(mesh);
              return;
            }

            // Identify Car Paint Body Meshes
            if (
              name.includes('carpaint') ||
              name.includes('car_paint') ||
              name.includes('phong2') ||
              name.includes('phong3')
            ) {
              meshesToSplit.push(mesh);
            }
          }
        });

        // Split paint meshes into clean discrete body panels
        meshesToSplit.forEach((paintMesh) => {
          const panelGroup = splitPaintMeshIntoPanels(paintMesh);
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

    // 8. 60 FPS Render Loop
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

  // Click & Hover Raycasting Handlers
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

    if (view === 'iso') camera.position.set(4.8, 2.0, 5.2);
    else if (view === 'front') camera.position.set(0, 1.0, 6.2);
    else if (view === 'side') camera.position.set(6.2, 1.0, 0);
    else if (view === 'rear') camera.position.set(0, 1.1, -6.2);
    else if (view === 'top') camera.position.set(0, 7.5, 0.01);

    camera.lookAt(controls.target);
  };

  const hoveredMeta = STANDARD_PANELS.find((p) => p.id === hoveredPanelId);

  return (
    <div style={{ position: 'relative', width: '100%', height: '520px', background: '#06070a', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas Mount */}
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

      {/* Floating HUD Card when a Panel is Hovered */}
      {hoveredMeta && (
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            right: 18,
            background: 'rgba(12, 14, 20, 0.95)',
            border: '1px solid var(--accent-red-border)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '11px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
            zIndex: 35,
            maxWidth: '260px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '12px' }}>
              {hoveredMeta.spanishName || hoveredMeta.name}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red-hover)', fontWeight: 700 }}>
              {hoveredMeta.cutLength}m lineal
            </span>
          </div>
          <div style={{ color: '#8893a4', fontSize: '10px', marginBottom: 8 }}>
            Ancho rollo: {hoveredMeta.cutWidth}m · Cobertura: {hoveredMeta.sqMeters} m²
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
            <div>Instalación: <strong style={{ color: '#ffffff' }}>{hoveredMeta.laborHours}h</strong></div>
            <div>Dificultad: <strong style={{ color: '#f59e0b' }}>{hoveredMeta.difficulty}</strong></div>
            <div style={{ gridColumn: 'span 2' }}>
              Estado:{' '}
              <strong style={{ color: selectedPanelIds.includes(hoveredMeta.id) ? '#10b981' : '#8893a4' }}>
                {selectedPanelIds.includes(hoveredMeta.id) ? '✓ SELECCIONADO PARA CORTE' : 'NO SELECCIONADO'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls Overlay Bar */}
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
        CLICK EN CUALQUIER PIEZA PARA SELECCIONAR CORTE · ARRASTRA PARA ROTAR 360° · RUEDA PARA ZOOM
      </div>
    </div>
  );
};
