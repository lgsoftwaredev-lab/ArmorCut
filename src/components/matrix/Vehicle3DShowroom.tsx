'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STANDARD_PANELS } from '@/data/materialsAndPanels';
import { buildTechnicalCADVehicle, PanelRegistration } from './TechnicalCarBuilder';
import { RotateCw, Shield, Eye, Layers, Check, LayoutGrid, Sparkles } from 'lucide-react';

interface Vehicle3DShowroomProps {
  selectedPanelIds: string[];
  onTogglePanel: (panelId: string) => void;
  hoveredPanelId: string | null;
  onHoverPanel: (panelId: string | null) => void;
  vehicleModelPath?: string;
  vehicleName?: string;
}

type ModelViewMode = 'CAD' | 'GLB';

export const Vehicle3DShowroom: React.FC<Vehicle3DShowroomProps> = ({
  selectedPanelIds,
  onTogglePanel,
  hoveredPanelId,
  onHoverPanel,
  vehicleModelPath = '/models/golf_gti_mk7.glb',
  vehicleName = 'Volkswagen Golf GTI Clubsport MK7',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelMode, setModelMode] = useState<ModelViewMode>('CAD');
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [ppfFinish, setPpfFinish] = useState<'GLOSS' | 'MATTE'>('GLOSS');
  const [activeCameraAngle, setActiveCameraAngle] = useState<'iso' | 'front' | 'side' | 'rear' | 'top'>('iso');

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const carModelRef = useRef<THREE.Group | null>(null);

  // Map of panelId -> array of { mesh, edgeLine }
  const panelRegistrationsRef = useRef<Map<string, { mesh: THREE.Mesh; edgeLine?: THREE.LineSegments }[]>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Automotive Standard Materials for CAD Showroom
  // Unselected Panel: Clean neutral technical CAD titanium slate
  const defaultPanelMatRef = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.38,
      metalness: 0.25,
      emissive: 0x000000,
      emissiveIntensity: 0,
    })
  );

  // Update materials across all registered panel meshes and edge lines
  const updateMaterials = useCallback(() => {
    panelRegistrationsRef.current.forEach((registrations, panelId) => {
      const isSelected = selectedPanelIds.includes(panelId);
      const isHovered = hoveredPanelId === panelId;

      registrations.forEach(({ mesh, edgeLine }) => {
        if (!mesh.material) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (isSelected) {
          // PPF Protected Panel: High-contrast vibrant crimson shield with glossy clearcoat or stealth satin
          mat.color.setHex(ppfFinish === 'GLOSS' ? 0xe11d48 : 0xbe123c);
          mat.roughness = ppfFinish === 'GLOSS' ? 0.08 : 0.60;
          mat.metalness = ppfFinish === 'GLOSS' ? 0.35 : 0.15;
          mat.emissive.setHex(isHovered ? 0xf43f5e : 0x9f1239);
          mat.emissiveIntensity = isHovered ? 0.55 : 0.35;

          if (edgeLine && edgeLine.material) {
            (edgeLine.material as THREE.LineBasicMaterial).color.setHex(0xfecdd3); // Bright luminous edge
          }
        } else if (isHovered) {
          // Hovered Unselected Panel: Electric technical cyan highlight for instant feedback
          mat.color.setHex(0x0284c7);
          mat.roughness = 0.18;
          mat.metalness = 0.40;
          mat.emissive.setHex(0x0284c7);
          mat.emissiveIntensity = 0.45;

          if (edgeLine && edgeLine.material) {
            (edgeLine.material as THREE.LineBasicMaterial).color.setHex(0x38bdf8); // Glowing cyan border
          }
        } else {
          // Default Unselected Panel: Neutral CAD titanium slate with crisp shutline
          mat.color.setHex(0x475569);
          mat.roughness = 0.38;
          mat.metalness = 0.25;
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;

          if (edgeLine && edgeLine.material) {
            (edgeLine.material as THREE.LineBasicMaterial).color.setHex(0x0f172a); // Deep dark shutline
          }
        }
      });
    });
  }, [selectedPanelIds, hoveredPanelId, ppfFinish]);

  useEffect(() => {
    updateMaterials();
  }, [updateMaterials]);

  // Load CAD or GLB vehicle model into scene
  const loadModel = useCallback((mode: ModelViewMode) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous model & registrations
    if (carModelRef.current) {
      scene.remove(carModelRef.current);
      carModelRef.current = null;
    }
    panelRegistrationsRef.current.clear();
    setLoadError(null);

    if (mode === 'CAD') {
      // 100% discrete procedural CAD model with exact sheet metal shutlines
      setIsLoading(false);
      const cadCar = buildTechnicalCADVehicle((reg: PanelRegistration) => {
        if (!panelRegistrationsRef.current.has(reg.panelId)) {
          panelRegistrationsRef.current.set(reg.panelId, []);
        }
        panelRegistrationsRef.current.get(reg.panelId)!.push({
          mesh: reg.mesh,
          edgeLine: reg.edgeLine,
        });
      });

      // Position CAD car centered on turntable
      cadCar.position.set(0, 0, 0);
      carModelRef.current = cadCar;
      scene.add(cadCar);
      updateMaterials();
    } else {
      // External GLB Showroom model
      setIsLoading(true);
      const loader = new GLTFLoader();

      loader.load(
        vehicleModelPath,
        (gltf) => {
          const car = gltf.scene;
          carModelRef.current = car;

          // Scale and center GLB
          const rawBox = new THREE.Box3().setFromObject(car);
          const rawSize = rawBox.getSize(new THREE.Vector3());
          const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
          if (maxDim > 8 || maxDim < 1.0) {
            car.scale.multiplyScalar(4.26 / maxDim);
          }
          const scaledBox = new THREE.Box3().setFromObject(car);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          car.position.x -= scaledCenter.x;
          car.position.y -= scaledBox.min.y;
          car.position.z -= scaledCenter.z;

          // Traverse meshes and register paint panels
          car.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              const name = (mesh.name || '').toLowerCase();

              // Simple panel attribution for GLB fallback
              let panelId = 'hood';
              if (name.includes('bumper_f') || name.includes('front_bumper')) panelId = 'bumper_front';
              else if (name.includes('bumper_r') || name.includes('rear_bumper')) panelId = 'bumper_rear';
              else if (name.includes('roof')) panelId = 'roof';
              else if (name.includes('door_l')) panelId = 'door_front_left';
              else if (name.includes('door_r')) panelId = 'door_front_right';
              else if (name.includes('fender_l')) panelId = 'fender_left';
              else if (name.includes('fender_r')) panelId = 'fender_right';
              else if (name.includes('trunk') || name.includes('tailgate')) panelId = 'trunk';

              mesh.userData = { panelId, isPanel: true };
              if (!panelRegistrationsRef.current.has(panelId)) {
                panelRegistrationsRef.current.set(panelId, []);
              }
              panelRegistrationsRef.current.get(panelId)!.push({ mesh });
            }
          });

          scene.add(car);
          setIsLoading(false);
          updateMaterials();
        },
        (xhr) => {
          if (xhr.total > 0) setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        },
        (err) => {
          console.error('Error loading GLB:', err);
          setLoadError('No se pudo cargar el archivo GLB. Cambiando a vista CAD.');
          setModelMode('CAD');
          setIsLoading(false);
        }
      );
    }
  }, [vehicleModelPath, updateMaterials]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e); // Sleek luxury graphite background
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(4.2, 2.3, 4.4);
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
    controls.target.set(0, 0.72, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Never clip under floor
    controls.minDistance = 2.0;
    controls.maxDistance = 9.5;
    controlsRef.current = controls;

    // 5. High-Clarity Neutral Technical Studio Lighting
    // Clean, balanced white lights so all sheet metal shutlines are 100% visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keySpot = new THREE.SpotLight(0xffffff, 2.2);
    keySpot.position.set(5.5, 7.5, 5.5);
    keySpot.angle = Math.PI / 4;
    keySpot.penumbra = 0.7;
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.width = 2048;
    keySpot.shadow.mapSize.height = 2048;
    scene.add(keySpot);

    const fillLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight1.position.set(-6, 4.5, -5);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight2.position.set(0, 6, -6);
    scene.add(fillLight2);

    const frontFill = new THREE.DirectionalLight(0xffffff, 0.9);
    frontFill.position.set(0, 3, 6);
    scene.add(frontFill);

    // 6. Technical Circular Turntable Floor
    const floorGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.06, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d14,
      roughness: 0.45,
      metalness: 0.75,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.03;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Subtle radial concentric ring marker on floor
    const ringGeo = new THREE.RingGeometry(3.6, 3.63, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.002;
    scene.add(ringMesh);

    // Initial model load
    loadModel(modelMode);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = isRotating;
        controlsRef.current.autoRotateSpeed = 1.4;
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [loadModel, modelMode, isRotating]);

  // Reload model when mode changes
  useEffect(() => {
    loadModel(modelMode);
  }, [modelMode, loadModel]);

  // Raycasting & Mouse Interaction
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect || !cameraRef.current || !sceneRef.current) return;

    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (carModelRef.current) {
      const intersects = raycasterRef.current.intersectObjects(carModelRef.current.children, true);
      let foundPanelId: string | null = null;

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== carModelRef.current) {
          if (cur.userData && cur.userData.isPanel && cur.userData.panelId) {
            foundPanelId = cur.userData.panelId;
            break;
          }
          cur = cur.parent;
        }
        if (foundPanelId) break;
      }

      if (foundPanelId !== hoveredPanelId) {
        onHoverPanel(foundPanelId);
      }
    }
  };

  const handlePointerLeave = () => {
    onHoverPanel(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect || !cameraRef.current || !sceneRef.current || !carModelRef.current) return;

    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(carModelRef.current.children, true);

    for (const hit of intersects) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur && cur !== carModelRef.current) {
        if (cur.userData && cur.userData.isPanel && cur.userData.panelId) {
          onTogglePanel(cur.userData.panelId);
          return;
        }
        cur = cur.parent;
      }
    }
  };

  // Camera presets
  const setCameraAngle = (view: 'iso' | 'front' | 'side' | 'rear' | 'top') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    setActiveCameraAngle(view);

    switch (view) {
      case 'iso':
        camera.position.set(4.2, 2.3, 4.4);
        controls.target.set(0, 0.72, 0);
        break;
      case 'front':
        camera.position.set(0, 0.95, 4.2);
        controls.target.set(0, 0.72, 0.3);
        break;
      case 'side':
        camera.position.set(4.4, 0.85, -0.05);
        controls.target.set(0, 0.72, -0.05);
        break;
      case 'rear':
        camera.position.set(0, 1.05, -4.4);
        controls.target.set(0, 0.72, -0.3);
        break;
      case 'top':
        camera.position.set(0, 4.8, 0.01);
        controls.target.set(0, 0.72, 0);
        break;
    }
    controls.update();
  };

  const hoveredMeta = hoveredPanelId ? STANDARD_PANELS.find((p) => p.id === hoveredPanelId) : null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '620px',
        background: '#07090e',
        borderRadius: '16px',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          cursor: hoveredPanelId ? 'pointer' : 'grab',
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(7, 9, 14, 0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              border: '3px solid rgba(225, 29, 72, 0.2)',
              borderTopColor: 'var(--accent-red)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600 }}>
            Cargando Carrocería 3D ({loadProgress}%)
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
          zIndex: 5,
        }}
      >
        {/* Left: View Mode Toggle & Camera Angles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          {/* Mode Switcher: CAD Despiece Técnico vs GLB */}
          <div
            style={{
              display: 'flex',
              gap: '3px',
              background: 'rgba(12, 14, 20, 0.90)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <button
              type="button"
              onClick={() => setModelMode('CAD')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: modelMode === 'CAD' ? '#ffffff' : '#8893a4',
                background: modelMode === 'CAD' ? 'var(--accent-red)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Geometría CAD con líneas de chapa 100% exactas y separadas"
            >
              <LayoutGrid style={{ width: 13, height: 13 }} />
              Despiece CAD (Líneas Exactas)
            </button>
            <button
              type="button"
              onClick={() => setModelMode('GLB')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: modelMode === 'GLB' ? '#ffffff' : '#8893a4',
                background: modelMode === 'GLB' ? '#334155' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Modelo GLB completo para visualización exterior general"
            >
              <Eye style={{ width: 13, height: 13 }} />
              Showroom GLB
            </button>
          </div>

          {/* Camera Angles */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(12, 14, 20, 0.85)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(6px)',
            }}
          >
            {(['iso', 'front', 'side', 'rear', 'top'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCameraAngle(view)}
                style={{
                  padding: '4px 9px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: activeCameraAngle === view ? 700 : 500,
                  color: activeCameraAngle === view ? '#ffffff' : '#94a3b8',
                  background: activeCameraAngle === view ? 'rgba(255,255,255,0.12)' : 'transparent',
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
        </div>

        {/* Right: PPF Film Finish & Turntable Rotation */}
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
          {/* PPF Finish Switch */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(12, 14, 20, 0.85)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(6px)',
            }}
          >
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

      {/* Floating Technical HUD Hover Badge */}
      {hoveredMeta && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 20,
            background: 'rgba(9, 12, 19, 0.94)',
            border: '1px solid var(--accent-red-border)',
            borderRadius: '12px',
            padding: '12px 18px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            pointerEvents: 'none',
            zIndex: 10,
            maxWidth: '340px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-red)',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              PANEL CAD DETECTADO
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: selectedPanelIds.includes(hoveredMeta.id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                color: selectedPanelIds.includes(hoveredMeta.id) ? '#34d399' : '#cbd5e1',
                border: `1px solid ${selectedPanelIds.includes(hoveredMeta.id) ? '#10b981' : '#475569'}`,
              }}
            >
              {selectedPanelIds.includes(hoveredMeta.id) ? '✓ CUBIERTO' : 'DISPONIBLE'}
            </span>
          </div>

          <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
            {hoveredMeta.spanishName || hoveredMeta.name}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px 14px',
              marginTop: '10px',
              fontSize: '11px',
              color: '#94a3b8',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '8px',
            }}
          >
            <div>
              Medida Paño:{' '}
              <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {hoveredMeta.cutWidth}m × {hoveredMeta.cutLength}m
              </strong>
            </div>
            <div>
              Superficie:{' '}
              <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {hoveredMeta.sqMeters} m²
              </strong>
            </div>
            <div>
              Instalación:{' '}
              <strong style={{ color: '#ffffff' }}>
                {hoveredMeta.laborHours}h ({hoveredMeta.difficulty})
              </strong>
            </div>
            <div>
              Margen Remetido:{' '}
              <strong style={{ color: '#ffffff' }}>
                +{hoveredMeta.wrappedMarginMm || 20} mm
              </strong>
            </div>
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '10px',
              color: selectedPanelIds.includes(hoveredMeta.id) ? '#fda4af' : '#38bdf8',
              fontStyle: 'italic',
            }}
          >
            Haz click para {selectedPanelIds.includes(hoveredMeta.id) ? 'quitar' : 'añadir'} este panel
          </div>
        </div>
      )}

      {/* Floating 3D Instructions Footer */}
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
