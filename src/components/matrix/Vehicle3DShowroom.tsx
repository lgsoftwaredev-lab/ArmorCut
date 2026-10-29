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

      registrations.forEach(({ mesh, edgeLine }) => {
        if (!mesh.material) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (isSelected) {
          // PPF Protected Panel: High-contrast vibrant crimson shield with glossy clearcoat or stealth satin
          mat.color.setHex(ppfFinish === 'GLOSS' ? 0xe11d48 : 0xbe123c);
          mat.roughness = ppfFinish === 'GLOSS' ? 0.08 : 0.58;
          mat.metalness = ppfFinish === 'GLOSS' ? 0.35 : 0.15;
          mat.emissive.setHex(isHovered ? 0xf43f5e : 0x9f1239);
          mat.emissiveIntensity = isHovered ? 0.55 : 0.35;

          if (edgeLine && edgeLine.material) {
            (edgeLine.material as THREE.LineBasicMaterial).color.setHex(0xfecdd3); // Bright glowing edge
          }
        } else if (isHovered) {
          // Hovered Unselected Panel: Electric technical cyan highlight for instant feedback
          mat.color.setHex(0x0284c7);
          mat.roughness = 0.20;
          mat.metalness = 0.40;
          mat.emissive.setHex(0x0284c7);
          mat.emissiveIntensity = 0.45;

          if (edgeLine && edgeLine.material) {
            (edgeLine.material as THREE.LineBasicMaterial).color.setHex(0x38bdf8); // Glowing cyan border
          }
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

          if (edgeLine && edgeLine.material) {
            (edgeLine.material as THREE.LineBasicMaterial).color.setHex(0x090d16);
            (edgeLine.material as THREE.LineBasicMaterial).opacity = 0.35;
            edgeLine.visible = true;
          }
        }
      });
    });
  }, [selectedPanelIds, hoveredPanelId, ppfFinish]);

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

      // 3. Golf GTI MK7 / BMW M2 G87 (Longitudinal Z)
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
      // Front fenders
      if (cz >= 0.60 && cz <= 1.80 && cy >= 0.10 && minZ > 0.55) {
        return cx < 0 ? 'fender_left' : 'fender_right';
      }
      // Rear Quarters & side body frame
      if (minZ < -0.6) {
        return cx < 0 ? 'quarter_left' : 'quarter_right';
      }
      // Front Doors
      if (maxY < 0.98 && minZ >= -0.65 && maxZ <= 0.95) {
        return cx < 0 ? 'door_front_left' : 'door_front_right';
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

      // Clone authentic factory car paint material
      const sourceMat = paintMesh.material as THREE.MeshStandardMaterial;
      const panelMat = sourceMat ? sourceMat.clone() : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });

      const pMesh = new THREE.Mesh(pGeom, panelMat);
      pMesh.name = `panel_${panelId}`;
      pMesh.userData = {
        panelId,
        isPanel: true,
        originalMaterial: sourceMat,
        originalColor: sourceMat && sourceMat.color ? sourceMat.color.clone() : new THREE.Color(0xffffff),
        originalRoughness: sourceMat?.roughness ?? 0.15,
        originalMetalness: sourceMat?.metalness ?? 0.35,
      };
      pMesh.castShadow = true;
      pMesh.receiveShadow = true;

      // Crisp subtle shutline border outline
      const edgesGeo = new THREE.EdgesGeometry(pGeom, 25);
      const edges = new THREE.LineSegments(
        edgesGeo,
        new THREE.LineBasicMaterial({ color: 0x090d16, transparent: true, opacity: 0.45, linewidth: 1.2 })
      );
      edges.name = `edge_${panelId}`;
      edges.raycast = () => {}; // Avoid intercepting raycast directly
      pMesh.add(edges);

      panelGroup.add(pMesh);

      if (!panelRegistrationsRef.current.has(panelId)) {
        panelRegistrationsRef.current.set(panelId, []);
      }
      panelRegistrationsRef.current.get(panelId)!.push({ mesh: pMesh, edgeLine: edges });
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

          if (!mesh.getObjectByName(`edge_${panelId}`)) {
            const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 28);
            const edges = new THREE.LineSegments(
              edgesGeo,
              new THREE.LineBasicMaterial({ color: 0x090d16, transparent: true, opacity: 0.45, linewidth: 1.2 })
            );
            edges.name = `edge_${panelId}`;
            edges.raycast = () => {};
            mesh.add(edges);

            if (!panelRegistrationsRef.current.has(panelId)) {
              panelRegistrationsRef.current.set(panelId, []);
            }
            panelRegistrationsRef.current.get(panelId)!.push({ mesh, edgeLine: edges });
          }
        };

        car.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const name = (mesh.name || '').toLowerCase();

            // Discard any residual non-PPF internal details (engine, interior, mechanical, screws)
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
              name.includes('bolt')
            ) {
              mesh.visible = false;
              return;
            }

            // 1. BMW M2 F87 (bmw_m2.glb) Isolated Meshes
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

            // 2. Toyota SW4 Isolated Doors / Trunk / Roof
            if (name.includes('fl_door') && name.includes('carpaint')) { registerPanelMesh(mesh, 'door_front_left'); return; }
            if (name.includes('rf_door') && name.includes('carpaint')) { registerPanelMesh(mesh, 'door_front_right'); return; }
            if (name.includes('rl_door') && name.includes('carpaint')) { registerPanelMesh(mesh, 'door_rear_left'); return; }
            if (name.includes('rr_door') && name.includes('carpaint')) { registerPanelMesh(mesh, 'door_rear_right'); return; }
            if (name.includes('bootdoor') && name.includes('carpaint')) { registerPanelMesh(mesh, 'trunk'); return; }
            if (name.includes('roof') && name.includes('carpaint')) { registerPanelMesh(mesh, 'roof'); return; }
            if (name.includes('carpaint_dmtab')) { paintMeshesToSplit.push(mesh); return; }

            // 3. BMW M2 G87 (bmw_m2_g87.glb)
            if (name.includes('carbon1_geo_loda')) { registerPanelMesh(mesh, 'roof'); return; }
            if (name.includes('paint_geo_loda') || name.includes('paint_material')) { paintMeshesToSplit.push(mesh); return; }

            // 4. Golf GTI MK7 (golf_gti_mk7.glb) & Generic Paint Meshes
            if (name.includes('phong2') || (name.includes('carpaint') && !name.includes('phong3') && !name.includes('trim') && !name.includes('hinges'))) {
              paintMeshesToSplit.push(mesh);
              return;
            }

            // Headlights & Light Glass (Interactive PPF Protection)
            if (name.includes('lightglass') || name.includes('light_max')) {
              mesh.userData = { panelId: 'headlights', isPanel: true };
              if (!panelRegistrationsRef.current.has('headlights')) {
                panelRegistrationsRef.current.set('headlights', []);
              }
              panelRegistrationsRef.current.get('headlights')!.push({ mesh });
              return;
            }

            // Side Mirrors (Generic)
            if (name.includes('mirror') && !name.includes('in_mirror') && !name.includes('rearview') && !name.includes('glass')) {
              registerPanelMesh(mesh, 'mirrors');
              return;
            }

            // NOTE: All other meshes (wheels, tires, authentic glass, carbon fiber,
            // authentic emblems, interior, exhausts) RETAIN THEIR 100% ORIGINAL FACTORY MATERIALS!
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
        updateMaterials();
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
  }, [vehicleModelPath, splitGLTFCarPaintIntoPanels, updateMaterials]);

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
        {/* Left: Camera Angles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
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
                  padding: '4px 10px',
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
              PANEL DETECTADO
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
