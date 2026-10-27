'use client';

import { TrendingUp, AlertTriangle, Users, DollarSign, PieChart, Layers } from 'lucide-react';
import { PPFStats, InstallerStat } from '@/types/ppf';

interface MetricsViewProps {
  stats: PPFStats;
}

const REASON_LABELS: { [key: string]: string } = {
  CONTAMINATION: 'Polvo / Pelusa / Contaminación',
  STRETCH_TEAR: 'Estiramiento excesivo / Tensión',
  CUTTING_ERROR: 'Error de corte en plotter/manual',
  SILVERING_ADHESIVE: 'Silvering / Huellas adhesivo',
  INSTALLATION_ERROR: 'Error técnico de colocación',
  DEFECTIVE_MATERIAL: 'Defecto de fábrica en film',
  OTHER: 'Otros motivos',
};

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
            <Layers size={18} color="var(--accent-cyan)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {stats.totalStockMeters} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>m</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Valor estimado: ~${stats.estimatedInventoryValue} USD
          </div>
        </div>

        {/* Card 2: Metros Consumidos */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Metros Instalados
            </span>
            <TrendingUp size={18} color="var(--color-success)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {stats.totalMetersUsed} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>m</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Aplicados exitosamente en vehículos
          </div>
        </div>

        {/* Card 3: Scrap Rate % */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Tasa de Merma (Scrap)
            </span>
            <AlertTriangle size={18} color={stats.overallScrapRate > 10 ? 'var(--color-danger)' : 'var(--color-warning)'} />
          </div>
          <div className="mono" style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: stats.overallScrapRate > 10 ? 'var(--color-danger)' : stats.overallScrapRate > 5 ? 'var(--color-warning)' : 'var(--color-success)',
          }}>
            {stats.overallScrapRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Total scrap: <strong>{stats.totalMetersScrap} m</strong>
          </div>
        </div>

        {/* Card 4: Cost Wasted */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Pérdida Económica Scrap
            </span>
            <DollarSign size={18} color="var(--color-danger)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171' }}>
            ${stats.totalScrapCostWasted} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Costo directo de film descartado
          </div>
        </div>
      </div>

      {/* Two Columns: Installer Leaderboard & Scrap Causes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
      }}>
        {/* Installer Performance Leaderboard */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Users size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Control de Merma por Instalador
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Permite medir la prolijidad técnica, reducir costos y premiar la menor tasa de desperdicio.
          </p>

          {stats.installerStats.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aún no hay trabajos registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.installerStats.map((item: InstallerStat, idx: number) => {
                const isTopPro = item.wasteRatePercent < 5;
                const isHighWaste = item.wasteRatePercent > 10;
                return (
                  <div
                    key={item.name}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'rgba(0, 240, 255, 0.2)' : 'var(--bg-card)',
                        border: idx === 0 ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: idx === 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      }}>
                        #{idx + 1}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.jobsCount} trabajos • {item.metersUsed}m instalados
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: isTopPro ? 'var(--color-success)' : isHighWaste ? 'var(--color-danger)' : 'var(--color-warning)',
                      }}>
                        {item.wasteRatePercent}% merma
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.metersScrap}m scrap (${item.costWasted} USD)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrap Causes Breakdown */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <PieChart size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Causas Principales de Scrap
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Identifica qué errores provocan mayor pérdida de material en el taller.
          </p>

          {Object.keys(stats.scrapReasonsMap).length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No se han registrado roturas de film.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(stats.scrapReasonsMap).map(([reason, data]: [string, { count: number; meters: number }]) => {
                const label = REASON_LABELS[reason] || reason;
                const percentOfTotalScrap = stats.totalMetersScrap > 0
                  ? Math.round((data.meters / stats.totalMetersScrap) * 100)
                  : 0;

                return (
                  <div key={reason}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {data.meters.toFixed(2)}m ({percentOfTotalScrap}%)
                      </span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${percentOfTotalScrap}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)',
                        borderRadius: '3px',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
