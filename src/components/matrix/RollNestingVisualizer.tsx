'use client';

import React from 'react';
import { PPFRoll, VehiclePanel, NestingResult } from '@/types/ppf';
import { Scissors, AlertCircle, CheckCircle2, TrendingUp, Layers } from 'lucide-react';

interface RollNestingVisualizerProps {
  selectedPanels: VehiclePanel[];
  nesting: NestingResult;
  billedLinearMeters: number;
  activeRoll?: PPFRoll | null;
  onSelectRoll?: (rollId: string) => void;
  availableRolls?: PPFRoll[];
}

export const RollNestingVisualizer: React.FC<RollNestingVisualizerProps> = ({
  selectedPanels,
  nesting,
  billedLinearMeters,
  activeRoll,
  onSelectRoll,
  availableRolls = [],
}) => {
  const rollTotalLength = activeRoll ? activeRoll.initialMeters : 15.0;
  const rollRemaining = activeRoll ? activeRoll.currentMeters : 15.0;
  const remainingAfterCut = Number(Math.max(0, rollRemaining - billedLinearMeters).toFixed(2));
  const isExceeded = billedLinearMeters > rollRemaining;

  return (
    <div
      style={{
        background: '#0d1017',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top Header & Metrics Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent-red)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Scissors style={{ width: 14, height: 14 }} />
              Simulador de Anidado en Bobina 1.52m (60")
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 600,
              }}
            >
              Rendimiento: {nesting.efficiencyPercent}%
            </span>
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            Distribución física y optimización sobre el rollo de film
          </h4>
        </div>

        {/* Workshop Stock Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          {/* Active Roll Selector */}
          {availableRolls.length > 0 && onSelectRoll && (
            <div style={{ background: '#07090e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '4px 10px' }}>
              <span style={{ color: '#626d7d', fontSize: '10px', display: 'block' }}>Bobina Asignada:</span>
              <select
                value={activeRoll?.id || ''}
                onChange={(e) => onSelectRoll(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {availableRolls.map((r) => (
                  <option key={r.id} value={r.id} style={{ background: '#12151e' }}>
                    {r.code} - {r.brand} ({r.currentMeters.toFixed(1)}m)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ background: '#07090e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '4px 10px' }}>
            <span style={{ color: '#626d7d', fontSize: '10px', display: 'block' }}>Disponible:</span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>{rollRemaining.toFixed(2)} m</span>
          </div>

          <div style={{ background: '#07090e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '4px 10px' }}>
            <span style={{ color: '#626d7d', fontSize: '10px', display: 'block' }}>Consumo Orden:</span>
            <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>-{billedLinearMeters.toFixed(2)} m</span>
          </div>

          <div style={{ background: '#07090e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '4px 10px' }}>
            <span style={{ color: '#626d7d', fontSize: '10px', display: 'block' }}>Remanente:</span>
            <span style={{ color: isExceeded ? '#ef4444' : '#10b981', fontWeight: 700 }}>
              {remainingAfterCut.toFixed(2)} m
            </span>
          </div>
        </div>
      </div>

      {/* Stock Exceeded Alert */}
      {isExceeded && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, color: '#ef4444' }} />
          <span>
            <strong>Capacidad insuficiente:</strong> Se requieren {billedLinearMeters.toFixed(2)}m y la bobina activa solo dispone de {rollRemaining.toFixed(2)}m. Se precisará una bobina adicional.
          </span>
        </div>
      )}

      {/* Physical Roll Diagram */}
      <div
        style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          background: '#07090e',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Ruler tick marks */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            color: '#626d7d',
            paddingBottom: '4px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span>0.0m (Comienzo Bobina)</span>
          <span>3.0m</span>
          <span>6.0m</span>
          <span>9.0m</span>
          <span>12.0m</span>
          <span>15.0m (Fin Bobina)</span>
        </div>

        {/* Physical Roll Strip */}
        <div
          style={{
            position: 'relative',
            height: '92px',
            width: '100%',
            background: '#0a0d14',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* Meter grid marks */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none', opacity: 0.15 }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} style={{ flex: 1, borderRight: '1px solid #ffffff' }} />
            ))}
          </div>

          {/* Placed Panels Strip */}
          {selectedPanels.length === 0 ? (
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#626d7d' }}>
              Selecciona paneles en la maqueta 3D o en el plano CAD para visualizar los cortes anidados en la bobina
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                height: '100%',
                width: `${Math.min(100, Math.max(12, (billedLinearMeters / rollTotalLength) * 100))}%`,
                borderRight: '2px solid var(--accent-red)',
              }}
            >
              {selectedPanels.map((panel, idx) => {
                const totalLen = selectedPanels.reduce((s, p) => s + p.cutLength, 0) || 1;
                const widthPct = (panel.cutLength / totalLen) * 100;
                const bgStyles = [
                  { bg: 'rgba(230, 25, 55, 0.35)', border: 'rgba(230, 25, 55, 0.7)', text: '#ffffff' },
                  { bg: 'rgba(184, 12, 37, 0.45)', border: 'rgba(230, 25, 55, 0.5)', text: '#ffb3bd' },
                  { bg: 'rgba(30, 41, 59, 0.65)', border: 'rgba(255, 255, 255, 0.2)', text: '#cbd5e1' },
                ];
                const style = bgStyles[idx % bgStyles.length];

                return (
                  <div
                    key={panel.id}
                    style={{
                      width: `${Math.max(6, widthPct)}%`,
                      height: '100%',
                      background: style.bg,
                      borderRight: `1px solid ${style.border}`,
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      transition: 'all 0.15s ease',
                    }}
                    title={`${panel.name} (${panel.cutLength}m x ${panel.cutWidth}m) - Dificultad: ${panel.difficulty}`}
                  >
                    <div style={{ fontSize: '9px', fontWeight: 700, color: style.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {panel.name}
                    </div>
                    <div style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: '#9aa4b2', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{panel.cutLength}m</span>
                      <span>{panel.cutWidth}m</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Roll Remainder Area */}
          <div
            style={{
              flex: 1,
              background: '#07090e',
              borderLeft: '1px dashed rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 12px',
            }}
          >
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#626d7d', textAlign: 'center' }}>
              Bobina remanente limpia: {remainingAfterCut.toFixed(2)}m
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '10px', color: '#626d7d', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(230, 25, 55, 0.5)', border: '1px solid var(--accent-red)' }} />
              Patrones de corte en bobina
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#0a0d14', border: '1px solid rgba(255,255,255,0.1)' }} />
              Film virgen en stock
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            Estándar Industrial: 1.52m ancho × 15.0m longitud (60" x 50ft)
          </span>
        </div>
      </div>
    </div>
  );
};
