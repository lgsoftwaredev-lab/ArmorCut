'use client';

import React from 'react';
import { PPFStats, InstallerStat, PPFRoll } from '@/types/ppf';

interface MetricsViewProps {
  stats: PPFStats;
}

export const MetricsView: React.FC<MetricsViewProps> = ({ stats }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Section Header */}
      <div className="section-header" style={{ marginBottom: 0 }}>
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
            TELEMETRÍA DE TALLER
          </div>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>
            Métricas & Rendimiento
          </h1>
        </div>
      </div>

      {/* Editorial Telemetry Strip (Focal Point instead of 4 identical AI cards) */}
      <div className="telemetry-strip">
        <div className="telemetry-cell">
          <span
            className="mono"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Stock Disponible
          </span>
          <div
            className="mono"
            style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            {stats.totalStockMeters}
            <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', marginLeft: '4px' }}>
              m
            </span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {stats.activeRolls} bobinas activas · {stats.sealedRolls} en depósito
          </span>
        </div>

        <div className="telemetry-cell">
          <span
            className="mono"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Material Cortado
          </span>
          <div
            className="mono"
            style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            {stats.totalMetersUsed}
            <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', marginLeft: '4px' }}>
              m
            </span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Consumo histórico acumulado
          </span>
        </div>

        <div className="telemetry-cell">
          <span
            className="mono"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Órdenes Cerradas
          </span>
          <div
            className="mono"
            style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            {stats.totalJobsCount}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Vehículos intervenidos
          </span>
        </div>

        <div className="telemetry-cell">
          <span
            className="mono"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Capital en Stock
          </span>
          <div
            className="mono"
            style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            ${stats.estimatedInventoryValue.toLocaleString()}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: '6px' }}>
              USD
            </span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Valoración de inventario activo
          </span>
        </div>
      </div>

      {/* Two Asymmetric Operational Panels */}
      <div className="metrics-details-grid">
        {/* Col 1: Instaladores */}
        <section
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              paddingBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
              Consumo por Instalador
            </h2>
            <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {stats.installerStats.length} operadores
            </span>
          </div>

          {stats.installerStats.length === 0 ? (
            <div style={{ padding: 'var(--space-6) 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Sin registros de corte.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {stats.installerStats.map((item: InstallerStat) => {
                const percentOfTotal =
                  stats.totalMetersUsed > 0
                    ? Math.round((item.metersUsed / stats.totalMetersUsed) * 100)
                    : 0;

                return (
                  <div
                    key={item.name}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                          {item.name}
                        </strong>
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                            marginLeft: '8px',
                          }}
                        >
                          {item.jobsCount} {item.jobsCount === 1 ? 'orden' : 'órdenes'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {item.metersUsed}m
                        </span>
                        <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          ({percentOfTotal}%)
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '3px',
                        background: 'var(--bg-card)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percentOfTotal}%`,
                          height: '100%',
                          background: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Col 2: Reposición Crítica */}
        <section
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              paddingBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
              Alertas de Reposición (&lt; 3.0m)
            </h2>
            <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {stats.lowStockRolls.length} alertas
            </span>
          </div>

          {stats.lowStockRolls.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-8) var(--space-4)',
                textAlign: 'center',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <strong
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Stock operativo sin alertas
              </strong>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Todas las bobinas activas superan los 3.0 metros remanentes.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {stats.lowStockRolls.map((roll: PPFRoll) => (
                <div
                  key={roll.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {roll.code}
                      </span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        {roll.brand} {roll.model}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {roll.location || 'Taller'} · {roll.widthMeters}m
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="mono"
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 700,
                        color: 'var(--color-warning)',
                      }}
                    >
                      {roll.currentMeters.toFixed(1)}m
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
