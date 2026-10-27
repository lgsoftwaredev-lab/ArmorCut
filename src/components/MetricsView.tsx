'use client';

import React from 'react';
import { TrendingUp, Users, DollarSign, Layers, AlertCircle, CheckCircle, Car } from 'lucide-react';
import { PPFStats, InstallerStat, PPFRoll } from '@/types/ppf';

interface MetricsViewProps {
  stats: PPFStats;
}

export const MetricsView: React.FC<MetricsViewProps> = ({ stats }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4 Top KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {/* Card 1: Stock Total */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Stock Total Activo
            </span>
            <Layers size={18} color="var(--accent-red)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-red)' }}>
            {stats.totalStockMeters} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>m</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {stats.activeRolls} bobinas en uso ({stats.sealedRolls} cerradas)
          </div>
        </div>

        {/* Card 2: Metros Cortados / Salientes */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Metros Cortados
            </span>
            <TrendingUp size={18} color="var(--color-success)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {stats.totalMetersUsed} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>m</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Material instalado en vehículos
          </div>
        </div>

        {/* Card 3: Trabajos / Cortes Registrados */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Vehículos / Cortes
            </span>
            <Car size={18} color="#ffffff" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            {stats.totalJobsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Instalaciones despachadas
          </div>
        </div>

        {/* Card 4: Valor del Inventario */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Valor Estimado Stock
            </span>
            <DollarSign size={18} color="var(--accent-red)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            ${stats.estimatedInventoryValue.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Capital en bobinas disponibles
          </div>
        </div>
      </div>

      {/* Two Columns: Cortes por Instalador & Alertas de Reposición */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
      }}>
        {/* Col 1: Cortes por Instalador */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Users size={20} color="var(--accent-red)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Cortes por Instalador
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Volumen de material cortado y cantidad de trabajos realizados por cada miembro del equipo.
          </p>

          {stats.installerStats.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aún no hay trabajos registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.installerStats.map((item: InstallerStat, idx: number) => {
                const percentOfTotal = stats.totalMetersUsed > 0
                  ? Math.round((item.metersUsed / stats.totalMetersUsed) * 100)
                  : 0;

                return (
                  <div
                    key={item.name}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: idx === 0 ? 'rgba(230, 25, 55, 0.2)' : 'var(--bg-card)',
                          border: idx === 0 ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: idx === 0 ? 'var(--accent-red)' : 'var(--text-secondary)',
                        }}>
                          #{idx + 1}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.jobsCount} {item.jobsCount === 1 ? 'corte registrado' : 'cortes registrados'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-red)' }}>
                          {item.metersUsed} m
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {percentOfTotal}% del total
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '5px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${percentOfTotal}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #b80c25 0%, #ff1a3c 100%)',
                        borderRadius: '3px',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Col 2: Alertas de Stock Crítico / Reposición */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <AlertCircle size={20} color="var(--accent-red)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Alertas de Stock & Reposición
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Bobinas con menos de 3 metros remanentes que requieren pedido inmediato al proveedor.
          </p>

          {stats.lowStockRolls.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 16px',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
            }}>
              <CheckCircle size={32} color="var(--color-success)" style={{ marginBottom: '8px' }} />
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Stock saludable en todas las bobinas
              </strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                Ninguna bobina activa tiene menos de 3 metros remanentes.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.lowStockRolls.map((roll: PPFRoll) => (
                <div
                  key={roll.id}
                  style={{
                    background: 'rgba(230, 25, 55, 0.05)',
                    border: '1px solid rgba(230, 25, 55, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span className="mono" style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--accent-red)',
                        background: 'rgba(230, 25, 55, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}>
                        {roll.code}
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {roll.brand} {roll.model}
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ubicación: {roll.location || 'Sin asignar'} • Ancho: {roll.widthMeters}m
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>
                      {roll.currentMeters.toFixed(1)} m
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>
                      ¡Pedir al proveedor!
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
