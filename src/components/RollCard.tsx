'use client';

import React from 'react';
import { PPFRoll, PPFFinish } from '@/types/ppf';
import { Scissors, Edit2, Trash2 } from 'lucide-react';

interface RollCardProps {
  roll: PPFRoll;
  lowStockThreshold?: number;
  onRecordJobForRoll: (roll: PPFRoll) => void;
  onEditRoll: (roll: PPFRoll) => void;
  onDeleteRoll: (rollId: string) => void;
}

const getFinishLabel = (finish: PPFFinish): string => {
  switch (finish) {
    case 'GLOSS':
      return 'Gloss';
    case 'MATTE':
      return 'Matte';
    case 'SATIN':
      return 'Satin';
    case 'BLACK_PIANO':
      return 'Black Piano';
    case 'SMOKE_HEADLIGHT':
      return 'Smoke';
    case 'WINDSHIELD':
      return 'Windshield';
    default:
      return finish;
  }
};

export const RollCard: React.FC<RollCardProps> = ({
  roll,
  lowStockThreshold = 3.0,
  onRecordJobForRoll,
  onEditRoll,
  onDeleteRoll,
}) => {
  const finishLabel = getFinishLabel(roll.finish);
  const percentRemaining =
    roll.initialMeters > 0
      ? Math.max(0, Math.min(100, Math.round((roll.currentMeters / roll.initialMeters) * 100)))
      : 0;

  const isLowStock =
    roll.status === 'ACTIVE' && roll.currentMeters <= lowStockThreshold && roll.currentMeters > 0;
  const isDepleted = roll.status === 'DEPLETED' || roll.currentMeters <= 0;

  let barColor = 'var(--text-primary)';
  if (isDepleted) {
    barColor = 'var(--color-danger)';
  } else if (isLowStock) {
    barColor = 'var(--color-warning)';
  }

  const costPerMeter =
    roll.initialMeters > 0 ? (roll.costPerRoll / roll.initialMeters).toFixed(1) : '0';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: isLowStock
          ? '1px solid rgba(245, 158, 11, 0.4)'
          : '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
        transition: 'border-color var(--transition-fast)',
      }}
    >
      {/* Top Row: Code, Finish & Status */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="mono"
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--bg-surface)',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
              }}
            >
              {roll.code}
            </span>
            <span
              className="mono"
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              {finishLabel}
            </span>
          </div>

          <div>
            {roll.status === 'ACTIVE' && <span className="badge badge-active">Activa</span>}
            {roll.status === 'SEALED' && <span className="badge badge-sealed">Sellada</span>}
            {isDepleted && <span className="badge badge-depleted">Agotada</span>}
          </div>
        </div>

        {/* Brand & Model */}
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}
        >
          {roll.brand}{' '}
          <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{roll.model}</span>
        </h3>

        {/* Technical Metadata */}
        <div
          className="mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px 10px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>{roll.location || 'Taller'}</span>
          <span>·</span>
          <span>
            {roll.widthMeters}m ({Math.round(roll.widthMeters * 39.37)}&quot;)
          </span>
          {roll.batchNumber && (
            <>
              <span>·</span>
              <span>Lote {roll.batchNumber}</span>
            </>
          )}
        </div>
      </div>

      {/* Roll Remanente Meter Gauge */}
      <div
        style={{
          paddingTop: '14px',
          paddingBottom: '14px',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              className="mono"
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: isLowStock ? 'var(--color-warning)' : 'var(--text-primary)',
              }}
            >
              {roll.currentMeters.toFixed(2)}m
            </span>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              / {roll.initialMeters.toFixed(1)}m
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              className="mono"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isLowStock
                  ? 'var(--color-warning)'
                  : isDepleted
                  ? 'var(--color-danger)'
                  : 'var(--text-secondary)',
              }}
            >
              {percentRemaining}%
            </span>
            <span
              className="mono"
              style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}
            >
              ${costPerMeter}/m
            </span>
          </div>
        </div>

        {/* Clean Monochrome Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'var(--bg-surface)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentRemaining}%`,
              height: '100%',
              background: barColor,
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onRecordJobForRoll(roll)}
          disabled={isDepleted}
          className="btn btn-secondary"
          style={{
            flex: 1,
            opacity: isDepleted ? 0.4 : 1,
            cursor: isDepleted ? 'not-allowed' : 'pointer',
          }}
        >
          <Scissors size={14} />
          <span>Registrar Corte</span>
        </button>

        <button
          onClick={() => onEditRoll(roll)}
          className="btn btn-secondary"
          title="Editar bobina"
          style={{ padding: '8px 10px' }}
        >
          <Edit2 size={13} />
        </button>

        <button
          onClick={() => {
            if (confirm(`¿Eliminar la bobina ${roll.code} (${roll.brand})?`)) {
              onDeleteRoll(roll.id);
            }
          }}
          className="btn btn-danger"
          title="Eliminar bobina"
          style={{ padding: '8px 10px' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
