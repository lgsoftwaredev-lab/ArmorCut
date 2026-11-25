'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STANDARD_PANELS } from '@/data/materialsAndPanels';
import { RotateCw, Shield, Eye, Layers, Check, LayoutGrid, Sparkles } from 'lucide-react';

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
  const isRotatingRef = useRef(isRotating);
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);
  const [ppfFinish, setPpfFinish] = useState<'GLOSS' | 'MATTE'>('GLOSS');
  const [activeCameraAngle, setActiveCameraAngle] = useState<'iso' | 'front' | 'side' | 'rear' | 'top'>('iso');

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const carModelRef = useRef<THREE.Group | null>(null);

  // Map of panelId -> array of { mesh }
  const panelRegistrationsRef = useRef<Map<string, { mesh: THREE.Mesh }[]>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Automotive basic materials for authentic GLB model
  const chromeMatRef = useRef(
    new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.12,
      metalness: 0.95,
    })
  );

  const glossBlackMatRef = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.20,
      metalness: 0.70,
    })
  );

  const tintedGlassMatRef = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x07090e,
      roughness: 0.06,
      metalness: 0.85,
    })
  );

  // Update materials across all registered panel meshes and edge lines
  const updateMaterials = useCallback(() => {
    panelRegistrationsRef.current.forEach((registrations, panelId) => {
      const isSelected = selectedPanelIds.includes(panelId);
      const isHovered = hoveredPanelId === panelId;

      registrations.forEach(({ mesh }) => {
        if (!mesh.material) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (isSelected) {
          // PPF Protected Panel: High-contrast vibrant crimson shield with glossy clearcoat or stealth satin
          mat.color.setHex(ppfFinish === 'GLOSS' ? 0xe11d48 : 0xbe123c);
          mat.roughness = ppfFinish === 'GLOSS' ? 0.08 : 0.58;
          mat.metalness = ppfFinish === 'GLOSS' ? 0.35 : 0.15;
          mat.emissive.setHex(isHovered ? 0xf43f5e : 0x9f1239);
          mat.emissiveIntensity = isHovered ? 0.55 : 0.35;

        } else if (isHovered) {
          // Hovered Unselected Panel: Electric technical cyan highlight for instant feedback
          mat.color.setHex(0x0284c7);
          mat.roughness = 0.20;
          mat.metalness = 0.40;
          mat.emissive.setHex(0x0284c7);
          mat.emissiveIntensity = 0.45;
        } else {
          // Default Unselected Panel: 100% Original Factory Paint & Finish!
          const orig = mesh.userData.originalMaterial as THREE.MeshStandardMaterial;
          if (orig && orig.color) {
            mat.color.copy(orig.color);
            mat.roughness = orig.roughness ?? 0.15;
            mat.metalness = orig.metalness ?? 0.35;
            if (orig.map) mat.map = orig.map;
            if (orig.normalMap) mat.normalMap = orig.normalMap;
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
            mat.needsUpdate = true;
          } else if (mesh.userData.originalColor) {
            mat.color.copy(mesh.userData.originalColor);
            mat.roughness = mesh.userData.originalRoughness ?? 0.15;
            mat.metalness = mesh.userData.originalMetalness ?? 0.35;
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
            mat.needsUpdate = true;
          }
        }
      });
    });
  }, [selectedPanelIds, hoveredPanelId, ppfFinish]);

  const updateMaterialsRef = useRef(updateMaterials);
  useEffect(() => {
    updateMaterialsRef.current = updateMaterials;
  }, [updateMaterials]);

  useEffect(() => {
    updateMaterials();
  }, [updateMaterials]);

  // Splits GLTF car paint mesh into clean discrete panels without cutting polygons
  const splitGLTFCarPaintIntoPanels = useCallback((paintMesh: THREE.Mesh): THREE.Group => {
    const panelGroup = new THREE.Group();
    panelGroup.name = 'GLTF_SplitPanels';

    const geom = paintMesh.geometry;
    const posAttr = geom.attributes.position;
    const normAttr = geom.attributes.normal;
    const uvAttr = geom.attributes.uv;
    const index = geom.index;

    const triCount = index ? index.count / 3 : posAttr.count / 3;

    // 1. Build disjoint-set (union-find) of triangles sharing edges
    const parent = new Int32Array(triCount);
    for (let i = 0; i < triCount; i++) parent[i] = i;

    const find = (i: number): number => {
      let curr = i;
      while (parent[curr] !== curr) {
        parent[curr] = parent[parent[curr]];
        curr = parent[curr];
      }
      return curr;
    };

    const union = (i: number, j: number) => {
      const rI = find(i);
      const rJ = find(j);
      if (rI !== rJ) parent[rI] = rJ;
    };

    const edgeMap = new Map<string, number>();
    for (let t = 0; t < triCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3;
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

      const edges: [number, number][] = [
        [Math.min(i0, i1), Math.max(i0, i1)],
        [Math.min(i1, i2), Math.max(i1, i2)],
        [Math.min(i2, i0), Math.max(i2, i0)],
      ];

      for (const [a, b] of edges) {
        const key = `${a}_${b}`;
        const prev = edgeMap.get(key);
        if (prev !== undefined) {
          union(t, prev);
        } else {
          edgeMap.set(key, t);
        }
      }
    }

    // 2. Group triangles by root component
    const compMap = new Map<number, number[]>();
    for (let t = 0; t < triCount; t++) {
      const root = find(t);
      if (!compMap.has(root)) compMap.set(root, []);
      compMap.get(root)!.push(t);
    }

    // Detect coordinate orientation (SW4 along X, BMW M2 F87 along Y, Golf GTI & G87 along Z)
    let minCoordX = 999, maxCoordX = -999;
    let minCoordY = 999, maxCoordY = -999;
    let minCoordZ = 999, maxCoordZ = -999;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      if (x < minCoordX) minCoordX = x;
      if (x > maxCoordX) maxCoordX = x;
      if (y < minCoordY) minCoordY = y;
      if (y > maxCoordY) maxCoordY = y;
      if (z < minCoordZ) minCoordZ = z;
      if (z > maxCoordZ) maxCoordZ = z;
    }
    const dimX = maxCoordX - minCoordX;
    const dimY = maxCoordY - minCoordY;
    const dimZ = maxCoordZ - minCoordZ;
    const isXAxisLongitudinal = dimX > dimY && dimX > dimZ;
    const isYAxisLongitudinal = dimY > dimX && dimY > dimZ;
    const meshLowerName = (paintMesh.name || '').toLowerCase();
    const isGolfDoorFrameTrim = meshLowerName.includes('phong11sg1');
    const isGolfPianoBlackTrim = meshLowerName.includes('phong10sg1');
    const isGolfGlassOrLight =
      meshLowerName.includes('phong4sg1') ||
      meshLowerName.includes('phong5sg1') ||
      meshLowerName.includes('phong6sg1') ||
      meshLowerName.includes('phong13sg1');

    // 3. High-precision component classifier based on topological bounds
    const classifyComponent = (
      minX: number,
      maxX: number,
      minY: number,
      maxY: number,
      minZ: number,
      maxZ: number,
      cx: number,
      cy: number,
      cz: number
    ): string => {
      // Golf GTI MK7 Piano Black exterior trim mesh (phong10SG1):
      // Isolate ONLY the exterior side mirror housings (carcasas de espejos retrovisores)
      if (isGolfPianoBlackTrim) {
        if (
          minY >= 0.77 &&
          maxY <= 0.94 &&
          minZ >= 0.51 &&
          maxZ <= 0.75 &&
          Math.abs(cx) > 0.82
        ) {
          return 'mirrors';
        }
        return '__static__';
      }

      // Golf GTI MK7 glass & optical meshes (phong4SG1, phong5SG1, phong6SG1, phong13SG1):
      // Separate front headlights, rear taillights, and each individual window/sunroof glass piece
      if (isGolfGlassOrLight) {
        if (minZ > 1.40) {
          return 'headlights';
        }
        if (maxZ < -1.50 && minY >= 0.60 && maxY <= 0.85) {
          return 'taillights';
        }
        if (maxZ < -1.50 && minY > 0.85 && maxY <= 1.18 && Math.abs(cx) < 0.30) {
          return 'rear_windshield';
        }
        if (minY > 1.19 && minZ > -0.75 && maxZ < 0.35 && Math.abs(cx) < 0.50) {
          return 'sunroof';
        }
        if (minZ > 0.20 && maxZ < 1.25 && Math.abs(cx) < 0.30 && maxY <= 1.23) {
          return 'windshield';
        }
        if (!meshLowerName.includes('phong6sg1') && minZ > -0.55 && maxZ < 0.90 && Math.abs(cx) > 0.50) {
          return cx > 0 ? 'window_front_left' : 'window_front_right';
        }
        if (!meshLowerName.includes('phong6sg1') && minZ > -1.35 && maxZ < -0.52 && Math.abs(cx) > 0.50) {
          return cx > 0 ? 'window_rear_left' : 'window_rear_right';
        }
        return '__static__';
      }

      // Golf GTI MK7 smooth black trim mesh: isolate ONLY the flat Piano Black B-Pillar vertical applique
      // and exclude all rubber window weatherstrips/seals (upper arch seal, lower horizontal beltline seal, rear rubber lip)
      if (isGolfDoorFrameTrim) {
        if (
          minY >= 0.84 &&
          maxY <= 1.23 &&
          maxY - minY > 0.30 &&
          minZ >= -0.57 &&
          maxZ <= -0.35 &&
          maxZ - minZ > 0.14 &&
          Math.abs(cx) > 0.50
        ) {
          return 'pillars_a_b';
        }
        return '__static__';
      }

      // 1. Toyota SW4 (Longitudinal X)
      if (isXAxisLongitudinal) {
        if (cx >= 0.05 && cx <= 1.40 && cz > 1.50 && Math.abs(cy) < 0.85) return 'hood';
        if (cx < 0.65 && cz < 1.50) return 'bumper_front';
        if (cx >= 0.40 && cx <= 1.70 && Math.abs(cy) > 0.65) {
          return cy < 0 ? 'fender_left' : 'fender_right';
        }
        if (cx >= 1.35 && cx <= 3.80) {
          return cy < 0 ? 'quarter_left' : 'quarter_right';
        }
        if (cx > 3.80) return 'bumper_rear';
        return cx > 2.0 ? 'bumper_rear' : 'bumper_front';
      }

      // 2. BMW M2 F87 (Longitudinal Y)
      if (isYAxisLongitudinal) {
        if (cz > 1.25 && Math.abs(cx) < 0.60) return 'roof';
        if (cz < 0.40) return 'rocker_panels';
        if (cx > 0.35) return 'quarter_left';
        if (cx < -0.35) return 'quarter_right';
        return cy > 0 ? 'quarter_left' : 'quarter_right';
      }

      // 3. Golf GTI MK7 / BMW M2 G87 (Longitudinal Z, +Z = Front, +X = Left / Conductor, -X = Right / Acompañante)
      // Rear spoiler / Clubsport wing
      if (cz < -1.45 && cy > 1.15 && Math.abs(cx) < 0.60) return 'rear_spoiler';
      // Roof panel
      if (cz > -1.55 && cz < -0.50 && cy > 1.18 && Math.abs(cx) < 0.60) return 'roof';
      // Trunk / Hatch / Portón Trasero
      if (cz < -1.65 && cy > 0.45 && Math.abs(cx) < 0.72) return 'trunk';
      // Rear bumper
      if (cz < -1.45 && cy < 0.68) return 'bumper_rear';
      // Hood (Capot)
      if (cz > 0.70 && cy > 0.48 && Math.abs(cx) < 0.85) return 'hood';
      // Front bumper
      if (cz > 1.40 && cy < 0.65) return 'bumper_front';
      // Front fenders (cx > 0 is Left / Conductor, cx < 0 is Right / Acompañante)
      if (cz >= 0.60 && cz <= 1.80 && cy >= 0.10 && minZ > 0.55) {
        return cx > 0 ? 'fender_left' : 'fender_right';
      }
      // Door handles (Manijas de puerta independientes de la chapa de la puerta)
      if (
        minY >= 0.68 &&
        maxY <= 0.78 &&
        maxY - minY < 0.08 &&
        minZ >= -0.50 &&
        maxZ <= -0.20 &&
        Math.abs(cx) > 0.80
      ) {
        return 'door_cups';
      }
      // Rear Quarters & side body frame
      if (minZ < -0.6) {
        return cx > 0 ? 'quarter_left' : 'quarter_right';
      }
      // Front Doors (cx > 0 is Left / Conductor, cx < 0 is Right / Acompañante)
      if (maxY < 0.98 && minZ >= -0.65 && maxZ <= 0.95) {
        return cx > 0 ? 'door_front_left' : 'door_front_right';
      }
      return cz > 0 ? 'bumper_front' : 'bumper_rear';
    };

    // 4. Map triangles to panel IDs
    const panelTriangles = new Map<string, number[]>();

    compMap.forEach((tris) => {
      let minX = 999, maxX = -999;
      let minY = 999, maxY = -999;
      let minZ = 999, maxZ = -999;

      for (const t of tris) {
        for (let v = 0; v < 3; v++) {
          const vi = index ? index.getX(t * 3 + v) : t * 3 + v;
          const x = posAttr.getX(vi);
          const y = posAttr.getY(vi);
          const z = posAttr.getZ(vi);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        }
      }

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const cz = (minZ + maxZ) / 2;

      const panelId = classifyComponent(minX, maxX, minY, maxY, minZ, maxZ, cx, cy, cz);

      if (!panelTriangles.has(panelId)) {
        panelTriangles.set(panelId, []);
      }
      const arr = panelTriangles.get(panelId)!;
      for (const t of tris) {
        arr.push(t);
      }
    });

    // 5. Construct discrete BufferGeometry and Mesh for each panel
    panelTriangles.forEach((tris, panelId) => {
      const pCount = tris.length;
      const newPos = new Float32Array(pCount * 9);
      const newNorm = normAttr ? new Float32Array(pCount * 9) : null;
      const newUV = uvAttr ? new Float32Array(pCount * 6) : null;

      for (let dt = 0; dt < pCount; dt++) {
        const t = tris[dt];
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
        const vertIndices = [i0, i1, i2];

        for (let v = 0; v < 3; v++) {
          const vi = vertIndices[v];
          newPos[(dt * 3 + v) * 3] = posAttr.getX(vi);
          newPos[(dt * 3 + v) * 3 + 1] = posAttr.getY(vi);
          newPos[(dt * 3 + v) * 3 + 2] = posAttr.getZ(vi);

          if (normAttr && newNorm) {
            newNorm[(dt * 3 + v) * 3] = normAttr.getX(vi);
            newNorm[(dt * 3 + v) * 3 + 1] = normAttr.getY(vi);
            newNorm[(dt * 3 + v) * 3 + 2] = normAttr.getZ(vi);
          }

          if (uvAttr && newUV) {
            newUV[(dt * 3 + v) * 2] = uvAttr.getX(vi);
            newUV[(dt * 3 + v) * 2 + 1] = uvAttr.getY(vi);
          }
        }
      }

      const pGeom = new THREE.BufferGeometry();
      pGeom.setAttribute('position', new THREE.BufferAttribute(newPos, 3));
      if (newNorm) pGeom.setAttribute('normal', new THREE.BufferAttribute(newNorm, 3));
      else pGeom.computeVertexNormals();
      if (newUV) pGeom.setAttribute('uv', new THREE.BufferAttribute(newUV, 2));

      // Clone authentic factory car paint material or specialized optical/glass finish
      let sourceMat = paintMesh.material as THREE.MeshStandardMaterial;
      if (isGolfGlassOrLight) {
        if (panelId === 'headlights') {
          sourceMat = new THREE.MeshStandardMaterial({
            color: 0x0c0e14,
            roughness: 0.08,
            metalness: 0.45,
          });
        } else if (panelId === 'taillights') {
          sourceMat = new THREE.MeshStandardMaterial({
            color: 0x33050a,
            roughness: 0.12,
            metalness: 0.35,
          });
        } else {
          sourceMat = new THREE.MeshStandardMaterial({
            color: 0x050609,
            roughness: 0.03,
            metalness: 0.20,
          });
        }
      }
      const panelMat = sourceMat ? sourceMat.clone() : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });

      const pMesh = new THREE.Mesh(pGeom, panelMat);
      pMesh.name = `panel_${panelId}`;
      pMesh.castShadow = true;
      pMesh.receiveShadow = true;

      if (panelId === '__static__') {
        pMesh.userData = { isPanel: false };
        panelGroup.add(pMesh);
        return;
      }

      pMesh.userData = {
        panelId,
        isPanel: true,
        originalMaterial: sourceMat,
        originalColor: sourceMat && sourceMat.color ? sourceMat.color.clone() : new THREE.Color(0xffffff),
        originalRoughness: sourceMat?.roughness ?? 0.15,
        originalMetalness: sourceMat?.metalness ?? 0.35,
      };

      panelGroup.add(pMesh);

      if (!panelRegistrationsRef.current.has(panelId)) {
        panelRegistrationsRef.current.set(panelId, []);
      }
      panelRegistrationsRef.current.get(panelId)!.push({ mesh: pMesh });
    });

    return panelGroup;
  }, []);

  // Main Three.js Scene Setup & Model Loading
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e); // Sleek luxury graphite background
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(3.9, 1.9, 3.9);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.62, 0); // Visual center of car
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Never clip under floor
    controls.minDistance = 2.0;
    controls.maxDistance = 9.5;
    controlsRef.current = controls;

    // 5. Balanced Neutral White Technical Studio Lighting (NO ECCENTRIC COLORS)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const keySpot = new THREE.SpotLight(0xffffff, 1.8);
    keySpot.position.set(5.0, 7.0, 5.0);
    keySpot.angle = Math.PI / 4;
    keySpot.penumbra = 0.6;
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.width = 2048;
    keySpot.shadow.mapSize.height = 2048;
    scene.add(keySpot);

    const fillLight1 = new THREE.DirectionalLight(0xffffff, 1.1);
    fillLight1.position.set(-5, 4.5, -4);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.9);
    fillLight2.position.set(0, 5, -5);
    scene.add(fillLight2);

    const frontFill = new THREE.DirectionalLight(0xffffff, 0.9);
    frontFill.position.set(0, 3, 5);
    scene.add(frontFill);

    // 6. Technical Circular Turntable Floor
    const floorGeo = new THREE.CylinderGeometry(3.6, 3.6, 0.06, 64);
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
    const ringGeo = new THREE.RingGeometry(2.7, 2.73, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.002;
    scene.add(ringMesh);

    // Load authentic Golf GTI Clubsport GLB Model
    setIsLoading(true);
    setLoadError(null);
    panelRegistrationsRef.current.clear();

    const loader = new GLTFLoader();
    loader.load(
      vehicleModelPath,
      (gltf) => {
        const car = gltf.scene;
        carModelRef.current = car;

        // Auto-scale model if scaled down by FBX 0.01 factor
        const rawBox = new THREE.Box3().setFromObject(car);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
        if (maxDim < 1.0) {
          car.scale.set(100, 100, 100);
          car.updateMatrixWorld(true);
        }

        // Center car flush on turntable floor y = 0
        const realBox = new THREE.Box3().setFromObject(car);
        const center = realBox.getCenter(new THREE.Vector3());
        car.position.x -= center.x;
        car.position.y -= realBox.min.y; // Sit flush on floor y=0
        car.position.z -= center.z;

        // Process materials and split car paint into clean discrete body panels
        const paintMeshesToSplit: THREE.Mesh[] = [];

        // Helper to register individual isolated body panels
        const registerPanelMesh = (mesh: THREE.Mesh, panelId: string) => {
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const origMat = mesh.material as THREE.MeshStandardMaterial;
          const clonedMat = origMat ? origMat.clone() : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });
          mesh.material = clonedMat;

          mesh.userData = {
            panelId,
            isPanel: true,
            originalMaterial: origMat,
            originalColor: origMat && origMat.color ? origMat.color.clone() : new THREE.Color(0xffffff),
            originalRoughness: origMat?.roughness ?? 0.15,
            originalMetalness: origMat?.metalness ?? 0.35,
          };

          if (!panelRegistrationsRef.current.has(panelId)) {
            panelRegistrationsRef.current.set(panelId, []);
          }
          panelRegistrationsRef.current.get(panelId)!.push({ mesh });
        };

        car.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const name = (mesh.name || '').toLowerCase();

            // 1. Discard non-PPF internal details (engine, interior, mechanical, chassis, exhaust, screws)
            if (
              name.includes('engine') ||
              name.includes('interior') ||
              name.includes('seat') ||
              name.includes('dash') ||
              name.includes('steering') ||
              name.includes('pedal') ||
              name.includes('underbody') ||
              name.includes('mechanical') ||
              name.includes('suspension') ||
              name.includes('screw') ||
              name.includes('bolt') ||
              name.includes('chassis') ||
              name.includes('exhaust') ||
              name.includes('gap_fill') ||
              name.includes('pipe') ||
              (name.includes('polysurface') && name.includes('silver'))
            ) {
              mesh.visible = false;
              return;
            }

            // 1b. Golf GTI MK7 Rear Bumper Lower Reflectors (Static non-selectable reflectors)
            if (name.includes('bumperr_seta') && (name.includes('phong4sg1') || name.includes('phong5sg1'))) {
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x33050a,
                roughness: 0.15,
                metalness: 0.30,
              });
              mesh.userData = { isPanel: false };
              return;
            }

            // 1c. Golf GTI MK7 Merged Glass & Optical Meshes: route to topological splitter
            // so headlights, taillights, windshield, sunroof, rear windshield, and each side window are independent
            if (
              name.includes('phong4sg1') ||
              name.includes('phong5sg1') ||
              name.includes('phong6sg1') ||
              name.includes('phong13sg1')
            ) {
              paintMeshesToSplit.push(mesh);
              return;
            }

            // 2. Windows & Glass: Standardize to G87 Studio Blackout Glass (High Gloss, Zero Cabin Glare)
            const isWindowGlass =
              !name.includes('light') &&
              !name.includes('lamp') &&
              !name.includes('red_glass') &&
              (name.includes('window') ||
                name.includes('glass') ||
                name.includes('windshield') ||
                name.includes('backlight') ||
                name.includes('doorglass') ||
                name.includes('sideglass') ||
                name.includes('toner'));

            if (isWindowGlass) {
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x050609, // Pitch black blackout tint
                roughness: 0.03,
                metalness: 0.20,
              });
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              return;
            }

            // 3. Taillights: Standardize to G87 Shadowline Smoked Ruby Red
            const isTaillight =
              name.includes('taillight') ||
              name.includes('red_glass') ||
              name.includes('breaklight') ||
              name.includes('bootlight') ||
              name.includes('tailight') ||
              name.includes('chmsl') ||
              name.includes('reverselight');

            if (isTaillight) {
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x33050a, // Dark smoked ruby
                roughness: 0.12,
                metalness: 0.35,
              });
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (!name.includes('chmsl')) {
                registerPanelMesh(mesh, 'taillights');
              }
              return;
            }

            // 4. Headlights: Standardize to G87 Shadowline Smoked Black Optical Housing
            const isHeadlight =
              name.includes('headlight') ||
              name.includes('headlamp') ||
              name.includes('runninglight') ||
              name.includes('foglight') ||
              name.includes('lightglass') ||
              name.includes('light_max') ||
              name.includes('ext_light') ||
              name.includes('lighta_material1');

            if (isHeadlight) {
              const shadowlineMat = new THREE.MeshStandardMaterial({
                color: 0x0c0e14, // Deep obsidian shadowline
                roughness: 0.08,
                metalness: 0.45,
              });
              mesh.material = shadowlineMat;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              // Register as interactive PPF protection panel
              registerPanelMesh(mesh, 'headlights');
              return;
            }

            // 5. BMW M2 F87 (bmw_m2.glb) Isolated Meshes
            if (name.includes('m2firby_hood')) { registerPanelMesh(mesh, 'hood'); return; }
            if (name.includes('m2firby_bumper_f')) { registerPanelMesh(mesh, 'bumper_front'); return; }
            if (name.includes('m2firby_bumper_r')) { registerPanelMesh(mesh, 'bumper_rear'); return; }
            if (name.includes('m2firby_door_l')) { registerPanelMesh(mesh, 'door_front_left'); return; }
            if (name.includes('m2firby_door_r')) { registerPanelMesh(mesh, 'door_front_right'); return; }
            if (name.includes('m2firby_fender_l')) { registerPanelMesh(mesh, 'fender_left'); return; }
            if (name.includes('m2firby_fender_r')) { registerPanelMesh(mesh, 'fender_right'); return; }
            if (name.includes('m2firby_trunk')) { registerPanelMesh(mesh, 'trunk'); return; }
            if (name.includes('m2firby_mirror')) { registerPanelMesh(mesh, 'mirrors'); return; }
            if (name.includes('m2firby_body_m2firby_body_0')) { paintMeshesToSplit.push(mesh); return; }

            // 6. Toyota SW4 Isolated Doors / Trunk / Roof / Split Body
            if (name.includes('fl_door') && name.includes('carpaint')) { registerPanelMesh(mesh, 'door_front_left'); return; }
            if (name.includes('rf_door') && name.includes('carpaint')) { registerPanelMesh(mesh, 'door_front_right'); return; }
            if (name.includes('rl_door') && name.includes('carpaint')) { registerPanelMesh(mesh, 'door_rear_left'); return; }
            if (name.includes('rr_door') && name.includes('carpaint')) { registerPanelMesh(mesh, 'door_rear_right'); return; }
            if (name.includes('bootdoor') && name.includes('carpaint')) { registerPanelMesh(mesh, 'trunk'); return; }
            if (name.includes('roof') && name.includes('carpaint')) { registerPanelMesh(mesh, 'roof'); return; }
            if (name.includes('carpaint_dmtab') && (name.includes('ext_carpaint') || name.includes('carpaint_0'))) {
              paintMeshesToSplit.push(mesh);
              return;
            }

            // 7. BMW M2 G87 (bmw_m2_g87.glb)
            if (name.includes('carbon1_geo_loda')) { registerPanelMesh(mesh, 'roof'); return; }
            if (name.includes('paint_geo_loda') || name.includes('paint_material')) { paintMeshesToSplit.push(mesh); return; }

            // 8. Golf GTI MK7 (golf_gti_mk7.glb) & Generic Paint Meshes
            if (
              name.includes('phong2sg1') ||
              name.includes('phong10sg1') ||
              name.includes('phong11sg1') ||
              (name.includes('carpaint') &&
                !name.includes('phong3') &&
                !name.includes('trim') &&
                !name.includes('hinges') &&
                !name.includes('rim') &&
                !name.includes('wheel'))
            ) {
              paintMeshesToSplit.push(mesh);
              return;
            }

            // Golf GTI MK7 Reflective Mirror Lens (el espejo como tal — NO seleccionable)
            if (name.includes('phong16sg1')) {
              mesh.userData = { isPanel: false };
              return;
            }

            // Side Mirrors (Generic)
            if (name.includes('mirror') && !name.includes('in_mirror') && !name.includes('rearview') && !name.includes('glass')) {
              registerPanelMesh(mesh, 'mirrors');
              return;
            }

            // NOTE: All other meshes (wheels, tires, carbon fiber, emblems, exhausts) RETAIN THEIR ORIGINAL FACTORY MATERIALS!
          }
        });

        // Split paint meshes into clean discrete body panels
        paintMeshesToSplit.forEach((paintMesh) => {
          const splitGroup = splitGLTFCarPaintIntoPanels(paintMesh);
          paintMesh.visible = false;
          paintMesh.parent?.add(splitGroup);
        });

        scene.add(car);
        setIsLoading(false);
        updateMaterialsRef.current?.();
      },
      (xhr) => {
        if (xhr.total > 0) setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
      },
      (err) => {
        console.error('Error loading GLB:', err);
        setLoadError('No se pudo cargar el archivo GLB.');
        setIsLoading(false);
      }
    );

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = isRotatingRef.current;
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
  }, [vehicleModelPath, splitGLTFCarPaintIntoPanels]);

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
  const setCameraAngle = useCallback((view: 'iso' | 'front' | 'side' | 'rear' | 'top') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    setActiveCameraAngle(view);

    switch (view) {
      case 'iso':
        camera.position.set(3.9, 1.9, 3.9);
        controls.target.set(0, 0.62, 0);
        break;
      case 'front':
        camera.position.set(0, 0.95, 4.1);
        controls.target.set(0, 0.62, 0.2);
        break;
      case 'side':
        camera.position.set(4.2, 0.85, 0);
        controls.target.set(0, 0.62, 0);
        break;
      case 'rear':
        camera.position.set(0, 0.95, -4.1);
        controls.target.set(0, 0.62, -0.2);
        break;
      case 'top':
        camera.position.set(0, 4.6, 0.01);
        controls.target.set(0, 0.62, 0);
        break;
    }
    controls.update();
  }, []);

  // Listen for interactive Demo Tour camera/rotation commands
  useEffect(() => {
    const handleDemoAction = (e: Event) => {
      const detail = (e as CustomEvent<{ type: string; cameraAngle?: 'iso' | 'front' | 'side' | 'rear' | 'top'; rotate?: boolean }>).detail;
      if (!detail) return;
      if (detail.type === 'SHOWROOM_CAMERA' && detail.cameraAngle) {
        setCameraAngle(detail.cameraAngle);
      } else if (detail.type === 'SHOWROOM_ROTATE' && typeof detail.rotate === 'boolean') {
        setIsRotating(detail.rotate);
      }
    };
    window.addEventListener('armorcut:demo-action', handleDemoAction);
    return () => window.removeEventListener('armorcut:demo-action', handleDemoAction);
  }, [setCameraAngle]);

  const hoveredMeta = hoveredPanelId ? STANDARD_PANELS.find((p) => p.id === hoveredPanelId) : null;

  return (
    <div className="showroom-viewport">
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
          aria-live="polite"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(9, 10, 13, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '2px solid rgba(255, 255, 255, 0.12)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            Cargando modelo 3D · {loadProgress}%
          </div>
        </div>
      )}

      {/* Load Error Overlay */}
      {loadError && !isLoading && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(9, 10, 13, 0.94)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '24px',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
            {loadError}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Verifica la disponibilidad del modelo GLB o cambia al Plano 2D.
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
        {/* Left: Camera Angles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: 'rgba(14, 16, 20, 0.88)',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid var(--border-card)',
              backdropFilter: 'blur(6px)',
            }}
          >
            {(['iso', 'front', 'side', 'rear', 'top'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCameraAngle(view)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: activeCameraAngle === view ? 600 : 500,
                  color: activeCameraAngle === view ? '#ffffff' : 'var(--text-secondary)',
                  background: activeCameraAngle === view ? 'var(--bg-card-hover)' : 'transparent',
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
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: 'rgba(14, 16, 20, 0.88)',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid var(--border-card)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <button
              type="button"
              onClick={() => setPpfFinish('GLOSS')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: ppfFinish === 'GLOSS' ? 600 : 500,
                color: ppfFinish === 'GLOSS' ? '#ffffff' : 'var(--text-secondary)',
                background: ppfFinish === 'GLOSS' ? 'var(--bg-card-hover)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Gloss
            </button>
            <button
              type="button"
              onClick={() => setPpfFinish('MATTE')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: ppfFinish === 'MATTE' ? 600 : 500,
                color: ppfFinish === 'MATTE' ? '#ffffff' : 'var(--text-secondary)',
                background: ppfFinish === 'MATTE' ? 'var(--bg-card-hover)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Matte
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: isRotating ? '#ffffff' : 'var(--text-secondary)',
              background: isRotating ? 'var(--bg-card-hover)' : 'rgba(14, 16, 20, 0.88)',
              border: `1px solid ${isRotating ? 'var(--text-secondary)' : 'var(--border-card)'}`,
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
            }}
          >
            <RotateCw style={{ width: 12, height: 12 }} />
            <span>{isRotating ? 'Pausar' : 'Rotar'}</span>
          </button>
        </div>
      </div>

      {/* Minimalist Architectural Hover HUD */}
      {hoveredMeta && (
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: 14,
            background: 'rgba(14, 16, 20, 0.94)',
            border: '1px solid var(--border-highlight)',
            borderRadius: '6px',
            padding: '12px 16px',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '240px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
              {hoveredMeta.spanishName || hoveredMeta.name}
            </span>
            <span
              className="mono"
              style={{
                fontSize: '0.62rem',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: '3px',
                background: selectedPanelIds.includes(hoveredMeta.id)
                  ? 'var(--accent-red)'
                  : 'var(--bg-card)',
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              {selectedPanelIds.includes(hoveredMeta.id) ? 'Seleccionado' : 'Disponible'}
            </span>
          </div>

          <div
            className="mono"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '6px',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>{hoveredMeta.cutWidth} × {hoveredMeta.cutLength}m</span>
            <span>·</span>
            <span>{hoveredMeta.sqMeters} m²</span>
            <span>·</span>
            <span>{hoveredMeta.laborHours}h</span>
          </div>
        </div>
      )}

      {/* Subtle Bottom Controls Hint */}
      <div
        className="mono"
        style={{
          position: 'absolute',
          bottom: 12,
          left: 14,
          fontSize: '0.62rem',
          color: 'rgba(255, 255, 255, 0.28)',
          pointerEvents: 'none',
          letterSpacing: '0.04em',
        }}
      >
        CLICK PARA SELECCIONAR PIEZA · ARRASTRAR PARA ROTAR · SCROLL PARA ZOOM
      </div>
    </div>
  );
};
