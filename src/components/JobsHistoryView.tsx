'use client';

import React, { useState, useMemo } from 'react';
import { PPFJobConsumption } from '@/types/ppf';
import { Scissors, Search, Edit2, Trash2 } from 'lucide-react';

interface JobsHistoryViewProps {
  jobs: PPFJobConsumption[];
  onOpenNewJob: () => void;
  onEditJob: (job: PPFJobConsumption) => void;
  onDeleteJob: (job: PPFJobConsumption) => void;
}

export const JobsHistoryView: React.FC<JobsHistoryViewProps> = ({
  jobs,
  onOpenNewJob,
  onEditJob,
  onDeleteJob,
}) => {
  const [search, setSearch] = useState('');
  const [filterInstaller, setFilterInstaller] = useState('ALL');

  const installers = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.installer))).filter(Boolean),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return jobs.filter((j) => {
      const matchesSearch =
        !q ||
        j.vehicle.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q) ||
        (j.licensePlate && j.licensePlate.toLowerCase().includes(q)) ||
        j.rollCode.toLowerCase().includes(q);

      const matchesInstaller = filterInstaller === 'ALL' || j.installer === filterInstaller;

      return matchesSearch && matchesInstaller;
    });
  }, [jobs, search, filterInstaller]);

  return (
    <div>
      {/* Section Header */}
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
            HISTORIAL DE SALIDAS · {jobs.length} REGISTROS
          </div>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>
            Órdenes de Corte
          </h1>
        </div>

        <button type="button" onClick={onOpenNewJob} className="btn btn-primary">
          <Scissors size={14} />
          <span>Nueva Orden de Corte</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div
        className="filter-controls-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
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
            aria-label="Buscar orden de corte"
            placeholder="Buscar por vehículo, cliente, patente o bobina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <select
            aria-label="Filtrar por instalador"
            className="form-select"
            value={filterInstaller}
            onChange={(e) => setFilterInstaller(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="ALL">Instalador: Todos</option>
            {installers.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="state-box">
          <Scissors size={24} color="var(--text-dim)" />
          <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
            Sin registros de corte
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', maxWidth: '360px' }}>
            Registrá una orden de trabajo para descontar metros lineales del stock activo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filteredJobs.map((job) => (
            <div key={job.id} className="job-item">
              {/* Left: Vehicle & Client */}
              <div style={{ flex: 1, minWidth: 'min(100%, 220px)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: '4px',
                    flexWrap: 'wrap',
                  }}
                >
                  <strong style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                    {job.vehicle}
                  </strong>
                  {job.licensePlate && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 'var(--text-xs)',
                        background: 'var(--bg-surface)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {job.licensePlate}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Cliente: <strong style={{ color: 'var(--text-secondary)' }}>{job.clientName}</strong>
                  {job.workOrderNumber && <span> · OT {job.workOrderNumber}</span>}
                </div>
              </div>

              {/* Middle: Parts and Roll */}
              <div style={{ flex: 1, minWidth: 'min(100%, 240px)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-card)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {job.rollCode}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {job.brand} · {job.finish}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(job.parts || []).map((part: string, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.7rem',
                        background: 'var(--bg-surface)',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Meters, Meta & Edit/Delete Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-4)',
                  minWidth: 'min(100%, 210px)',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'flex-end',
                      gap: '4px',
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 'var(--text-lg)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      -{job.metersUsed}m
                    </span>
                  </div>

                  <div
                    className="mono"
                    style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}
                  >
                    {job.installer} · {new Date(job.jobDate).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => onEditJob(job)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '7px 9px' }}
                    title="Editar orden de corte"
                    aria-label={`Editar orden de corte de ${job.vehicle}`}
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar la orden de corte para ${job.vehicle} y restituir ${job.metersUsed}m a la bobina ${job.rollCode}?`
                        )
                      ) {
                        onDeleteJob(job);
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '7px 9px' }}
                    title="Eliminar orden de corte"
                    aria-label={`Eliminar orden de corte de ${job.vehicle}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
