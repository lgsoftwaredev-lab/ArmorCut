import { PPFRoll, PPFJobConsumption, CreateRollInput, CreateJobInput, PPFStats } from '@/types/ppf';
import { supabase, isSupabaseConfigured } from './supabase';

interface SupabaseRollRow {
  id: string;
  code: string;
  brand: string;
  model: string;
  finish: PPFRoll['finish'];
  width_meters: number | string;
  initial_meters: number | string;
  current_meters: number | string;
  cost_per_roll: number | string;
  currency?: string;
  batch_number?: string;
  location: string;
  status: PPFRoll['status'];
  created_at: string;
  notes?: string;
}

interface SupabaseJobRow {
  id: string;
  roll_id: string;
  roll_code: string;
  brand: string;
  model?: string;
  finish: PPFRoll['finish'];
  vehicle: string;
  license_plate?: string;
  client_name: string;
  work_order_number?: string;
  installer: string;
  parts: string[] | string;
  meters_used: number | string;
  cost_calculated?: number | string;
  job_date: string;
  notes?: string;
}

// Mock initial data: 100% Kryptonite PPF (156cm y 120cm x 15m)
const INITIAL_ROLLS: PPFRoll[] = [
  {
    id: 'roll-1',
    code: 'KRYP-GL-01',
    brand: 'Kryptonite',
    model: 'Ultra Gloss (Carrocería)',
    finish: 'GLOSS',
    widthMeters: 1.56,
    initialMeters: 15.0,
    currentMeters: 10.8,
    costPerRoll: 1300,
    currency: 'USD',
    batchNumber: 'KRYP-2026-A1',
    location: 'Rack A - Nivel 1',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    notes: 'Bobina principal para capots, paragolpes y kits frontales',
  },
  {
    id: 'roll-2',
    code: 'KRYP-MT-02',
    brand: 'Kryptonite',
    model: 'Satin Matte',
    finish: 'MATTE',
    widthMeters: 1.56,
    initialMeters: 15.0,
    currentMeters: 4.2,
    costPerRoll: 1450,
    currency: 'USD',
    batchNumber: 'KRYP-2026-M4',
    location: 'Rack A - Nivel 2',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    notes: 'Para terminaciones satinadas y autos mate',
  },
  {
    id: 'roll-3',
    code: 'KRYP-WP-03',
    brand: 'Kryptonite',
    model: 'Windshield Armor (Parabrisas)',
    finish: 'WINDSHIELD',
    widthMeters: 1.20,
    initialMeters: 15.0,
    currentMeters: 12.0,
    costPerRoll: 1100,
    currency: 'USD',
    batchNumber: 'KRYP-WP-89',
    location: 'Rack Vidrios',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    notes: 'Medida 1.20m x 15m exclusiva para protección de parabrisas',
  },
  {
    id: 'roll-4',
    code: 'KRYP-BK-04',
    brand: 'Kryptonite',
    model: 'Piano Black',
    finish: 'BLACK_PIANO',
    widthMeters: 1.56,
    initialMeters: 15.0,
    currentMeters: 15.0,
    costPerRoll: 1500,
    currency: 'USD',
    batchNumber: 'KRYP-BK-02',
    location: 'Depósito Sellados',
    status: 'SEALED',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    notes: 'Bobina nueva cerrada para techos y parantes negro brillante',
  },
  {
    id: 'roll-5',
    code: 'KRYP-GL-05',
    brand: 'Kryptonite',
    model: 'Ultra Gloss (Carrocería)',
    finish: 'GLOSS',
    widthMeters: 1.56,
    initialMeters: 15.0,
    currentMeters: 2.1,
    costPerRoll: 1300,
    currency: 'USD',
    batchNumber: 'KRYP-2025-Z9',
    location: 'Rack B - Nivel 1',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    notes: 'ALERTA: Quedan 2.10m. Reservar para piezas chicas o espejos',
  },
];

const INITIAL_JOBS: PPFJobConsumption[] = [
  {
    id: 'job-1',
    rollId: 'roll-1',
    rollCode: 'KRYP-GL-01',
    brand: 'Kryptonite',
    model: 'Ultra Gloss (Carrocería)',
    finish: 'GLOSS',
    vehicle: 'Porsche 911 Carrera S',
    licensePlate: 'AF 281 OK',
    clientName: 'Alejandro Benitez',
    workOrderNumber: 'OT-2026-104',
    installer: 'Lucas',
    parts: ['Capot Completo', 'Paragolpes Frontal', 'Espejos'],
    metersUsed: 4.2,
    costCalculated: 364.0,
    jobDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    notes: 'Kit precortado por centro de corte instalado sin problemas',
  },
  {
    id: 'job-2',
    rollId: 'roll-1',
    rollCode: 'KRYP-GL-01',
    brand: 'Kryptonite',
    model: 'Ultra Gloss (Carrocería)',
    finish: 'GLOSS',
    vehicle: 'Audi RS3 Sportback',
    licensePlate: 'AE 754 PL',
    clientName: 'Nicolás Rossi',
    workOrderNumber: 'OT-2026-108',
    installer: 'Lucas',
    parts: ['Full Frontal', 'Ópticas', 'Zócalos'],
    metersUsed: 4.5,
    costCalculated: 390.0,
    jobDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    notes: 'Instalación prolija y limpia',
  },
  {
    id: 'job-3',
    rollId: 'roll-3',
    rollCode: 'KRYP-WP-03',
    brand: 'Kryptonite',
    model: 'Windshield Armor (Parabrisas)',
    finish: 'WINDSHIELD',
    vehicle: 'BMW M2 Competition',
    licensePlate: 'AG 112 ZZ',
    clientName: 'Ignacio Falcon',
    workOrderNumber: 'OT-2026-115',
    installer: 'Marcos',
    parts: ['Parabrisas Completo'],
    metersUsed: 1.5,
    costCalculated: 110.0,
    jobDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    notes: 'Colocación de film parabrisas 1.20m',
  },
];

const LOCAL_STORAGE_KEY_ROLLS = 'armorcut_ppf_rolls_kryptonite_v1';
const LOCAL_STORAGE_KEY_JOBS = 'armorcut_ppf_jobs_kryptonite_v1';

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
          return (data as unknown as SupabaseRollRow[]).map((r) => ({
            id: r.id,
            code: r.code,
            brand: r.brand || 'Kryptonite',
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
  static async addRoll(roll: CreateRollInput): Promise<PPFRoll> {
    const newRoll: PPFRoll = {
      ...roll,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `roll-${Date.now()}`,
      createdAt: new Date().toISOString(),
      brand: roll.brand || 'Kryptonite',
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
        const payload: Record<string, unknown> = {};
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
          return (data as unknown as SupabaseJobRow[]).map((j) => ({
            id: j.id,
            rollId: j.roll_id,
            rollCode: j.roll_code,
            brand: j.brand || 'Kryptonite',
            model: j.model || '',
            finish: j.finish,
            vehicle: j.vehicle,
            licensePlate: j.license_plate,
            clientName: j.client_name,
            workOrderNumber: j.work_order_number,
            installer: j.installer,
            parts: Array.isArray(j.parts) ? j.parts : JSON.parse(j.parts || '[]'),
            metersUsed: Number(j.meters_used),
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

  // Record a Job
  static async recordJob(
    jobData: CreateJobInput
  ): Promise<{ job: PPFJobConsumption; updatedRoll: PPFRoll }> {
    const rolls = await this.getRolls();
    const roll = rolls.find((r) => r.id === jobData.rollId || r.code === jobData.rollCode);

    if (!roll) {
      throw new Error(`Bobina no encontrada: ${jobData.rollCode || jobData.rollId}`);
    }

    const totalMetersDeducted = Number(jobData.metersUsed);
    const newCurrentMeters = Math.max(0, Number((roll.currentMeters - totalMetersDeducted).toFixed(2)));
    const newStatus = newCurrentMeters <= 0.05 ? 'DEPLETED' : roll.status;

    const costPerMeter = roll.initialMeters > 0 ? roll.costPerRoll / roll.initialMeters : 86.66;
    const totalCost = Number((costPerMeter * totalMetersDeducted).toFixed(2));

    const newJob: PPFJobConsumption = {
      ...jobData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `job-${Date.now()}`,
      jobDate: new Date().toISOString(),
      costCalculated: totalCost,
      metersUsed: Number(jobData.metersUsed),
    };

    const updatedRoll: PPFRoll = {
      ...roll,
      currentMeters: newCurrentMeters,
      status: newStatus,
    };

    if (isSupabaseConfigured() && supabase) {
      try {
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
            cost_calculated: newJob.costCalculated,
            notes: newJob.notes,
          })
          .select()
          .single();

        if (jobRes) {
          newJob.id = jobRes.id;
        }

        await supabase
          .from('ppf_rolls')
          .update({
            current_meters: newCurrentMeters,
            status: newStatus,
          })
          .eq('id', roll.id);
      } catch (err) {
        console.error('Supabase recordJob error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const storedRolls = await this.getRolls();
      const updatedRolls = storedRolls.map((r) => (r.id === roll.id ? updatedRoll : r));
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLLS, JSON.stringify(updatedRolls));

      const storedJobs = await this.getJobs();
      localStorage.setItem(LOCAL_STORAGE_KEY_JOBS, JSON.stringify([newJob, ...storedJobs]));
    }

    return { job: newJob, updatedRoll };
  }

  // Stats calculation
  static calculateStats(rolls: PPFRoll[], jobs: PPFJobConsumption[], lowStockThreshold = 3.0): PPFStats {
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
        const costPerM = r.initialMeters > 0 ? r.costPerRoll / r.initialMeters : 86.66;
        return acc + costPerM * Number(r.currentMeters);
      }, 0);

    const totalMetersUsed = jobs.reduce((acc, j) => acc + Number(j.metersUsed), 0);

    const installerMap: {
      [name: string]: {
        jobsCount: number;
        metersUsed: number;
      };
    } = {};

    jobs.forEach((j) => {
      const name = j.installer || 'Sin asignar';
      if (!installerMap[name]) {
        installerMap[name] = { jobsCount: 0, metersUsed: 0 };
      }
      installerMap[name].jobsCount += 1;
      installerMap[name].metersUsed += Number(j.metersUsed);
    });

    const installerStats = Object.entries(installerMap).map(([name, data]) => ({
      name,
      jobsCount: data.jobsCount,
      metersUsed: Number(data.metersUsed.toFixed(2)),
    })).sort((a, b) => b.metersUsed - a.metersUsed);

    return {
      totalRolls,
      activeRolls,
      sealedRolls,
      depletedRolls,
      totalStockMeters: Number(totalStockMeters.toFixed(2)),
      lowStockRolls,
      estimatedInventoryValue: Number(estimatedInventoryValue.toFixed(2)),
      totalMetersUsed: Number(totalMetersUsed.toFixed(2)),
      totalJobsCount: jobs.length,
      installerStats,
    };
  }

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

    this.downloadCSV('ArmorCut_Kryptonite_Bobinas.csv', [headers.join(','), ...rows.map((row) => row.join(','))].join('\n'));
  }

  static exportJobsToCSV(jobs: PPFJobConsumption[]): void {
    const headers = ['Fecha', 'Bobina', 'Vehiculo', 'Patente', 'Cliente', 'OT', 'Instalador', 'Piezas', 'Metros Cortados', 'Costo Calculado'];
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
