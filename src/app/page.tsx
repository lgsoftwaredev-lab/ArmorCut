'use client';

import React, { useState, useEffect } from 'react';
import { 
  PPFRoll, 
  PPFJobConsumption, 
  CreateRollInput, 
  CreateJobInput 
} from '@/types/ppf';
import { StockService } from '@/lib/stockService';
import { Header } from '@/components/Header';
import { RollCard } from '@/components/RollCard';
import { NewRollModal } from '@/components/NewRollModal';
import { NewJobModal } from '@/components/NewJobModal';
import { JobsHistoryView } from '@/components/JobsHistoryView';
import { MetricsView } from '@/components/MetricsView';
import { SupabaseGuideModal } from '@/components/SupabaseGuideModal';
import { 
  Layers, 
  Scissors, 
  TrendingUp, 
  Search, 
  Plus, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export default function ArmorCutDashboard() {
  const [activeTab, setActiveTab] = useState<'ROLLS' | 'JOBS' | 'METRICS'>('ROLLS');

  // Core Data State
  const [rolls, setRolls] = useState<PPFRoll[]>([]);
  const [jobs, setJobs] = useState<PPFJobConsumption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters for Rolls
  const [searchQuery, setSearchQuery] = useState('');
  const [finishFilter, setFinishFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // Modals
  const [isNewRollModalOpen, setIsNewRollModalOpen] = useState(false);
  const [editingRoll, setEditingRoll] = useState<PPFRoll | null>(null);

  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [preselectedRoll, setPreselectedRoll] = useState<PPFRoll | null>(null);

  const [isSupabaseGuideOpen, setIsSupabaseGuideOpen] = useState(false);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRolls, fetchedJobs] = await Promise.all([
        StockService.getRolls(),
        StockService.getJobs(),
      ]);
      setRolls(fetchedRolls);
      setJobs(fetchedJobs);
    } catch (err) {
      console.error('Error loading inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    StockService.getRolls()
      .then(async (fetchedRolls) => {
        const fetchedJobs = await StockService.getJobs();
        if (!ignore) {
          setRolls(fetchedRolls);
          setJobs(fetchedJobs);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading inventory data:', err);
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Handlers for Rolls
  const handleSaveRoll = async (rollData: CreateRollInput) => {
    if (editingRoll) {
      await StockService.updateRoll(editingRoll.id, rollData);
    } else {
      await StockService.addRoll(rollData);
    }
    await loadData();
    setEditingRoll(null);
  };

  const handleDeleteRoll = async (rollId: string) => {
    await StockService.deleteRoll(rollId);
    await loadData();
  };

  // Handlers for Jobs
  const handleSaveJob = async (jobData: CreateJobInput) => {
    await StockService.recordJob(jobData);
    await loadData();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'JOBS') {
      StockService.exportJobsToCSV(jobs);
    } else {
      StockService.exportRollsToCSV(rolls);
    }
  };

  // Stats calculation
  const stats = StockService.calculateStats(rolls, jobs, 3.0);

  // Filtered Rolls
  const filteredRolls = rolls.filter((roll) => {
    const matchesSearch =
      roll.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFinish = finishFilter === 'ALL' || roll.finish === finishFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && roll.status === 'ACTIVE') ||
      (statusFilter === 'SEALED' && roll.status === 'SEALED') ||
      (statusFilter === 'DEPLETED' && (roll.status === 'DEPLETED' || roll.currentMeters <= 0));

    return matchesSearch && matchesFinish && matchesStatus;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Header
        shopName={process.env.NEXT_PUBLIC_SHOP_NAME || 'PLUSCARS DETAILING'}
        totalMeters={stats.totalStockMeters}
        activeRollsCount={stats.activeRolls}
        lowStockCount={stats.lowStockRolls.length}
        totalJobsCount={jobs.length}
        onOpenSupabaseGuide={() => setIsSupabaseGuideOpen(true)}
        onExportCSV={handleExportCSV}
      />

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px',
          marginBottom: '24px',
        }}>
          {/* Tab buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('ROLLS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: activeTab === 'ROLLS' ? '1px solid var(--accent-red)' : '1px solid transparent',
                background: activeTab === 'ROLLS' ? 'rgba(230, 25, 55, 0.15)' : 'transparent',
                color: activeTab === 'ROLLS' ? 'var(--accent-red)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Layers size={17} />
              <span>Bobinas & Stock ({rolls.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('JOBS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: activeTab === 'JOBS' ? '1px solid var(--accent-red)' : '1px solid transparent',
                background: activeTab === 'JOBS' ? 'rgba(230, 25, 55, 0.15)' : 'transparent',
                color: activeTab === 'JOBS' ? 'var(--accent-red)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Scissors size={17} />
              <span>Cortes & Salidas ({jobs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('METRICS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: activeTab === 'METRICS' ? '1px solid var(--accent-red)' : '1px solid transparent',
                background: activeTab === 'METRICS' ? 'rgba(230, 25, 55, 0.15)' : 'transparent',
                color: activeTab === 'METRICS' ? 'var(--accent-red)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <TrendingUp size={17} />
              <span>Métricas & Reportes</span>
            </button>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={loadData}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            title="Refrescar datos desde la base de datos"
          >
            <RotateCcw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>

        {/* Tab 1: ROLLS VIEW */}
        {activeTab === 'ROLLS' && (
          <div>
            {/* Search and Filters */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
            }}>
              {/* Search box */}
              <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Buscar bobina por código, marca, modelo o estante..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              {/* Status and Finish Selectors */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="ACTIVE">Activas (En uso)</option>
                  <option value="SEALED">Selladas (Cerradas)</option>
                  <option value="DEPLETED">Agotadas (0m)</option>
                  <option value="ALL">Todos los estados</option>
                </select>

                <select
                  className="form-select"
                  value={finishFilter}
                  onChange={(e) => setFinishFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="ALL">Todos los acabados</option>
                  <option value="GLOSS">Gloss (Brillante)</option>
                  <option value="MATTE">Matte (Satinado)</option>
                  <option value="BLACK_PIANO">Black Piano</option>
                  <option value="SMOKE_HEADLIGHT">Smoke Ópticas</option>
                </select>

                <button
                  onClick={() => {
                    setEditingRoll(null);
                    setIsNewRollModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>+ Agregar Bobina</span>
                </button>
              </div>
            </div>

            {/* Low stock alert banner */}
            {stats.lowStockRolls.length > 0 && (
              <div style={{
                background: 'rgba(230, 25, 55, 0.08)',
                border: '1px solid rgba(230, 25, 55, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}>
                <AlertCircle size={20} color="var(--accent-red)" />
                <div style={{ fontSize: '0.85rem' }}>
                  <strong style={{ color: 'var(--accent-red)' }}>
                    Alerta de reposición:
                  </strong>{' '}
                  Hay {stats.lowStockRolls.length} bobina(s) con menos de 3.00 metros disponibles (
                  {stats.lowStockRolls.map((r) => `${r.code} - ${r.currentMeters}m`).join(', ')}). Recuerda pedir reposición al proveedor.
                </div>
              </div>
            )}

            {/* Rolls Grid */}
            {filteredRolls.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-card)',
              }}>
                <Layers size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>No se encontraron bobinas</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Ajusta los filtros de búsqueda o agrega una nueva bobina para comenzar a controlar stock.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '20px',
              }}>
                {filteredRolls.map((roll) => (
                  <RollCard
                    key={roll.id}
                    roll={roll}
                    lowStockThreshold={3.0}
                    onRecordJobForRoll={(r) => {
                      setPreselectedRoll(r);
                      setIsNewJobModalOpen(true);
                    }}
                    onEditRoll={(r) => {
                      setEditingRoll(r);
                      setIsNewRollModalOpen(true);
                    }}
                    onDeleteRoll={handleDeleteRoll}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: JOBS HISTORY */}
        {activeTab === 'JOBS' && (
          <JobsHistoryView
            jobs={jobs}
            onOpenNewJob={() => {
              setPreselectedRoll(null);
              setIsNewJobModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: METRICS */}
        {activeTab === 'METRICS' && (
          <MetricsView stats={stats} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}>
        ARMORCUT PPF • PLUSCARS DETAILING SOFTWARE • MONOLITO SERVERLESS VERCEL & SUPABASE ($0 COSTO)
      </footer>

      {/* Modals */}
      <NewRollModal
        isOpen={isNewRollModalOpen}
        onClose={() => setIsNewRollModalOpen(false)}
        onSave={handleSaveRoll}
        editingRoll={editingRoll}
      />

      <NewJobModal
        isOpen={isNewJobModalOpen}
        onClose={() => setIsNewJobModalOpen(false)}
        rolls={rolls}
        preselectedRoll={preselectedRoll}
        onSaveJob={handleSaveJob}
      />

      <SupabaseGuideModal
        isOpen={isSupabaseGuideOpen}
        onClose={() => setIsSupabaseGuideOpen(false)}
      />
    </div>
  );
}
