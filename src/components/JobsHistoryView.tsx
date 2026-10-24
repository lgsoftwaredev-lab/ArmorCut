'use client';

import React, { useState } from 'react';
import { PPFJobConsumption } from '@/types/ppf';
import { Scissors, AlertTriangle, Search, Calendar, User, Car, DollarSign } from 'lucide-react';

interface JobsHistoryViewProps {
  jobs: PPFJobConsumption[];
  onOpenNewJob: () => void;
}

export const JobsHistoryView: React.FC<JobsHistoryViewProps> = ({ jobs, onOpenNewJob }) => {
  const [search, setSearch] = useState('');
  const [filterInstaller, setFilterInstaller] = useState('ALL');
  const [filterScrapOnly, setFilterScrapOnly] = useState(false);

  const installers = Array.from(new Set(jobs.map((j) => j.installer))).filter(Boolean);

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.vehicle.toLowerCase().includes(search.toLowerCase()) ||
      j.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (j.licensePlate && j.licensePlate.toLowerCase().includes(search.toLowerCase())) ||
      j.rollCode.toLowerCase().includes(search.toLowerCase());

    const matchesInstaller = filterInstaller === 'ALL' || j.installer === filterInstaller;
    const matchesScrap = !filterScrapOnly || (j.metersScrap && j.metersScrap > 0);

    return matchesSearch && matchesInstaller && matchesScrap;
  });

  return (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Buscar por auto, cliente, patente o bobina..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select
            className="form-select"
            value={filterInstaller}
            onChange={(e) => setFilterInstaller(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="ALL">Todos los instaladores</option>
            {installers.map((inst) => (
              <option key={inst} value={inst}>
                Instalador: {inst}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setFilterScrapOnly(!filterScrapOnly)}
            className={`btn btn-sm ${filterScrapOnly ? 'btn-danger' : 'btn-secondary'}`}
          >
            <AlertTriangle size={14} />
            <span>{filterScrapOnly ? 'Mostrando solo mermas' : 'Filtrar con Scrap'}</span>
          </button>

          <button onClick={onOpenNewJob} className="btn btn-primary btn-sm">
            <Scissors size={14} />
            <span>+ Nuevo Corte</span>
          </button>
        </div>
      </div>

      {/* Jobs List / Table */}
      {filteredJobs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-card)',
        }}>
          <Scissors size={36} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>No hay registros de cortes</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Comienza registrando la primera instalación en un vehículo para descontar metros de stock.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredJobs.map((job) => {
            const hasScrap = job.metersScrap && job.metersScrap > 0;
            return (
              <div
                key={job.id}
                style={{
                  background: 'var(--bg-card)',
                  border: hasScrap ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  transition: 'background var(--transition-fast)',
                }}
              >
                {/* Left: Vehicle & Client */}
                <div style={{ minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Car size={16} color="var(--accent-cyan)" />
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{job.vehicle}</strong>
                    {job.licensePlate && (
                      <span className="mono" style={{
                        fontSize: '0.75rem',
                        background: 'var(--bg-surface)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}>
                        {job.licensePlate}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Cliente: <strong style={{ color: 'var(--text-secondary)' }}>{job.clientName}</strong>
                    {job.workOrderNumber && <span> • OT: {job.workOrderNumber}</span>}
                  </div>
                </div>

                {/* Middle: Parts and Roll */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span className="mono" style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)',
                      background: 'rgba(0, 240, 255, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {job.rollCode}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {job.brand} {job.finish}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(job.parts || []).map((part, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.72rem',
                          background: 'var(--bg-surface)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Meters, Scrap Badge & Cost */}
                <div style={{ textAlign: 'right', minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px' }}>
                    <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {job.metersUsed} m
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>aplicados</span>
                  </div>

                  {hasScrap && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      color: '#f87171',
                      background: 'var(--color-danger-bg)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      marginTop: '4px',
                    }}>
                      <AlertTriangle size={12} />
                      <span>+{job.metersScrap}m Scrap ({job.scrapReason})</span>
                    </div>
                  )}

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>Por <strong>{job.installer}</strong></span> • <span>{new Date(job.jobDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
