'use client';

import React from 'react';
import { PPFRoll, VehiclePanel, NestingResult } from '@/types/ppf';
import { AlertCircle } from 'lucide-react';

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
        background: 'var(--bg-card)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="mono"
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            Anidado en Bobina 1.52m
          </span>
          <span
            className="mono"
            style={{
              fontSize: '0.68rem',
              padding: '1px 6px',
              borderRadius: '3px',
              background: 'var(--bg-surface)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-card)',
            }}
          >
            Eficiencia {nesting.efficiencyPercent}%
          </span>
        </div>

        {/* Roll Telemetry */}
        <div
          className="mono"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.72rem',
          }}
        >
          {availableRolls.length > 0 && onSelectRoll && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bobina:</span>
              <select
                value={activeRoll?.id || ''}
                onChange={(e) => onSelectRoll(e.target.value)}
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  outline: 'none',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                {availableRolls.map((r) => (
                  <option key={r.id} value={r.id} style={{ background: '#12141a' }}>
                    {r.code} · {r.brand} ({r.currentMeters.toFixed(1)}m)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Disp: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{rollRemaining.toFixed(2)}m</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Corte: </span>
            <strong style={{ color: 'var(--text-primary)' }}>-{billedLinearMeters.toFixed(2)}m</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Resto: </span>
            <strong style={{ color: isExceeded ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {remainingAfterCut.toFixed(2)}m
            </strong>
          </div>
        </div>
      </div>

      {isExceeded && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={14} color="#ef4444" />
          <span>
            Stock insuficiente en bobina seleccionada ({rollRemaining.toFixed(2)}m disponibles para{' '}
            {billedLinearMeters.toFixed(2)}m requeridos).
          </span>
        </div>
      )}

      {/* Physical Roll Diagram */}
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-main)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div
          className="mono"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>0.0m</span>
          <span>3.0m</span>
          <span>6.0m</span>
          <span>9.0m</span>
          <span>12.0m</span>
          <span>15.0m</span>
        </div>

        <div
          style={{
            position: 'relative',
            height: '68px',
            width: '100%',
            background: 'var(--bg-surface)',
            borderRadius: '4px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              pointerEvents: 'none',
              opacity: 0.08,
            }}
          >
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} style={{ flex: 1, borderRight: '1px solid #ffffff' }} />
            ))}
          </div>

          {selectedPanels.length === 0 ? (
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              Sin piezas seleccionadas
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

                return (
                  <div
                    key={panel.id}
                    style={{
                      width: `${Math.max(6, widthPct)}%`,
                      height: '100%',
                      background: idx % 2 === 0 ? '#181b23' : '#14171e',
                      borderRight: '1px solid var(--border-highlight)',
                      padding: '5px 7px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                    }}
                    title={`${panel.name} (${panel.cutLength}m × ${panel.cutWidth}m)`}
                  >
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                    >
                      {panel.name}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {panel.cutLength}m
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              flex: 1,
              background: 'var(--bg-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 12px',
            }}
          >
            <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Remanente: {remainingAfterCut.toFixed(2)}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
