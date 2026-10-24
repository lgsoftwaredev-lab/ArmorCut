import { PPFRoll, PPFJobConsumption, PPFOffcut, PPFShopSettings, ScrapReason } from '@/types/ppf';
import { supabase, isSupabaseConfigured } from './supabase';

// Mock initial data used when Supabase is not configured yet or as fallback
const INITIAL_ROLLS: PPFRoll[] = [
  {
    id: 'roll-1',
    code: 'XP-GL-01',
    brand: 'XPEL',
    model: 'Ultimate Plus 8mil',
    finish: 'GLOSS',
    widthMeters: 1.52,
    initialMeters: 15.0,
    currentMeters: 11.2,
    costPerRoll: 1350,
    currency: 'USD',
    batchNumber: 'LOT-98214',
    location: 'Rack A - Nivel 1',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    notes: 'Bobina principal para capots y paragolpes frontales',
  },
  {
    id: 'roll-2',
    code: 'ST-DY-02',
    brand: 'STEK',
    model: 'DYNOshield',
    finish: 'GLOSS',
    widthMeters: 1.52,
    initialMeters: 15.0,
    currentMeters: 4.3,
    costPerRoll: 1400,
    currency: 'USD',
    batchNumber: 'LOT-84311',
    location: 'Rack A - Nivel 2',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    notes: 'Excelente hidrofobia y brillo profundo',
  },
  {
    id: 'roll-3',
    code: 'XP-ST-03',
    brand: 'XPEL',
    model: 'Stealth Matte',
    finish: 'MATTE',
    widthMeters: 1.52,
    initialMeters: 15.0,
    currentMeters: 2.1,
    costPerRoll: 1550,
    currency: 'USD',
    batchNumber: 'LOT-77402',
    location: 'Rack B - Nivel 1',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    notes: 'ALERTA: Quedan pocos metros para trabajos grandes',
  },
  {
    id: 'roll-4',
    code: '3M-SC-04',
    brand: '3M',
    model: 'Scotchgard Pro 200',
    finish: 'GLOSS',
    widthMeters: 0.91,
    initialMeters: 30.0,
    currentMeters: 24.5,
    costPerRoll: 1200,
    currency: 'USD',
    batchNumber: 'LOT-3M-119',
    location: 'Rack B - Nivel 2',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    notes: 'Ancho especial para zócalos, ópticas y franjas',
  },
  {
    id: 'roll-5',
    code: 'ST-BK-05',
    brand: 'STEK',
    model: 'DYNOblack Piano',
    finish: 'BLACK_PIANO',
    widthMeters: 1.52,
    initialMeters: 15.0,
    currentMeters: 15.0,
    costPerRoll: 1600,
    currency: 'USD',
    batchNumber: 'LOT-BK-003',
    location: 'Depósito Sellados',
    status: 'SEALED',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    notes: 'Bobina nueva cerrada para techos y parantes',
  },
];

const INITIAL_JOBS: PPFJobConsumption[] = [
  {
    id: 'job-1',
    rollId: 'roll-1',
    rollCode: 'XP-GL-01',
    brand: 'XPEL',
    model: 'Ultimate Plus 8mil',
    finish: 'GLOSS',
    vehicle: 'Porsche 911 Carrera S',
    licensePlate: 'AF 281 OK',
    clientName: 'Alejandro Benitez',
    workOrderNumber: 'OT-2026-104',
    installer: 'Lucas',
    parts: ['Capot Completo', 'Paragolpes Frontal', 'Espejos'],
    metersUsed: 3.8,
    metersScrap: 0.0,
    costCalculated: 342.0,
    jobDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    notes: 'Instalación impecable sin merma',
  },
  {
    id: 'job-2',
    rollId: 'roll-2',
    rollCode: 'ST-DY-02',
    brand: 'STEK',
    model: 'DYNOshield',
    finish: 'GLOSS',
    vehicle: 'Audi RS3 Sportback',
    licensePlate: 'AE 754 PL',
    clientName: 'Nicolás Rossi',
    workOrderNumber: 'OT-2026-108',
    installer: 'Lucas',
    parts: ['Full Frontal', 'Ópticas', 'Zócalos'],
    metersUsed: 4.2,
    metersScrap: 0.5,
    scrapReason: 'CONTAMINATION',
    scrapNotes: 'Partícula de polvo en la esquina inferior del capot obligó a repetir pieza',
    costCalculated: 438.67,
    jobDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    notes: 'Desperdicio registrado y cargado a scrap',
  },
  {
    id: 'job-3',
    rollId: 'roll-3',
    rollCode: 'XP-ST-03',
    brand: 'XPEL',
    model: 'Stealth Matte',
    finish: 'MATTE',
    vehicle: 'BMW M2 Competition',
    licensePlate: 'AG 112 ZZ',
    clientName: 'Ignacio Falcon',
    workOrderNumber: 'OT-2026-115',
    installer: 'Marcos',
    parts: ['Capot Satinado', 'Guardabarros Delanteros'],
    metersUsed: 3.6,
    metersScrap: 0.4,
    scrapReason: 'STRETCH_TEAR',
    scrapNotes: 'Exceso de tensión en la curvatura del guardabarros generó línea de estrés',
    costCalculated: 413.33,
    jobDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    notes: 'Se capacitó sobre técnica de anclaje térmico',
  },
];

const INITIAL_OFFCUTS: PPFOffcut[] = [
  {
    id: 'offcut-1',
    parentRollId: 'roll-1',
    parentRollCode: 'XP-GL-01',
    brand: 'XPEL',
    finish: 'GLOSS',
    widthCm: 55,
    lengthCm: 110,
    storageLocation: 'Cajón 1 - Retazos Capot',
    suggestedUse: 'Espejos retrovisores o paragolpe inferior',
    status: 'AVAILABLE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    notes: 'Sobrante limpio del corte de Porsche 911',
  },
  {
    id: 'offcut-2',
    parentRollId: 'roll-2',
    parentRollCode: 'ST-DY-02',
    brand: 'STEK',
    finish: 'GLOSS',
    widthCm: 35,
    lengthCm: 80,
    storageLocation: 'Cajón 2 - Retazos Chicos',
    suggestedUse: 'Tazas de puertas, pantalla táctil, B-Pillars',
    status: 'AVAILABLE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    notes: 'Perfecto para interiores de Audi o BMW',
  },
  {
    id: 'offcut-3',
    parentRollId: 'roll-3',
    parentRollCode: 'XP-ST-03',
    brand: 'XPEL',
    finish: 'MATTE',
    widthCm: 40,
    lengthCm: 95,
    storageLocation: 'Cajón Matte',
    suggestedUse: 'Espejos satinados o detalles de alerón',
    status: 'AVAILABLE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    notes: 'Material intacto para piezas chicas',
  },
];

const DEFAULT_SETTINGS: PPFShopSettings = {
  shopName: process.env.NEXT_PUBLIC_SHOP_NAME || 'PLUSCARS DETAILING',
  lowStockThresholdMeters: 3.0,
  currency: 'USD',
};

// Local storage keys for fallback demo mode
const LOCAL_STORAGE_KEY_ROLLS = 'armorcut_ppf_rolls_v1';
const LOCAL_STORAGE_KEY_JOBS = 'armorcut_ppf_jobs_v1';
const LOCAL_STORAGE_KEY_OFFCUTS = 'armorcut_ppf_offcuts_v1';
const LOCAL_STORAGE_KEY_SETTINGS = 'armorcut_ppf_settings_v1';

export class StockService {
  // Load Rolls
  static async getRolls(): Promise<PPFRoll[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('ppf_rolls')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((r: any) => ({
            id: r.id,
            code: r.code,
            brand: r.brand,
            model: r.model,
            finish: r.finish,
            widthMeters: Number(r.width_meters),
            initialMeters: Number(r.initial_meters),
            currentMeters: Number(r.current_meters),
            costPerRoll: Number(r.cost_per_roll),
            currency: r.currency || 'USD',
            batchNumber: r.batch_number,
            location: r.location,
            status: r.status,
            createdAt: r.created_at,
            notes: r.notes,
          }));
        }
      } catch (err) {
        console.warn('Error reading from Supabase, falling back to local store:', err);
      }
    }

    // Local / Demo fallback
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_ROLLS);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLLS, JSON.stringify(INITIAL_ROLLS));
    }
    return INITIAL_ROLLS;
  }

  // Create Roll
  static async addRoll(roll: Omit<PPFRoll, 'id' | 'createdAt'>): Promise<PPFRoll> {
    const newRoll: PPFRoll = {
      ...roll,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `roll-${Date.now()}`,
      createdAt: new Date().toISOString(),
      currentMeters: Number(roll.currentMeters),
      initialMeters: Number(roll.initialMeters),
      costPerRoll: Number(roll.costPerRoll),
      widthMeters: Number(roll.widthMeters),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('ppf_rolls')
          .insert({
            code: newRoll.code,
            brand: newRoll.brand,
            model: newRoll.model,
            finish: newRoll.finish,
            width_meters: newRoll.widthMeters,
            initial_meters: newRoll.initialMeters,
            current_meters: newRoll.currentMeters,
            cost_per_roll: newRoll.costPerRoll,
            currency: newRoll.currency,
            batch_number: newRoll.batchNumber,
            location: newRoll.location,
            status: newRoll.status,
            notes: newRoll.notes,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            ...newRoll,
            id: data.id,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.error('Supabase addRoll failed:', err);
      }
    }

    // Local fallback
    if (typeof window !== 'undefined') {
      const existing = await this.getRolls();
      const updated = [newRoll, ...existing];
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLLS, JSON.stringify(updated));
    }
    return newRoll;
  }

  // Update Roll
  static async updateRoll(id: string, updates: Partial<PPFRoll>): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload: any = {};
        if (updates.code) payload.code = updates.code;
        if (updates.brand) payload.brand = updates.brand;
        if (updates.model) payload.model = updates.model;
        if (updates.finish) payload.finish = updates.finish;
        if (updates.widthMeters !== undefined) payload.width_meters = updates.widthMeters;
        if (updates.initialMeters !== undefined) payload.initial_meters = updates.initialMeters;
        if (updates.currentMeters !== undefined) payload.current_meters = updates.currentMeters;
        if (updates.costPerRoll !== undefined) payload.cost_per_roll = updates.costPerRoll;
        if (updates.batchNumber !== undefined) payload.batch_number = updates.batchNumber;
        if (updates.location) payload.location = updates.location;
        if (updates.status) payload.status = updates.status;
        if (updates.notes !== undefined) payload.notes = updates.notes;

        await supabase.from('ppf_rolls').update(payload).eq('id', id);
      } catch (err) {
        console.error('Supabase updateRoll failed:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const existing = await this.getRolls();
      const updated = existing.map((r) => (r.id === id ? { ...r, ...updates } : r));
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLLS, JSON.stringify(updated));
    }
  }

  // Delete Roll
  static async deleteRoll(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('ppf_rolls').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteRoll failed:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const existing = await this.getRolls();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLLS, JSON.stringify(updated));
    }
  }

  // Get Jobs
  static async getJobs(): Promise<PPFJobConsumption[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('ppf_jobs')
          .select('*')
          .order('job_date', { ascending: false });

        if (!error && data) {
          return data.map((j: any) => ({
            id: j.id,
            rollId: j.roll_id,
            rollCode: j.roll_code,
            brand: j.brand,
            model: j.model || '',
            finish: j.finish,
            vehicle: j.vehicle,
            licensePlate: j.license_plate,
            clientName: j.client_name,
            workOrderNumber: j.work_order_number,
            installer: j.installer,
            parts: Array.isArray(j.parts) ? j.parts : JSON.parse(j.parts || '[]'),
            metersUsed: Number(j.meters_used),
            metersScrap: Number(j.meters_scrap || 0),
            scrapReason: j.scrap_reason,
            scrapNotes: j.scrap_notes,
            costCalculated: Number(j.cost_calculated || 0),
            jobDate: j.job_date,
            notes: j.notes,
          }));
        }
      } catch (err) {
        console.warn('Error reading jobs from Supabase:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_JOBS);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_JOBS, JSON.stringify(INITIAL_JOBS));
    }
    return INITIAL_JOBS;
  }

  // Record a Job (automatically discounts meters and handles scrap & offcuts)
  static async recordJob(
    jobData: Omit<PPFJobConsumption, 'id' | 'costCalculated' | 'jobDate'>,
    createdOffcut?: {
      widthCm: number;
      lengthCm: number;
      storageLocation: string;
      suggestedUse: string;
      notes?: string;
    }
  ): Promise<{ job: PPFJobConsumption; updatedRoll: PPFRoll }> {
    const rolls = await this.getRolls();
    const roll = rolls.find((r) => r.id === jobData.rollId || r.code === jobData.rollCode);

    if (!roll) {
      throw new Error(`Bobina no encontrada: ${jobData.rollCode || jobData.rollId}`);
    }

    const totalMetersDeducted = Number(jobData.metersUsed) + Number(jobData.metersScrap || 0);
    const newCurrentMeters = Math.max(0, Number((roll.currentMeters - totalMetersDeducted).toFixed(2)));
    const newStatus = newCurrentMeters <= 0.05 ? 'DEPLETED' : roll.status;

    // Cost calculation based on cost per meter of the roll
    const costPerMeter = roll.initialMeters > 0 ? roll.costPerRoll / roll.initialMeters : 0;
    const totalCost = Number((costPerMeter * totalMetersDeducted).toFixed(2));

    const newJob: PPFJobConsumption = {
      ...jobData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `job-${Date.now()}`,
      jobDate: new Date().toISOString(),
      costCalculated: totalCost,
      metersUsed: Number(jobData.metersUsed),
      metersScrap: Number(jobData.metersScrap || 0),
    };

    const updatedRoll: PPFRoll = {
      ...roll,
      currentMeters: newCurrentMeters,
      status: newStatus,
    };

    // Update in Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Insert Job
        const { data: jobRes } = await supabase
          .from('ppf_jobs')
          .insert({
            roll_id: roll.id,
            roll_code: roll.code,
            brand: roll.brand,
            finish: roll.finish,
            vehicle: newJob.vehicle,
            license_plate: newJob.licensePlate,
            client_name: newJob.clientName,
            work_order_number: newJob.workOrderNumber,
            installer: newJob.installer,
            parts: newJob.parts,
            meters_used: newJob.metersUsed,
            meters_scrap: newJob.metersScrap,
            scrap_reason: newJob.scrapReason,
            scrap_notes: newJob.scrapNotes,
            cost_calculated: newJob.costCalculated,
            notes: newJob.notes,
          })
          .select()
          .single();

        if (jobRes) {
          newJob.id = jobRes.id;
        }

        // 2. Update Roll meters
        await supabase
          .from('ppf_rolls')
          .update({
            current_meters: newCurrentMeters,
            status: newStatus,
          })
          .eq('id', roll.id);

        // 3. Create Offcut if present
        if (createdOffcut && createdOffcut.widthCm > 0 && createdOffcut.lengthCm > 0) {
          await supabase.from('ppf_offcuts').insert({
            parent_roll_id: roll.id,
            parent_roll_code: roll.code,
            brand: roll.brand,
            finish: roll.finish,
            width_cm: createdOffcut.widthCm,
            length_cm: createdOffcut.lengthCm,
            storage_location: createdOffcut.storageLocation || 'Cajón de Retazos',
            suggested_use: createdOffcut.suggestedUse || 'Piezas chicas / Espejos',
            status: 'AVAILABLE',
            used_in_job_id: newJob.id,
            notes: createdOffcut.notes || `Retazo de trabajo en ${newJob.vehicle}`,
          });
        }
      } catch (err) {
        console.error('Supabase recordJob error:', err);
      }
    }

    // Local / Demo state update
    if (typeof window !== 'undefined') {
      const storedRolls = await this.getRolls();
      const updatedRolls = storedRolls.map((r) => (r.id === roll.id ? updatedRoll : r));
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLLS, JSON.stringify(updatedRolls));

      const storedJobs = await this.getJobs();
      localStorage.setItem(LOCAL_STORAGE_KEY_JOBS, JSON.stringify([newJob, ...storedJobs]));

      if (createdOffcut && createdOffcut.widthCm > 0 && createdOffcut.lengthCm > 0) {
        await this.addOffcut({
          parentRollId: roll.id,
          parentRollCode: roll.code,
          brand: roll.brand,
          finish: roll.finish,
          widthCm: createdOffcut.widthCm,
          lengthCm: createdOffcut.lengthCm,
          storageLocation: createdOffcut.storageLocation || 'Cajón de Retazos',
          suggestedUse: createdOffcut.suggestedUse || 'Espejos, manijas, ópticas',
          status: 'AVAILABLE',
          notes: createdOffcut.notes || `Retazo generado en trabajo ${newJob.vehicle}`,
        });
      }
    }

    return { job: newJob, updatedRoll };
  }

  // Get Offcuts
  static async getOffcuts(): Promise<PPFOffcut[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('ppf_offcuts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((o: any) => ({
            id: o.id,
            parentRollId: o.parent_roll_id,
            parentRollCode: o.parent_roll_code,
            brand: o.brand,
            finish: o.finish,
            widthCm: Number(o.width_cm),
            lengthCm: Number(o.length_cm),
            storageLocation: o.storage_location,
            suggestedUse: o.suggested_use,
            status: o.status,
            usedInJobId: o.used_in_job_id,
            createdAt: o.created_at,
            notes: o.notes,
          }));
        }
      } catch (err) {
        console.warn('Error reading offcuts from Supabase:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_OFFCUTS);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_OFFCUTS, JSON.stringify(INITIAL_OFFCUTS));
    }
    return INITIAL_OFFCUTS;
  }

  // Add Offcut
  static async addOffcut(offcut: Omit<PPFOffcut, 'id' | 'createdAt'>): Promise<PPFOffcut> {
    const newOffcut: PPFOffcut = {
      ...offcut,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `offcut-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase
          .from('ppf_offcuts')
          .insert({
            parent_roll_id: newOffcut.parentRollId,
            parent_roll_code: newOffcut.parentRollCode,
            brand: newOffcut.brand,
            finish: newOffcut.finish,
            width_cm: newOffcut.widthCm,
            length_cm: newOffcut.lengthCm,
            storage_location: newOffcut.storageLocation,
            suggested_use: newOffcut.suggestedUse,
            status: newOffcut.status,
            notes: newOffcut.notes,
          })
          .select()
          .single();

        if (data) {
          newOffcut.id = data.id;
        }
      } catch (err) {
        console.error('Supabase addOffcut failed:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const existing = await this.getOffcuts();
      localStorage.setItem(LOCAL_STORAGE_KEY_OFFCUTS, JSON.stringify([newOffcut, ...existing]));
    }
    return newOffcut;
  }

  // Update Offcut status (e.g. mark as USED or DISCARDED)
  static async updateOffcutStatus(id: string, status: 'AVAILABLE' | 'USED' | 'DISCARDED', notes?: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('ppf_offcuts')
          .update({ status, ...(notes ? { notes } : {}) })
          .eq('id', id);
      } catch (err) {
        console.error('Supabase updateOffcutStatus failed:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const existing = await this.getOffcuts();
      const updated = existing.map((o) => (o.id === id ? { ...o, status, ...(notes ? { notes } : {}) } : o));
      localStorage.setItem(LOCAL_STORAGE_KEY_OFFCUTS, JSON.stringify(updated));
    }
  }

  // Delete Offcut
  static async deleteOffcut(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('ppf_offcuts').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteOffcut failed:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const existing = await this.getOffcuts();
      localStorage.setItem(LOCAL_STORAGE_KEY_OFFCUTS, JSON.stringify(existing.filter((o) => o.id !== id)));
    }
  }

  // Compute advanced statistics & KPIs
  static calculateStats(rolls: PPFRoll[], jobs: PPFJobConsumption[], offcuts: PPFOffcut[], lowStockThreshold = 3.0) {
    const totalRolls = rolls.length;
    const activeRolls = rolls.filter((r) => r.status === 'ACTIVE').length;
    const sealedRolls = rolls.filter((r) => r.status === 'SEALED').length;
    const depletedRolls = rolls.filter((r) => r.status === 'DEPLETED').length;

    const totalStockMeters = rolls
      .filter((r) => r.status === 'ACTIVE')
      .reduce((acc, r) => acc + Number(r.currentMeters), 0);

    const lowStockRolls = rolls.filter(
      (r) => r.status === 'ACTIVE' && Number(r.currentMeters) <= lowStockThreshold && Number(r.currentMeters) > 0
    );

    const estimatedInventoryValue = rolls
      .filter((r) => r.status !== 'DEPLETED')
      .reduce((acc, r) => {
        const costPerM = r.initialMeters > 0 ? r.costPerRoll / r.initialMeters : 0;
        return acc + costPerM * Number(r.currentMeters);
      }, 0);

    // Job Metrics
    const totalMetersUsed = jobs.reduce((acc, j) => acc + Number(j.metersUsed), 0);
    const totalMetersScrap = jobs.reduce((acc, j) => acc + Number(j.metersScrap || 0), 0);
    const totalMetersCut = totalMetersUsed + totalMetersScrap;

    const overallScrapRate = totalMetersCut > 0 ? (totalMetersScrap / totalMetersCut) * 100 : 0;

    // Total cost wasted on scrap
    const totalScrapCostWasted = jobs.reduce((acc, j) => {
      if (j.metersScrap && j.metersScrap > 0) {
        const roll = rolls.find((r) => r.id === j.rollId || r.code === j.rollCode);
        const costPerM = roll && roll.initialMeters > 0 ? roll.costPerRoll / roll.initialMeters : 90;
        return acc + costPerM * j.metersScrap;
      }
      return acc;
    }, 0);

    // Installer Metrics
    const installerMap: {
      [name: string]: {
        jobsCount: number;
        metersUsed: number;
        metersScrap: number;
        costWasted: number;
      };
    } = {};

    jobs.forEach((j) => {
      const name = j.installer || 'Sin asignar';
      if (!installerMap[name]) {
        installerMap[name] = { jobsCount: 0, metersUsed: 0, metersScrap: 0, costWasted: 0 };
      }
      installerMap[name].jobsCount += 1;
      installerMap[name].metersUsed += Number(j.metersUsed);
      installerMap[name].metersScrap += Number(j.metersScrap || 0);

      const roll = rolls.find((r) => r.id === j.rollId || r.code === j.rollCode);
      const costPerM = roll && roll.initialMeters > 0 ? roll.costPerRoll / roll.initialMeters : 90;
      installerMap[name].costWasted += costPerM * Number(j.metersScrap || 0);
    });

    const installerStats = Object.entries(installerMap).map(([name, data]) => {
      const totalCut = data.metersUsed + data.metersScrap;
      const rate = totalCut > 0 ? (data.metersScrap / totalCut) * 100 : 0;
      return {
        name,
        jobsCount: data.jobsCount,
        metersUsed: Number(data.metersUsed.toFixed(2)),
        metersScrap: Number(data.metersScrap.toFixed(2)),
        wasteRatePercent: Number(rate.toFixed(1)),
        costWasted: Number(data.costWasted.toFixed(2)),
      };
    }).sort((a, b) => a.wasteRatePercent - b.wasteRatePercent);

    // Scrap Reasons breakdown
    const scrapReasonsMap: { [reason: string]: { count: number; meters: number } } = {};
    jobs.forEach((j) => {
      if (j.metersScrap && j.metersScrap > 0) {
        const reason = j.scrapReason || 'OTHER';
        if (!scrapReasonsMap[reason]) {
          scrapReasonsMap[reason] = { count: 0, meters: 0 };
        }
        scrapReasonsMap[reason].count += 1;
        scrapReasonsMap[reason].meters += Number(j.metersScrap);
      }
    });

    // Offcuts summary
    const availableOffcuts = offcuts.filter((o) => o.status === 'AVAILABLE');
    const usedOffcuts = offcuts.filter((o) => o.status === 'USED');

    return {
      totalRolls,
      activeRolls,
      sealedRolls,
      depletedRolls,
      totalStockMeters: Number(totalStockMeters.toFixed(2)),
      lowStockRolls,
      estimatedInventoryValue: Number(estimatedInventoryValue.toFixed(2)),
      totalMetersUsed: Number(totalMetersUsed.toFixed(2)),
      totalMetersScrap: Number(totalMetersScrap.toFixed(2)),
      overallScrapRate: Number(overallScrapRate.toFixed(1)),
      totalScrapCostWasted: Number(totalScrapCostWasted.toFixed(2)),
      installerStats,
      scrapReasonsMap,
      availableOffcutsCount: availableOffcuts.length,
      usedOffcutsCount: usedOffcuts.length,
    };
  }

  // Export to CSV helper
  static exportRollsToCSV(rolls: PPFRoll[]): void {
    const headers = ['Codigo', 'Marca', 'Modelo', 'Acabado', 'Ancho (m)', 'Metros Iniciales', 'Metros Restantes', 'Costo Rollo', 'Lote', 'Ubicacion', 'Estado'];
    const rows = rolls.map((r) => [
      `"${r.code}"`,
      `"${r.brand}"`,
      `"${r.model}"`,
      `"${r.finish}"`,
      r.widthMeters,
      r.initialMeters,
      r.currentMeters,
      r.costPerRoll,
      `"${r.batchNumber || ''}"`,
      `"${r.location}"`,
      `"${r.status}"`,
    ]);

    this.downloadCSV('ArmorCut_Bobinas_Stock.csv', [headers.join(','), ...rows.map((row) => row.join(','))].join('\n'));
  }

  static exportJobsToCSV(jobs: PPFJobConsumption[]): void {
    const headers = ['Fecha', 'Bobina', 'Vehiculo', 'Patente', 'Cliente', 'OT', 'Instalador', 'Piezas', 'Metros Usados', 'Metros Scrap', 'Causa Scrap', 'Costo Total'];
    const rows = jobs.map((j) => [
      `"${new Date(j.jobDate).toLocaleDateString()}"`,
      `"${j.rollCode}"`,
      `"${j.vehicle}"`,
      `"${j.licensePlate || ''}"`,
      `"${j.clientName}"`,
      `"${j.workOrderNumber || ''}"`,
      `"${j.installer}"`,
      `"${(j.parts || []).join(' | ')}"`,
      j.metersUsed,
      j.metersScrap,
      `"${j.scrapReason || ''}"`,
      j.costCalculated,
    ]);

    this.downloadCSV('ArmorCut_Trabajos_Consumo.csv', [headers.join(','), ...rows.map((row) => row.join(','))].join('\n'));
  }

  private static downloadCSV(filename: string, csvContent: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
