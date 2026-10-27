'use client';

import React, { useState } from 'react';
import { PPFJobConsumption } from '@/types/ppf';
import { Scissors, Search, Car } from 'lucide-react';

interface JobsHistoryViewProps {
  jobs: PPFJobConsumption[];
  onOpenNewJob: () => void;
}

export const JobsHistoryView: React.FC<JobsHistoryViewProps> = ({ jobs, onOpenNewJob }) => {
  const [search, setSearch] = useState('');
  const [filterInstaller, setFilterInstaller] = useState('ALL');

  const installers = Array.from(new Set(jobs.map((j) => j.installer))).filter(Boolean);

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.vehicle.toLowerCase().includes(search.toLowerCase()) ||
      j.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (j.licensePlate && j.licensePlate.toLowerCase().includes(search.toLowerCase())) ||
      j.rollCode.toLowerCase().includes(search.toLowerCase());

    const matchesInstaller = filterInstaller === 'ALL' || j.installer === filterInstaller;

    return matchesSearch && matchesInstaller;
  });

  return (
    <div>
      {/* Search and Filters */}
      <div className="filter-controls-row" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div className="filter-search-box" style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
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

        <div className="filter-selects-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

          <button onClick={onOpenNewJob} className="btn btn-primary btn-sm filter-add-btn">
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
            return (
              <div
                key={job.id}
                className="job-item"
              >
                {/* Left: Vehicle & Client */}
                <div style={{ flex: 1, minWidth: 'min(100%, 220px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <Car size={16} color="var(--accent-red)" style={{ flexShrink: 0 }} />
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
                <div style={{ flex: 1, minWidth: 'min(100%, 240px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span className="mono" style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--accent-red)',
                      background: 'rgba(230, 25, 55, 0.12)',
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
                    {(job.parts || []).map((part: string, idx: number) => (
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

                {/* Right: Meters & Meta */}
                <div className="job-item-right" style={{ textAlign: 'right', minWidth: 'min(100%, 160px)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px' }}>
                    <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {job.metersUsed} m
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>cortados</span>
                  </div>

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
