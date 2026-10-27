export type PPFFinish = 
  | 'GLOSS'
  | 'MATTE'
  | 'SATIN'
  | 'BLACK_PIANO'
  | 'SMOKE_HEADLIGHT'
  | 'WINDSHIELD'
  | 'OTHER';

export type PPFRollStatus = 'ACTIVE' | 'SEALED' | 'DEPLETED';

export type ScrapReason = 
  | 'CUTTING_ERROR'
  | 'CONTAMINATION'
  | 'STRETCH_TEAR'
  | 'SILVERING_ADHESIVE'
  | 'INSTALLATION_ERROR'
  | 'DEFECTIVE_MATERIAL'
  | 'OTHER';

export interface PPFRoll {
  id: string;
  code: string;               // e.g. "XP-GL-01"
  brand: string;              // e.g. "XPEL", "STEK", "SunTek", "3M"
  model: string;              // e.g. "Ultimate Plus", "DYNOshield", "Reaction"
  finish: PPFFinish;
  widthMeters: number;        // e.g. 1.52 (60"), 0.91 (36"), 0.76 (30"), 0.61 (24")
  initialMeters: number;      // e.g. 15.0 or 30.0
  currentMeters: number;      // remaining meters
  costPerRoll: number;        // cost of entire roll in USD/ARS
  currency: string;           // "USD" | "ARS"
  batchNumber?: string;       // Lote de fábrica
  location: string;           // e.g. "Rack A - Pos 1"
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
  parts: string[];            // e.g. ["Capot Completo", "Paragolpes Frontal", "Espejos"]
  metersUsed: number;         // metros lineales aplicados al auto
  metersScrap: number;        // metros arruinados/desperdiciados
  scrapReason?: ScrapReason;
  scrapNotes?: string;
  jobDate: string;            // ISO date string
  costCalculated: number;     // calculated cost based on meters used + scrap
  notes?: string;
}

export interface PPFOffcut {
  id: string;
  parentRollId: string;
  parentRollCode: string;
  brand: string;
  finish: PPFFinish;
  widthCm: number;            // e.g. 45 cm
  lengthCm: number;           // e.g. 120 cm
  storageLocation: string;    // e.g. "Cajon Retazos 1"
  suggestedUse: string;       // e.g. "Espejos, B-Pillars, Tazas de Puerta, Pantalla"
  status: 'AVAILABLE' | 'USED' | 'DISCARDED';
  usedInJobId?: string;
  createdAt: string;
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
  offcuts: PPFOffcut[];
  settings: PPFShopSettings;
  version: string;
  lastUpdated: string;
}

export interface InstallerStat {
  name: string;
  jobsCount: number;
  metersUsed: number;
  metersScrap: number;
  wasteRatePercent: number;
  costWasted: number;
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
  totalMetersScrap: number;
  overallScrapRate: number;
  totalScrapCostWasted: number;
  installerStats: InstallerStat[];
  scrapReasonsMap: { [reason: string]: { count: number; meters: number } };
  availableOffcutsCount: number;
  usedOffcutsCount: number;
}

export type CreateRollInput = Omit<PPFRoll, 'id' | 'createdAt'>;
export type CreateJobInput = Omit<PPFJobConsumption, 'id' | 'costCalculated' | 'jobDate'>;
export type CreateOffcutInput = Omit<PPFOffcut, 'id' | 'createdAt'>;
export interface JobCreatedOffcutInput {
  widthCm: number;
  lengthCm: number;
  storageLocation: string;
  suggestedUse: string;
  notes?: string;
}
