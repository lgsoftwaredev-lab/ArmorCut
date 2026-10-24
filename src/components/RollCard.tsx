'use client';

import React from 'react';
import { PPFRoll, PPFFinish } from '@/types/ppf';
import { Scissors, Edit2, Trash2, MapPin, Tag, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface RollCardProps {
  roll: PPFRoll;
  lowStockThreshold?: number;
  onRecordJobForRoll: (roll: PPFRoll) => void;
  onEditRoll: (roll: PPFRoll) => void;
  onDeleteRoll: (rollId: string) => void;
}

const getFinishLabel = (finish: PPFFinish): { label: string; className: string } => {
  switch (finish) {
    case 'GLOSS':
      return { label: 'Gloss (Brillante)', className: 'badge-finish-gloss' };
    case 'MATTE':
      return { label: 'Matte (Satinado)', className: 'badge-finish-matte' };
    case 'SATIN':
      return { label: 'Satin', className: 'badge-finish-matte' };
    case 'BLACK_PIANO':
      return { label: 'Black Piano', className: 'badge-finish-black' };
    case 'SMOKE_HEADLIGHT':
      return { label: 'Smoke / Ópticas', className: 'badge-finish-gloss' };
    case 'WINDSHIELD':
      return { label: 'Windshield Protection', className: 'badge-finish-gloss' };
    default:
      return { label: finish, className: 'badge-finish-gloss' };
  }
};

export const RollCard: React.FC<RollCardProps> = ({
  roll,
  lowStockThreshold = 3.0,
  onRecordJobForRoll,
  onEditRoll,
  onDeleteRoll,
}) => {
  const finishInfo = getFinishLabel(roll.finish);
  const percentRemaining = roll.initialMeters > 0
    ? Math.max(0, Math.min(100, Math.round((roll.currentMeters / roll.initialMeters) * 100)))
    : 0;

  const isLowStock = roll.status === 'ACTIVE' && roll.currentMeters <= lowStockThreshold && roll.currentMeters > 0;
  const isDepleted = roll.status === 'DEPLETED' || roll.currentMeters <= 0;

  // Gauge bar color
  let gaugeColor = 'linear-gradient(90deg, #10b981 0%, #00f0ff 100%)';
  if (isDepleted) {
    gaugeColor = 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)';
  } else if (isLowStock || percentRemaining < 25) {
    gaugeColor = 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)';
  } else if (percentRemaining < 50) {
    gaugeColor = 'linear-gradient(90deg, #00f0ff 0%, #f59e0b 100%)';
  }

  const costPerMeter = roll.initialMeters > 0 ? (roll.costPerRoll / roll.initialMeters).toFixed(1) : '0';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: isLowStock ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '16px',
      position: 'relative',
      boxShadow: isLowStock ? '0 4px 20px rgba(245, 158, 11, 0.1)' : 'var(--shadow-md)',
      transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
    }}>
      {/* Top Header: Code, Brand & Status */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mono" style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--accent-cyan)',
              background: 'rgba(0, 240, 255, 0.1)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
            }}>
              {roll.code}
            </span>
            <span className={`badge ${finishInfo.className}`}>
              {finishInfo.label}
            </span>
          </div>

          <div>
            {roll.status === 'ACTIVE' && (
              <span className="badge badge-active">
                <CheckCircle2 size={12} /> En Uso
              </span>
            )}
            {roll.status === 'SEALED' && (
              <span className="badge badge-sealed">
                <Clock size={12} /> Sellada
              </span>
            )}
            {isDepleted && (
              <span className="badge badge-depleted">
                <AlertCircle size={12} /> Agotada
              </span>
            )}
          </div>
        </div>

        {/* Brand & Model */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {roll.brand} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{roll.model}</span>
        </h3>

        {/* Location & Width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} /> {roll.location || 'Taller'}
          </span>
          <span>•</span>
          <span>Ancho: <strong style={{ color: 'var(--text-secondary)' }}>{roll.widthMeters}m ({Math.round(roll.widthMeters * 39.37)}&quot;)</strong></span>
          {roll.batchNumber && (
            <>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Tag size={12} /> {roll.batchNumber}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Visual Roll Life Progress / Gauge */}
      <div style={{
        background: 'var(--bg-surface)',
        padding: '14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Metros Disponibles
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: isLowStock ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                {roll.currentMeters.toFixed(2)}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {roll.initialMeters.toFixed(1)} m</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="mono" style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: isLowStock ? 'var(--color-warning)' : isDepleted ? 'var(--color-danger)' : 'var(--accent-cyan)',
            }}>
              {percentRemaining}%
            </span>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ~${costPerMeter}/m
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            width: `${percentRemaining}%`,
            height: '100%',
            background: gaugeColor,
            borderRadius: '4px',
            transition: 'width 0.4s ease-out',
            boxShadow: isLowStock ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none',
          }} />
        </div>

        {isLowStock && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            fontSize: '0.75rem',
            color: 'var(--color-warning)',
            fontWeight: 600,
          }}>
            <AlertCircle size={13} />
            <span>Bobina por agotarse (menos de {lowStockThreshold}m restantes)</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
        <button
          onClick={() => onRecordJobForRoll(roll)}
          disabled={isDepleted}
          className="btn btn-primary"
          style={{
            flex: 1,
            opacity: isDepleted ? 0.4 : 1,
            cursor: isDepleted ? 'not-allowed' : 'pointer',
          }}
        >
          <Scissors size={15} />
          <span>Descontar Corte</span>
        </button>

        <button
          onClick={() => onEditRoll(roll)}
          className="btn btn-secondary"
          title="Editar bobina"
          style={{ padding: '8px 10px' }}
        >
          <Edit2 size={14} />
        </button>

        <button
          onClick={() => {
            if (confirm(`¿Estás seguro de eliminar la bobina ${roll.code} (${roll.brand})?`)) {
              onDeleteRoll(roll.id);
            }
          }}
          className="btn btn-danger"
          title="Eliminar bobina"
          style={{ padding: '8px 10px' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
