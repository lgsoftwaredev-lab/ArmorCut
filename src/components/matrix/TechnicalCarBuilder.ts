import * as THREE from 'three';

/**
 * Creates smooth automotive sheet metal panel geometry from a 2D control point grid.
 * Normalizes surface normals and builds solid perimeter stamped closure walls.
 */
function createCurvedPanelGeometry(
  grid: number[][][],
  thickness = 0.012,
  inwardDir: 1 | -1 = 1
): THREE.BufferGeometry {
  const rows = grid.length;
  const cols = grid[0].length;
  const numVerticesPerSide = rows * cols;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // 1. Calculate vertex normals across the grid
  const normalsGrid: THREE.Vector3[][] = [];
  for (let r = 0; r < rows; r++) {
    normalsGrid[r] = [];
    for (let c = 0; c < cols; c++) {
      const p = new THREE.Vector3(...grid[r][c]);
      const pRight = c < cols - 1 ? new THREE.Vector3(...grid[r][c + 1]) : p;
      const pLeft = c > 0 ? new THREE.Vector3(...grid[r][c - 1]) : p;
      const pDown = r < rows - 1 ? new THREE.Vector3(...grid[r + 1][c]) : p;
      const pUp = r > 0 ? new THREE.Vector3(...grid[r - 1][c]) : p;

      const tangentU = new THREE.Vector3().subVectors(pRight, pLeft);
      const tangentV = new THREE.Vector3().subVectors(pDown, pUp);
      const normal = new THREE.Vector3().crossVectors(tangentU, tangentV).normalize();
      if (normal.lengthSq() < 0.001) normal.set(0, 1, 0);
      normal.multiplyScalar(inwardDir);
      normalsGrid[r][c] = normal;
    }
  }

  // 2. Outer Surface Vertices
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, y, z] = grid[r][c];
      positions.push(x, y, z);
      uvs.push(c / (cols - 1), r / (rows - 1));
    }
  }

  // 3. Inner Surface Vertices (extruded inward by thickness)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, y, z] = grid[r][c];
      const n = normalsGrid[r][c];
      positions.push(x - n.x * thickness, y - n.y * thickness, z - n.z * thickness);
      uvs.push(c / (cols - 1), r / (rows - 1));
    }
  }

  // 4. Outer Triangles
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const v0 = r * cols + c;
      const v1 = r * cols + (c + 1);
      const v2 = (r + 1) * cols + (c + 1);
      const v3 = (r + 1) * cols + c;
      indices.push(v0, v1, v2);
      indices.push(v0, v2, v3);
    }
  }

  // 5. Inner Triangles (flipped winding)
  const offset = numVerticesPerSide;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const v0 = offset + r * cols + c;
      const v1 = offset + r * cols + (c + 1);
      const v2 = offset + (r + 1) * cols + (c + 1);
      const v3 = offset + (r + 1) * cols + c;
      indices.push(v0, v2, v1);
      indices.push(v0, v3, v2);
    }
  }

  // 6. Perimeter Closing Edge Walls (Flange/Shutline edges)
  for (let c = 0; c < cols - 1; c++) {
    const o0 = c;
    const o1 = c + 1;
    const i0 = offset + c;
    const i1 = offset + c + 1;
    indices.push(o0, i1, o1);
    indices.push(o0, i0, i1);
  }
  for (let c = 0; c < cols - 1; c++) {
    const o0 = (rows - 1) * cols + c;
    const o1 = (rows - 1) * cols + c + 1;
    const i0 = offset + (rows - 1) * cols + c;
    const i1 = offset + (rows - 1) * cols + c + 1;
    indices.push(o0, o1, i1);
    indices.push(o0, i1, i0);
  }
  for (let r = 0; r < rows - 1; r++) {
    const o0 = r * cols;
    const o1 = (r + 1) * cols;
    const i0 = offset + r * cols;
    const i1 = offset + (r + 1) * cols;
    indices.push(o0, o1, i1);
    indices.push(o0, i1, i0);
  }
  for (let r = 0; r < rows - 1; r++) {
    const o0 = r * cols + (cols - 1);
    const o1 = (r + 1) * cols + (cols - 1);
    const i0 = offset + r * cols + (cols - 1);
    const i1 = offset + (r + 1) * cols + (cols - 1);
    indices.push(o0, i1, o1);
    indices.push(o0, i0, i1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Creates mirrored geometry along the X=0 plane with properly reversed winding and normals.
 */
function createMirroredGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const mirrored = geo.clone();
  const posAttr = mirrored.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setX(i, -posAttr.getX(i));
  }
  posAttr.needsUpdate = true;

  const index = mirrored.getIndex();
  if (index) {
    const arr = index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const temp = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = temp;
    }
    index.needsUpdate = true;
  }
  mirrored.computeVertexNormals();
  return mirrored;
}

export interface PanelRegistration {
  panelId: string;
  mesh: THREE.Mesh;
  edgeLine?: THREE.LineSegments;
}

/**
 * Builds a 100% discrete, mathematically bounded technical CAD vehicle model.
 * All sheet metal panels have exact, shared shutlines and clean borders.
 * Sits flush on turntable floor (y=0).
 */
export function buildTechnicalCADVehicle(
  registerPanel: (registration: PanelRegistration) => void
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TechnicalCADVehicle';

  // Base materials for technical CAD showroom
  const cadMetalMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Neutral technical titanium slate
    roughness: 0.36,
    metalness: 0.28,
  });

  const edgeLineMat = new THREE.LineBasicMaterial({
    color: 0x090d16, // Clean dark graphite shutline border
    linewidth: 1.5,
  });

  const glossBlackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x0a0e17,
    roughness: 0.18,
    metalness: 0.70,
  });

  const tintedGlassMat = new THREE.MeshStandardMaterial({
    color: 0x05070a,
    roughness: 0.05,
    metalness: 0.90,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.08,
    metalness: 0.95,
  });

  const gtiRedMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.25,
    metalness: 0.40,
  });

  // Reference Wheel & Axle Geometry:
  // Wheels sit on floor y=0: wheelCenterY = 0.32, wheelRadius = 0.32
  const frontAxleZ = 1.20;
  const rearAxleZ = -1.25;
  const wheelRadius = 0.32;
  const wheelCenterY = 0.32;
  const wheelArchRadius = 0.37;

  // Helper to attach perimeter shutline contour and register panel
  const registerMeshWithEdges = (panelId: string, mesh: THREE.Mesh): THREE.Mesh => {
    mesh.name = `panel_${panelId}`;
    mesh.userData = { panelId, isPanel: true };
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Use threshold of 45° so internal smooth curve quads do NOT generate diagonal wireframe lines
    // Only true sharp perimeter edges and panel boundaries generate crisp shutlines
    const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 45);
    const edges = new THREE.LineSegments(edgesGeo, edgeLineMat.clone());
    edges.name = `edge_${panelId}`;
    mesh.add(edges);

    group.add(mesh);
    registerPanel({ panelId, mesh, edgeLine: edges });
    return mesh;
  };

  const addPanelGeo = (panelId: string, geo: THREE.BufferGeometry, mat = cadMetalMat.clone()): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, mat);
    return registerMeshWithEdges(panelId, mesh);
  };

  // =========================================================================
  // 1. CAPOT / HOOD ('hood')
  // Starts at cowl (z=0.48, y=0.96) down to front nose (z=1.70, y=0.72).
  // Bounded laterally by front fender shutlines (x = ±0.56 down to ±0.46).
  // =========================================================================
  const hoodZSteps = [0.48, 0.85, 1.20, 1.50, 1.70];
  const hoodGrid: number[][][] = [];

  for (let ri = 0; ri < hoodZSteps.length; ri++) {
    const z = hoodZSteps[ri];
    const t = ri / (hoodZSteps.length - 1);
    const baseY = 0.96 * (1 - t) + 0.72 * t;
    const halfW = 0.56 * (1 - t) + 0.46 * t;

    const row: number[][] = [];
    const cols = 7;
    for (let ci = 0; ci < cols; ci++) {
      const u = (ci / (cols - 1)) * 2 - 1; // -1 to +1
      const x = u * halfW;
      const crown = Math.cos((u * Math.PI) / 2) * 0.026;
      // Dual crisp swage creases on Golf GTI bonnet
      const swage = Math.abs(u) > 0.40 && Math.abs(u) < 0.70 ? 0.012 : 0.0;
      row.push([x, baseY + crown + swage, z]);
    }
    hoodGrid.push(row);
  }
  addPanelGeo('hood', createCurvedPanelGeometry(hoodGrid, 0.014, -1));

  // =========================================================================
  // 2. PARAGOLPES DELANTERO ('bumper_front')
  // Front fascia meeting the hood nose (z=1.70, y=0.72) with matching parabolic crown!
  // Wraps forward around front beam (z=1.84, y=0.58) down to lower apron (z=1.76, y=0.26).
  // =========================================================================
  const bumperZProfiles = [
    { y: 0.72, zBase: 1.70, zPush: 0.00, halfW: 0.74, crown: 0.026 }, // Top shutline meets hood nose!
    { y: 0.62, zBase: 1.74, zPush: 0.08, halfW: 0.76, crown: 0.015 }, // Upper grille level
    { y: 0.54, zBase: 1.76, zPush: 0.12, halfW: 0.77, crown: 0.008 }, // Front impact beam / nose peak
    { y: 0.42, zBase: 1.72, zPush: 0.10, halfW: 0.77, crown: 0.000 }, // Central air intake
    { y: 0.32, zBase: 1.70, zPush: 0.06, halfW: 0.76, crown: 0.000 }, // Fog light level
    { y: 0.26, zBase: 1.68, zPush: 0.02, halfW: 0.75, crown: 0.000 }, // Lower apron / bottom lip
  ];
  const bumperGrid: number[][][] = [];
  for (const prof of bumperZProfiles) {
    const row: number[][] = [];
    const cols = 7;
    for (let ci = 0; ci < cols; ci++) {
      const u = (ci / (cols - 1)) * 2 - 1;
      const x = u * prof.halfW;
      const forwardCurve = (1 - u * u) * prof.zPush;
      const z = prof.zBase + forwardCurve;
      const y = prof.y + Math.cos((u * Math.PI) / 2) * prof.crown;
      row.push([x, y, z]);
    }
    bumperGrid.push(row);
  }
  addPanelGeo('bumper_front', createCurvedPanelGeometry(bumperGrid, 0.016, 1));

  // =========================================================================
  // 3. FRONT SPLITTER & LIP ('front_splitter')
  // =========================================================================
  const splitterGeo = new THREE.BoxGeometry(1.58, 0.025, 0.30);
  const splitterMesh = new THREE.Mesh(splitterGeo, glossBlackTrimMat.clone());
  splitterMesh.position.set(0, 0.24, 1.82);
  registerMeshWithEdges('front_splitter', splitterMesh);

  // =========================================================================
  // 4. GUARDABARROS DELANTERO IZQUIERDO ('fender_left')
  // Meets hood along top shutline (x = -0.56..-0.46, y = 0.96..0.72).
  // Features smooth circular wheel arch around front axle (z=1.20) with 8 Z steps!
  // Meets front door at z=0.48 from beltline y=0.94 down to rocker y=0.26.
  // =========================================================================
  const fenderZPoints = [0.48, 0.75, 0.92, 1.06, 1.20, 1.34, 1.48, 1.62, 1.70];
  const fenderLGrid: number[][][] = [];

  for (let ri = 0; ri < fenderZPoints.length; ri++) {
    const z = fenderZPoints[ri];
    const t = ri / (fenderZPoints.length - 1);
    const topY = 0.96 * (1 - t) + 0.72 * t;
    const topX = -(0.56 * (1 - t) + 0.46 * t);

    const distToAxle = Math.abs(z - frontAxleZ);
    let archY = 0.26;
    if (distToAxle < wheelArchRadius) {
      const archH = Math.sqrt(wheelArchRadius * wheelArchRadius - distToAxle * distToAxle);
      archY = wheelCenterY + archH;
    }

    const flareX = -0.78;
    fenderLGrid.push([
      [topX, topY, z],
      [topX - 0.06, topY - 0.06, z],
      [flareX, topY - 0.20, z],
      [flareX, archY, z],
    ]);
  }
  const fenderLGeo = createCurvedPanelGeometry(fenderLGrid, 0.014, 1);
  addPanelGeo('fender_left', fenderLGeo);

  // =========================================================================
  // 5. GUARDABARROS DELANTERO DERECHO ('fender_right')
  // =========================================================================
  addPanelGeo('fender_right', createMirroredGeometry(fenderLGeo));

  // =========================================================================
  // 6. PUERTA DELANTERA IZQUIERDA ('door_front_left')
  // Bounded by front fender (z=0.48), B-pillar (z=-0.35), beltline (y=0.94), rocker (y=0.26).
  // Athletic hot-hatch proportions: 68cm stamped sheet metal body height!
  // =========================================================================
  const doorFrontZ = [0.47, 0.20, -0.08, -0.34];
  const doorFrontLGrid: number[][][] = [];
  for (const z of doorFrontZ) {
    const flareX = -0.78;
    doorFrontLGrid.push([
      [-0.74, 0.94, z],
      [flareX, 0.78, z],
      [flareX, 0.52, z],
      [-0.76, 0.26, z],
    ]);
  }
  const doorFrontLGeo = createCurvedPanelGeometry(doorFrontLGrid, 0.014, 1);
  addPanelGeo('door_front_left', doorFrontLGeo);

  // =========================================================================
  // 7. PUERTA DELANTERA DERECHA ('door_front_right')
  // =========================================================================
  addPanelGeo('door_front_right', createMirroredGeometry(doorFrontLGeo));

  // =========================================================================
  // 8. PUERTA TRASERA IZQUIERDA ('door_rear_left')
  // Bounded by front door (z=-0.36), rear quarter (z=-1.14), beltline (y=0.94), rocker (y=0.26).
  // =========================================================================
  const doorRearZ = [-0.36, -0.62, -0.88, -1.13];
  const doorRearLGrid: number[][][] = [];
  for (const z of doorRearZ) {
    const flareX = -0.79;
    doorRearLGrid.push([
      [-0.74, 0.94, z],
      [flareX, 0.78, z],
      [flareX, 0.52, z],
      [-0.76, 0.26, z],
    ]);
  }
  const doorRearLGeo = createCurvedPanelGeometry(doorRearLGrid, 0.014, 1);
  addPanelGeo('door_rear_left', doorRearLGeo);

  // =========================================================================
  // 9. PUERTA TRASERA DERECHA ('door_rear_right')
  // =========================================================================
  addPanelGeo('door_rear_right', createMirroredGeometry(doorRearLGeo));

  // =========================================================================
  // 10. COPAS DE MANIJA ('door_cups')
  // =========================================================================
  const cupGeo = new THREE.BoxGeometry(0.10, 0.04, 0.02);
  const cupLF = new THREE.Mesh(cupGeo, cadMetalMat.clone());
  cupLF.position.set(-0.795, 0.86, 0.05);
  const cupRF = new THREE.Mesh(cupGeo, cadMetalMat.clone());
  cupRF.position.set(0.795, 0.86, 0.05);
  const cupLR = new THREE.Mesh(cupGeo, cadMetalMat.clone());
  cupLR.position.set(-0.805, 0.86, -0.75);
  const cupRR = new THREE.Mesh(cupGeo, cadMetalMat.clone());
  cupRR.position.set(0.805, 0.86, -0.75);
  registerMeshWithEdges('door_cups', cupLF);
  registerMeshWithEdges('door_cups', cupRF);
  registerMeshWithEdges('door_cups', cupLR);
  registerMeshWithEdges('door_cups', cupRR);

  // =========================================================================
  // 11. ZÓCALOS / TALONERAS LATERALES ('rocker_panels')
  // =========================================================================
  const rockerGeo = new THREE.BoxGeometry(0.06, 0.08, 1.70);
  const rockerL = new THREE.Mesh(rockerGeo, glossBlackTrimMat.clone());
  rockerL.position.set(-0.77, 0.22, -0.33);
  const rockerR = new THREE.Mesh(rockerGeo, glossBlackTrimMat.clone());
  rockerR.position.set(0.77, 0.22, -0.33);
  registerMeshWithEdges('rocker_panels', rockerL);
  registerMeshWithEdges('rocker_panels', rockerR);

  // =========================================================================
  // 12. LATERAL / CADERA TRASERA IZQUIERDA ('quarter_left')
  // Meets rear door at z=-1.14, circular wheel arch around rear axle (z=-1.25),
  // sweeps up into iconic forward-slanted Golf C-pillar, meets rear bumper at z=-1.74.
  // =========================================================================
  const quarterZ = [-1.14, -1.22, -1.32, -1.45, -1.58, -1.68, -1.74];
  const quarterLGrid: number[][][] = [];
  for (let ri = 0; ri < quarterZ.length; ri++) {
    const z = quarterZ[ri];
    const distToAxle = Math.abs(z - rearAxleZ);
    let archY = 0.26;
    if (distToAxle < wheelArchRadius) {
      const archH = Math.sqrt(wheelArchRadius * wheelArchRadius - distToAxle * distToAxle);
      archY = wheelCenterY + archH;
    }
    const flareX = -0.80;
    quarterLGrid.push([
      [-0.74, 0.94, z],
      [flareX, 0.80, z],
      [flareX, 0.54, z],
      [flareX + 0.03, archY, z],
    ]);
  }
  const quarterLGeo = createCurvedPanelGeometry(quarterLGrid, 0.014, 1);
  addPanelGeo('quarter_left', quarterLGeo);

  // =========================================================================
  // 13. LATERAL / CADERA TRASERA DERECHA ('quarter_right')
  // =========================================================================
  addPanelGeo('quarter_right', createMirroredGeometry(quarterLGeo));

  // =========================================================================
  // 14. TECHO ('roof')
  // Spans from windshield header (z=0.10, y=1.40) to tailgate header (z=-1.36, y=1.38).
  // Width: -0.52 to +0.52.
  // =========================================================================
  const roofZSteps = [0.10, -0.25, -0.62, -1.00, -1.36];
  const roofGrid: number[][][] = [];
  for (let ri = 0; ri < roofZSteps.length; ri++) {
    const z = roofZSteps[ri];
    const row: number[][] = [];
    const cols = 5;
    for (let ci = 0; ci < cols; ci++) {
      const u = (ci / (cols - 1)) * 2 - 1;
      const halfW = 0.52;
      const x = u * halfW;
      const crown = Math.cos((u * Math.PI) / 2) * 0.032;
      const y = 1.40 - ri * 0.005 + crown;
      row.push([x, y, z]);
    }
    roofGrid.push(row);
  }
  addPanelGeo('roof', createCurvedPanelGeometry(roofGrid, 0.016, -1));

  // =========================================================================
  // 15. PILARES A & PARANTES CENTRALES ('pillars_a_b')
  // =========================================================================
  const createPillar = (start: THREE.Vector3, end: THREE.Vector3, width: number, mat: THREE.Material) => {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const pillarGeo = new THREE.BoxGeometry(width, width * 0.7, len);
    const pillar = new THREE.Mesh(pillarGeo, mat);
    pillar.position.copy(start).addScaledVector(dir, 0.5);
    pillar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
    return pillar;
  };

  const pillarAL = createPillar(
    new THREE.Vector3(-0.74, 0.94, 0.48),
    new THREE.Vector3(-0.52, 1.40, 0.10),
    0.055,
    cadMetalMat.clone()
  );
  const pillarAR = createPillar(
    new THREE.Vector3(0.74, 0.94, 0.48),
    new THREE.Vector3(0.52, 1.40, 0.10),
    0.055,
    cadMetalMat.clone()
  );
  const pillarBL = createPillar(
    new THREE.Vector3(-0.74, 0.94, -0.35),
    new THREE.Vector3(-0.52, 1.40, -0.35),
    0.065,
    glossBlackTrimMat.clone()
  );
  const pillarBR = createPillar(
    new THREE.Vector3(0.74, 0.94, -0.35),
    new THREE.Vector3(0.52, 1.40, -0.35),
    0.065,
    glossBlackTrimMat.clone()
  );
  registerMeshWithEdges('pillars_a_b', pillarAL);
  registerMeshWithEdges('pillars_a_b', pillarAR);
  registerMeshWithEdges('pillars_a_b', pillarBL);
  registerMeshWithEdges('pillars_a_b', pillarBR);

  // Golf C-Pillars (Chassis body structure)
  const cPillarL = createPillar(
    new THREE.Vector3(-0.74, 0.94, -1.14),
    new THREE.Vector3(-0.52, 1.38, -1.36),
    0.16,
    cadMetalMat.clone()
  );
  const cPillarR = createPillar(
    new THREE.Vector3(0.74, 0.94, -1.14),
    new THREE.Vector3(0.52, 1.38, -1.36),
    0.16,
    cadMetalMat.clone()
  );
  group.add(cPillarL, cPillarR);

  // =========================================================================
  // 16. PORTÓN TRASERO / BAÚL ('trunk')
  // From roof header (z=-1.36, y=1.38) down to rear bumper shutline (z=-1.78, y=0.52).
  // =========================================================================
  const trunkZSteps = [
    { z: -1.36, y: 1.36 },
    { z: -1.54, y: 1.10 },
    { z: -1.70, y: 0.82 },
    { z: -1.78, y: 0.52 },
  ];
  const trunkGrid: number[][][] = [];
  for (const step of trunkZSteps) {
    const row: number[][] = [];
    const cols = 5;
    for (let ci = 0; ci < cols; ci++) {
      const u = (ci / (cols - 1)) * 2 - 1;
      const halfW = 0.52;
      const x = u * halfW;
      const crown = Math.cos((u * Math.PI) / 2) * 0.018;
      row.push([x, step.y + crown, step.z]);
    }
    trunkGrid.push(row);
  }
  addPanelGeo('trunk', createCurvedPanelGeometry(trunkGrid, 0.014, 1));

  // =========================================================================
  // 17. ALERÓN TRASERO ('rear_spoiler')
  // Clubsport rear aerodynamic wing mounted atop tailgate
  // =========================================================================
  const spoilerGeo = new THREE.BoxGeometry(1.06, 0.030, 0.28);
  const spoilerMesh = new THREE.Mesh(spoilerGeo, glossBlackTrimMat.clone());
  spoilerMesh.position.set(0, 1.42, -1.45);
  registerMeshWithEdges('rear_spoiler', spoilerMesh);

  // Endplates
  const finL = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.07, 0.26), glossBlackTrimMat);
  const finR = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.07, 0.26), glossBlackTrimMat);
  finL.position.set(-0.53, 1.40, -1.45);
  finR.position.set(0.53, 1.40, -1.45);
  group.add(finL, finR);

  // =========================================================================
  // 18. PARAGOLPES TRASERO ('bumper_rear')
  // Curves around rear under trunk & taillights from y=0.52 down to y=0.26.
  // =========================================================================
  const rearBumperZProfiles = [
    { y: 0.52, z: -1.78 },
    { y: 0.42, z: -1.86 },
    { y: 0.34, z: -1.84 },
    { y: 0.26, z: -1.80 },
  ];
  const rearBumperGrid: number[][][] = [];
  for (const prof of rearBumperZProfiles) {
    const row: number[][] = [];
    const cols = 5;
    for (let ci = 0; ci < cols; ci++) {
      const u = (ci / (cols - 1)) * 2 - 1;
      const halfW = 0.74;
      const x = u * halfW;
      const forwardCurve = (1 - u * u) * 0.05;
      row.push([x, prof.y, prof.z - forwardCurve]);
    }
    rearBumperGrid.push(row);
  }
  addPanelGeo('bumper_rear', createCurvedPanelGeometry(rearBumperGrid, 0.016, 1));

  // =========================================================================
  // 19. UMBRAL DE CARGA ('luggage_strip')
  // =========================================================================
  const stripGeo = new THREE.BoxGeometry(0.85, 0.012, 0.10);
  const stripMesh = new THREE.Mesh(stripGeo, glossBlackTrimMat.clone());
  stripMesh.position.set(0, 0.53, -1.78);
  registerMeshWithEdges('luggage_strip', stripMesh);

  // Rear Diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.28, 0.10, 0.20);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, glossBlackTrimMat.clone());
  diffuserMesh.position.set(0, 0.24, -1.81);
  group.add(diffuserMesh);

  // Twin Chrome Exhaust Tips
  const tipL = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.12, 16), chromeMat);
  const tipR = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.12, 16), chromeMat);
  tipL.rotation.x = Math.PI / 2;
  tipR.rotation.x = Math.PI / 2;
  tipL.position.set(-0.46, 0.24, -1.90);
  tipR.position.set(0.46, 0.24, -1.90);
  group.add(tipL, tipR);

  // =========================================================================
  // 20. FAROS DELANTEROS ('headlights')
  // Angular sculpted lenses flush in socket between hood, bumper, and fender
  // =========================================================================
  const createHeadlight = (isRight: boolean) => {
    const sign = isRight ? 1 : -1;
    const hlGroup = new THREE.Group();

    const lensGeo = new THREE.BoxGeometry(0.24, 0.12, 0.28);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.08,
      metalness: 0.85,
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    hlGroup.add(lens);

    // Red GTI horizontal accent line inside lens
    const gtiStripe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.010, 0.28), gtiRedMat);
    gtiStripe.position.set(0, -0.02, 0);
    hlGroup.add(gtiStripe);

    hlGroup.position.set(sign * 0.60, 0.72, 1.60);
    hlGroup.rotation.y = sign * -0.22;
    hlGroup.rotation.x = -0.04;

    registerMeshWithEdges('headlights', lens);
    group.add(hlGroup);
  };
  createHeadlight(false);
  createHeadlight(true);

  // =========================================================================
  // 21. ÓPTICAS TRASERAS ('taillights')
  // =========================================================================
  const createTaillight = (isRight: boolean) => {
    const sign = isRight ? 1 : -1;
    const tlGroup = new THREE.Group();
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.5,
      roughness: 0.12,
      metalness: 0.50,
    });
    const tlMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.11, 0.24), tlMat);
    tlGroup.add(tlMesh);
    tlGroup.position.set(sign * 0.62, 0.70, -1.68);
    tlGroup.rotation.y = sign * 0.20;

    registerMeshWithEdges('taillights', tlMesh);
    group.add(tlGroup);
  };
  createTaillight(false);
  createTaillight(true);

  // =========================================================================
  // 22. FAROS ANTINIEBLA ('fog_lights')
  // =========================================================================
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.016, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 0.9 })
      );
      fin.position.set(side * 0.64, 0.38 + i * 0.045, 1.74);
      fin.rotation.y = side * -0.25;
      registerMeshWithEdges('fog_lights', fin);
    }
  }

  // Grille Honeycomb & Central Red Bar
  const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.10, 0.08), glossBlackTrimMat);
  grilleMesh.position.set(0, 0.65, 1.74);
  group.add(grilleMesh);

  const redBar = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.014, 0.09), gtiRedMat);
  redBar.position.set(0, 0.65, 1.75);
  group.add(redBar);

  const vwLogo = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.020, 24), chromeMat);
  vwLogo.rotation.x = Math.PI / 2;
  vwLogo.position.set(0, 0.65, 1.77);
  group.add(vwLogo);

  // =========================================================================
  // 23. ESPEJOS RETROVISORES ('mirrors')
  // =========================================================================
  const mirrorGeo = new THREE.BoxGeometry(0.16, 0.09, 0.13);
  const mirrorL = new THREE.Mesh(mirrorGeo, glossBlackTrimMat.clone());
  const mirrorR = new THREE.Mesh(mirrorGeo, glossBlackTrimMat.clone());
  mirrorL.position.set(-0.82, 1.00, 0.38);
  mirrorR.position.set(0.82, 1.00, 0.38);
  registerMeshWithEdges('mirrors', mirrorL);
  registerMeshWithEdges('mirrors', mirrorR);

  // =========================================================================
  // 24. CABIN GLASS & WINDSHIELDS (Non-selectable solid greenhouse)
  // Flush with cowl (y=0.96) and roof header (y=1.40)
  // =========================================================================
  // Windshield
  const wsGeo = new THREE.BoxGeometry(1.04, 0.014, 0.62);
  const windshield = new THREE.Mesh(wsGeo, tintedGlassMat);
  windshield.rotation.x = 0.68;
  windshield.position.set(0, 1.18, 0.30);
  group.add(windshield);

  // Rear Window
  const rwGeo = new THREE.BoxGeometry(1.00, 0.014, 0.54);
  const rearWindow = new THREE.Mesh(rwGeo, tintedGlassMat);
  rearWindow.rotation.x = -0.82;
  rearWindow.position.set(0, 1.15, -1.48);
  group.add(rearWindow);

  // Side Glass
  const sideGlassGeo = new THREE.BoxGeometry(0.014, 0.42, 1.50);
  const glassL = new THREE.Mesh(sideGlassGeo, tintedGlassMat);
  const glassR = new THREE.Mesh(sideGlassGeo, tintedGlassMat);
  glassL.position.set(-0.65, 1.15, -0.48);
  glassR.position.set(0.65, 1.15, -0.48);
  group.add(glassL, glassR);

  // Dark Interior silhouette
  const interiorBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.50, 1.65),
    new THREE.MeshStandardMaterial({ color: 0x05070e, roughness: 0.95 })
  );
  interiorBox.position.set(0, 0.78, -0.48);
  group.add(interiorBox);

  // Wheel Well Liners (Sitting above floor)
  const wheelWellGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 20, 1, true, 0, Math.PI);
  wheelWellGeo.rotateZ(Math.PI / 2);
  const wheelWellMat = new THREE.MeshStandardMaterial({ color: 0x080b12, roughness: 0.95 });
  const wellFL = new THREE.Mesh(wheelWellGeo, wheelWellMat);
  wellFL.position.set(-0.70, wheelCenterY, frontAxleZ);
  const wellFR = new THREE.Mesh(wheelWellGeo, wheelWellMat);
  wellFR.position.set(0.70, wheelCenterY, frontAxleZ);
  const wellRL = new THREE.Mesh(wheelWellGeo, wheelWellMat);
  wellRL.position.set(-0.71, wheelCenterY, rearAxleZ);
  const wellRR = new THREE.Mesh(wheelWellGeo, wheelWellMat);
  wellRR.position.set(0.71, wheelCenterY, rearAxleZ);
  group.add(wellFL, wellFR, wellRL, wellRR);

  // =========================================================================
  // 25. WHEELS, RIMS, ROTORS & CALIPERS (Touching floor y=0)
  // =========================================================================
  const tireRubberMat = new THREE.MeshStandardMaterial({ color: 0x14171f, roughness: 0.88, metalness: 0.05 });
  const alloyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.88 });
  const brakeRotorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.90 });
  const brakeCaliperMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.30, metalness: 0.50 });

  const buildWheel = (xPos: number, zPos: number, isRight: boolean): THREE.Group => {
    const wheelGroup = new THREE.Group();

    // Tire
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.22, 28), tireRubberMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    // Rim Face
    const rimFace = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.78, wheelRadius * 0.78, 0.23, 24), alloyMat);
    rimFace.rotation.z = Math.PI / 2;
    wheelGroup.add(rimFace);

    // GTI 5-Spoke Pattern
    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.032, wheelRadius * 0.65, 0.048), chromeMat);
      spoke.position.set(
        isRight ? 0.11 : -0.11,
        Math.cos(angle) * (wheelRadius * 0.34),
        Math.sin(angle) * (wheelRadius * 0.34)
      );
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);
    }

    // Hub cap
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.24, 16), chromeMat);
    hub.rotation.z = Math.PI / 2;
    wheelGroup.add(hub);

    // Brake Rotor
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.62, wheelRadius * 0.62, 0.03, 20), brakeRotorMat);
    rotor.rotation.z = Math.PI / 2;
    rotor.position.x = isRight ? -0.04 : 0.04;
    wheelGroup.add(rotor);

    // Brake Caliper
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.08), brakeCaliperMat);
    caliper.position.set(isRight ? -0.04 : 0.04, wheelRadius * 0.32, 0);
    wheelGroup.add(caliper);

    wheelGroup.position.set(xPos, wheelCenterY, zPos);
    return wheelGroup;
  };

  const wheelTrack = 0.73;
  group.add(buildWheel(-wheelTrack, frontAxleZ, false)); // Front Left
  group.add(buildWheel(wheelTrack, frontAxleZ, true)); // Front Right
  group.add(buildWheel(-wheelTrack, rearAxleZ, false)); // Rear Left
  group.add(buildWheel(wheelTrack, rearAxleZ, true)); // Rear Right

  return group;
}
