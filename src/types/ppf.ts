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
