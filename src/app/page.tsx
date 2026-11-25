'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PPFRoll,
  PPFJobConsumption,
  CreateRollInput,
  CreateJobInput,
} from '@/types/ppf';
import { StockService } from '@/lib/stockService';
import { Header, AppTab } from '@/components/Header';
import { RollCard } from '@/components/RollCard';
import { NewRollModal } from '@/components/NewRollModal';
import { NewJobModal, InitialJobData } from '@/components/NewJobModal';
import { JobsHistoryView } from '@/components/JobsHistoryView';
import { MetricsView } from '@/components/MetricsView';
import { VehicleStudioView } from '@/components/matrix/VehicleStudioView';
import { PlusCarsLogo } from '@/components/brand/PlusCarsBrand';
import { DemoTourOverlay, DemoActionDetail } from '@/components/DemoTourOverlay';
import {
  Layers,
  Scissors,
  Search,
  Plus,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export default function ArmorCutDashboard() {
  const [activeTab, setActiveTab] = useState<AppTab>('ROLLS');

  // Core Data State
  const [rolls, setRolls] = useState<PPFRoll[]>([]);
  const [jobs, setJobs] = useState<PPFJobConsumption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters for Rolls
  const [searchQuery, setSearchQuery] = useState('');
  const [finishFilter, setFinishFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // Modals
  const [isNewRollModalOpen, setIsNewRollModalOpen] = useState(false);
  const [editingRoll, setEditingRoll] = useState<PPFRoll | null>(null);

  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [preselectedRoll, setPreselectedRoll] = useState<PPFRoll | null>(null);
  const [editingJob, setEditingJob] = useState<PPFJobConsumption | null>(null);
  const [initialJobData, setInitialJobData] = useState<InitialJobData | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [hasAutoLaunchedDemo, setHasAutoLaunchedDemo] = useState(false);

  // Listen for interactive demo navigation
  useEffect(() => {
    const handleDemoAction = (e: Event) => {
      const detail = (e as CustomEvent<DemoActionDetail>).detail;
      if (detail?.type === 'SET_TAB' && detail.tab) {
        setActiveTab(detail.tab);
      }
    };
    window.addEventListener('armorcut:demo-action', handleDemoAction);
    return () => window.removeEventListener('armorcut:demo-action', handleDemoAction);
  }, []);

  // Auto-launch ?demo=1 only AFTER initial inventory & jobs data finish loading
  useEffect(() => {
    if (isLoading || hasAutoLaunchedDemo) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      setHasAutoLaunchedDemo(true);
      setIsDemoOpen(true);
    }
  }, [isLoading, hasAutoLaunchedDemo]);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [fetchedRolls, fetchedJobs] = await Promise.all([
        StockService.getRolls(),
        StockService.getJobs(),
      ]);
      setRolls(fetchedRolls);
      setJobs(fetchedJobs);
    } catch (err) {
      console.error('Error loading inventory data:', err);
      setLoadError('No se pudo sincronizar el inventario. Verifica la conexión e intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for Rolls
  const handleSaveRoll = useCallback(
    async (rollData: CreateRollInput) => {
      if (editingRoll) {
        await StockService.updateRoll(editingRoll.id, rollData);
      } else {
        await StockService.addRoll(rollData);
      }
      await loadData();
      setEditingRoll(null);
    },
    [editingRoll, loadData]
  );

  const handleDeleteRoll = useCallback(
    async (rollId: string) => {
      await StockService.deleteRoll(rollId);
      await loadData();
    },
    [loadData]
  );

  // Handlers for Jobs
  const handleSaveJob = useCallback(
    async (jobData: CreateJobInput) => {
      if (editingJob) {
        await StockService.updateJob(editingJob.id, jobData);
      } else {
        await StockService.recordJob(jobData);
      }
      await loadData();
      setEditingJob(null);
    },
    [editingJob, loadData]
  );

  const handleDeleteJob = useCallback(
    async (job: PPFJobConsumption) => {
      await StockService.deleteJob(job.id);
      await loadData();
    },
    [loadData]
  );

  // Memoized Stats calculation
  const stats = useMemo(
    () => StockService.calculateStats(rolls, jobs, 3.0),
    [rolls, jobs]
  );

  // Memoized Filtered Rolls
  const filteredRolls = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rolls.filter((roll) => {
      const matchesSearch =
        !q ||
        roll.code.toLowerCase().includes(q) ||
        roll.brand.toLowerCase().includes(q) ||
        roll.model.toLowerCase().includes(q) ||
        roll.location.toLowerCase().includes(q);

      const matchesFinish = finishFilter === 'ALL' || roll.finish === finishFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && roll.status === 'ACTIVE') ||
        (statusFilter === 'SEALED' && roll.status === 'SEALED') ||
        (statusFilter === 'DEPLETED' && (roll.status === 'DEPLETED' || roll.currentMeters <= 0));

      return matchesSearch && matchesFinish && matchesStatus;
    });
  }, [rolls, searchQuery, finishFilter, statusFilter]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Integrated Architectural Topbar */}
      <Header
        shopName={process.env.NEXT_PUBLIC_SHOP_NAME || 'PLUSCARS DETAILING'}
        totalMeters={stats.totalStockMeters}
        activeRollsCount={stats.activeRolls}
        lowStockCount={stats.lowStockRolls.length}
        totalJobsCount={jobs.length}
        rollsCount={rolls.length}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRefresh={loadData}
        onStartDemo={() => setIsDemoOpen(true)}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <main className="app-main">
        {/* Global Load Error Banner */}
        {loadError && (
          <div
            role="alert"
            style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4) var(--space-5)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: '#fca5a5', fontSize: 'var(--text-sm)' }}>
              <AlertCircle size={16} color="var(--color-danger)" />
              <span>{loadError}</span>
            </div>
            <button type="button" onClick={loadData} className="btn btn-secondary btn-sm">
              <RotateCcw size={12} />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {/* Tab 1: ROLLS VIEW */}
        {activeTab === 'ROLLS' && (
          <div>
            {/* Focal Section Header */}
            <div className="section-header">
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  STOCK DE MATERIAL · {stats.totalStockMeters}M DISPONIBLES
                </div>
                <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>
                  Inventario de Bobinas
                </h1>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPreselectedRoll(null);
                    setInitialJobData(null);
                    setIsNewJobModalOpen(true);
                  }}
                  className="btn btn-secondary"
                >
                  <Scissors size={14} />
                  <span>Registrar Corte</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingRoll(null);
                    setIsNewRollModalOpen(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus size={15} />
                  <span>Nueva Bobina</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div
              className="filter-controls-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div
                className="filter-search-box"
                style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}
              >
                <Search
                  size={15}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '11px' }}
                />
                <input
                  type="text"
                  aria-label="Buscar bobina"
                  placeholder="Buscar por código, marca, modelo o ubicación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <select
                  aria-label="Filtrar por estado"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="ACTIVE">Estado: Activas</option>
                  <option value="SEALED">Estado: Selladas</option>
                  <option value="DEPLETED">Estado: Agotadas</option>
                  <option value="ALL">Estado: Todas</option>
                </select>

                <select
                  aria-label="Filtrar por acabado"
                  className="form-select"
                  value={finishFilter}
                  onChange={(e) => setFinishFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="ALL">Acabado: Todos</option>
                  <option value="GLOSS">Gloss</option>
                  <option value="MATTE">Matte</option>
                  <option value="BLACK_PIANO">Black Piano</option>
                  <option value="SMOKE_HEADLIGHT">Smoke Ópticas</option>
                </select>
              </div>
            </div>

            {/* Loading State, Empty State, or Rolls Grid */}
            {isLoading && rolls.length === 0 ? (
              <div className="rolls-grid" aria-busy="true" aria-label="Cargando bobinas">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="skeleton-block" style={{ height: '210px' }} />
                ))}
              </div>
            ) : filteredRolls.length === 0 ? (
              <div className="state-box">
                <Layers size={24} color="var(--text-dim)" />
                <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                  Sin bobinas que coincidan con la búsqueda
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', maxWidth: '360px' }}>
                  Cambiá los criterios de filtrado o registrá una nueva bobina en el inventario.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setFinishFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 'var(--space-2)' }}
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="rolls-grid">
                {filteredRolls.map((roll) => (
                  <RollCard
                    key={roll.id}
                    roll={roll}
                    lowStockThreshold={3.0}
                    onRecordJobForRoll={(selectedRoll) => {
                      setPreselectedRoll(selectedRoll);
                      setInitialJobData(null);
                      setIsNewJobModalOpen(true);
                    }}
                    onEditRoll={(rollToEdit) => {
                      setEditingRoll(rollToEdit);
                      setIsNewRollModalOpen(true);
                    }}
                    onDeleteRoll={handleDeleteRoll}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: JOBS HISTORY VIEW */}
        {activeTab === 'JOBS' && (
          <JobsHistoryView
            jobs={jobs}
            onOpenNewJob={() => {
              setEditingJob(null);
              setPreselectedRoll(null);
              setInitialJobData(null);
              setIsNewJobModalOpen(true);
            }}
            onEditJob={(jobToEdit) => {
              setEditingJob(jobToEdit);
              setPreselectedRoll(null);
              setInitialJobData(null);
              setIsNewJobModalOpen(true);
            }}
            onDeleteJob={handleDeleteJob}
          />
        )}

        {/* Tab 3: METRICS */}
        {activeTab === 'METRICS' && <MetricsView stats={stats} />}

        {/* Tab 4: 3D SHOWROOM & CAD STUDIO */}
        {activeTab === 'STUDIO' && (
          <VehicleStudioView
            rolls={rolls}
            onOpenNewJobWithData={(data) => {
              setEditingJob(null);
              setInitialJobData(data);
              if (data.rollId) {
                setPreselectedRoll(rolls.find((r) => r.id === data.rollId) || null);
              } else {
                setPreselectedRoll(null);
              }
              setIsNewJobModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Minimalist Architectural Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-main)',
          padding: 'var(--space-5) var(--space-8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <strong style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
            ARMORCUT
          </strong>
          <span>·</span>
          <span>Control de Stock & Precorte PPF</span>
        </div>
        <PlusCarsLogo height={12} />
      </footer>

      {/* Modals */}
      <NewRollModal
        isOpen={isNewRollModalOpen}
        onClose={() => {
          setIsNewRollModalOpen(false);
          setEditingRoll(null);
        }}
        onSave={handleSaveRoll}
        editingRoll={editingRoll}
      />

      <NewJobModal
        isOpen={isNewJobModalOpen}
        onClose={() => {
          setIsNewJobModalOpen(false);
          setEditingJob(null);
          setPreselectedRoll(null);
          setInitialJobData(null);
        }}
        onSaveJob={handleSaveJob}
        rolls={rolls}
        preselectedRoll={preselectedRoll}
        editingJob={editingJob}
        initialJobData={initialJobData}
      />

      <DemoTourOverlay
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        autoPlay={true}
      />
    </div>
  );
}
