export type PPFFinish = 
  | 'GLOSS'
  | 'MATTE'
  | 'SATIN'
  | 'BLACK_PIANO'
  | 'SMOKE_HEADLIGHT'
  | 'WINDSHIELD'
  | 'OTHER';

export type PPFRollStatus = 'ACTIVE' | 'SEALED' | 'DEPLETED';

export interface PPFRoll {
  id: string;
  code: string;               // e.g. "KRYP-GL-01"
  brand: string;              // e.g. "Kryptonite", "XPEL", "STEK"
  model: string;              // e.g. "Ultra Gloss", "Matte Shield"
  finish: PPFFinish;
  widthMeters: number;        // e.g. 1.56, 1.20
  initialMeters: number;      // e.g. 15.0
  currentMeters: number;      // Metros restantes en stock
  costPerRoll: number;        // Costo del rollo completo
  currency: string;           // "USD" | "ARS"
  batchNumber?: string;       // Lote de fábrica
  location: string;           // e.g. "Rack A - Nivel 1"
  status: PPFRollStatus;
  createdAt: string;          // ISO date string
  notes?: string;
}

export interface PPFJobConsumption {
  id: string;
  rollId: string;
  rollCode: string;
  brand: string;
  model: string;
  finish: PPFFinish;
  vehicle: string;            // e.g. "Porsche 911 GT3"
  licensePlate?: string;      // e.g. "AF 123 CD"
  clientName: string;         // e.g. "Martín Gomez"
  workOrderNumber?: string;   // e.g. "OT-2026-089"
  installer: string;          // e.g. "Lucas"
  parts: string[];            // e.g. ["Capot Completo", "Paragolpes Frontal"]
  metersUsed: number;         // Metros lineales cortados y aplicados
  jobDate: string;            // ISO date string
  costCalculated: number;     // Costo calculado de los metros cortados
  notes?: string;
}

export interface PPFShopSettings {
  shopName: string;
  lowStockThresholdMeters: number; // default 3 meters
  currency: string;
}

export interface PPFDatabaseData {
  rolls: PPFRoll[];
  jobs: PPFJobConsumption[];
  settings: PPFShopSettings;
  version: string;
  lastUpdated: string;
}

export interface InstallerStat {
  name: string;
  jobsCount: number;
  metersUsed: number;
}

export interface PPFStats {
  totalRolls: number;
  activeRolls: number;
  sealedRolls: number;
  depletedRolls: number;
  totalStockMeters: number;
  lowStockRolls: PPFRoll[];
  estimatedInventoryValue: number;
  totalMetersUsed: number;
  totalJobsCount: number;
  installerStats: InstallerStat[];
}

export type CreateRollInput = Omit<PPFRoll, 'id' | 'createdAt'>;
export type CreateJobInput = Omit<PPFJobConsumption, 'id' | 'costCalculated' | 'jobDate'>;

/* ==============================================================================
   MÓDULO DE VEHÍCULOS, PANELES Y CORTE (PPF MATRIX & NESTING EXTENSIONS)
   ============================================================================== */

export type MaterialGrade = 'PREMIUM' | 'COMUN';

export interface MaterialOption {
  id: MaterialGrade;
  name: string;
  tagline: string;
  thickness: string;           // e.g. "8.5 mils"
  warrantyYears: number;
  costPerMeter: number;        // Costo del taller por metro lineal
  salePricePerMeter: number;   // Precio al cliente por metro lineal
  features: string[];
}

export type VehicleCategory = 
  | 'COUPE_SUPERCAR' 
  | 'SEDAN' 
  | 'SUV' 
  | 'PICKUP' 
  | 'HATCHBACK';

export interface VehicleProfile {
  id: string;                  // Slug único (ej: "golf_gti_mk7", "porsche_gt3")
  name: string;                // "Volkswagen Golf GTI Clubsport MK7"
  brand: string;               // "Volkswagen"
  year: number;                // 2016
  badge: string;               // "Hot Hatch Icon"
  category: VehicleCategory;
  lengthMeters: number;
  widthMeters: number;
  scaleFactor: number;         // Factor multiplicador sobre las cotas base (ej: 0.92)
  model3dPath?: string;        // Ruta al asset 3D .glb
  features: string[];          // Puntos clave de carrocería
}

export type PanelCategory = 
  | 'front' 
  | 'sides' 
  | 'rear' 
  | 'roof' 
  | 'micro_details' 
  | 'aero';

export type PanelDifficulty = 'BAJA' | 'MEDIA' | 'ALTA' | 'EXPERTO';

export interface VehiclePanel {
  id: string;                  // e.g. "hood", "bumper_front"
  name: string;                // e.g. "Capot"
  spanishName: string;         // e.g. "Capot Completo"
  category: PanelCategory;
  cutWidth: number;            // Ancho requerido sobre el rollo en metros (máx 1.52)
  cutLength: number;           // Metros lineales consumidos en rollo
  sqMeters: number;            // Superficie neta calculada en m²
  laborHours: number;          // Horas estimadas de instalación
  difficulty: PanelDifficulty;
  isMicroDetail?: boolean;
  wrappedMarginMm?: number;    // Sangría perimetral para meter debajo del panel (mm)
  applicableModels?: string[];
}

export interface PackagePreset {
  id: string;                  // e.g. "FULL_FRONTAL", "FULL_BODY"
  name: string;
  description: string;
  badge: string;
  recommendedPanelIds: string[];
  discountPercent?: number;
}

export interface NestingPlacement {
  panelId: string;
  panelName: string;
  x: number;                   // Posición X en el rollo de 1.52m (metros)
  y: number;                   // Posición Y a lo largo de la bobina (metros)
  width: number;
  length: number;
  rotated: boolean;
}

export interface NestingResult {
  totalLinearMeters: number;   // Metros lineales totales requeridos en la bobina
  wasteLinearMeters: number;   // Metros no aprovechados
  efficiencyPercent: number;   // Rendimiento de empaquetado (ej: 88%)
  placements: NestingPlacement[];
}
