'use client';

import React, { useState } from 'react';
import { PPFOffcut, PPFRoll } from '@/types/ppf';
import { Layers, Plus, CheckCircle, Trash2, MapPin } from 'lucide-react';

interface OffcutsViewProps {
  offcuts: PPFOffcut[];
  rolls: PPFRoll[];
  onAddOffcut: (offcutData: Omit<PPFOffcut, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateStatus: (id: string, status: 'AVAILABLE' | 'USED' | 'DISCARDED') => Promise<void>;
  onDeleteOffcut: (id: string) => Promise<void>;
}

export const OffcutsView: React.FC<OffcutsViewProps> = ({
  offcuts,
  rolls,
  onAddOffcut,
  onUpdateStatus,
  onDeleteOffcut,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'USED'>('AVAILABLE');

  // New offcut form state
  const [parentRollId, setParentRollId] = useState(rolls[0]?.id || '');
  const [widthCm, setWidthCm] = useState(45);
  const [lengthCm, setLengthCm] = useState(100);
  const [storageLocation, setStorageLocation] = useState('Cajón 1 - Retazos');
  const [suggestedUse, setSuggestedUse] = useState('Espejos, manijas, pantallas');
  const [notes, setNotes] = useState('');

  const filteredOffcuts = offcuts.filter((o) => {
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  const availableCount = offcuts.filter((o) => o.status === 'AVAILABLE').length;
  const usedCount = offcuts.filter((o) => o.status === 'USED').length;

  // Total square meters of available offcuts: (w/100 * l/100)
  const totalM2Available = offcuts
    .filter((o) => o.status === 'AVAILABLE')
    .reduce((acc, o) => acc + (o.widthCm / 100) * (o.lengthCm / 100), 0)
    .toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const roll = rolls.find((r) => r.id === parentRollId) || rolls[0];
    if (!roll) {
      alert('Debes seleccionar una bobina de referencia');
      return;
    }

    await onAddOffcut({
      parentRollId: roll.id,
      parentRollCode: roll.code,
      brand: roll.brand,
      finish: roll.finish,
      widthCm: Number(widthCm),
      lengthCm: Number(lengthCm),
      storageLocation: storageLocation.trim() || 'Cajón de Retazos',
      suggestedUse: suggestedUse.trim() || 'Piezas chicas',
      status: 'AVAILABLE',
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Top Banner & Stats */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={22} color="var(--accent-cyan)" />
            <span>Banco de Retazos Sobrantes Aprovechables</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Evita cortar una bobina entera para piezas pequeñas usando sobrantes limpios de trabajos previos.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
            <button
              onClick={() => setFilterStatus('AVAILABLE')}
              style={{
                background: filterStatus === 'AVAILABLE' ? 'var(--bg-card-hover)' : 'transparent',
                color: filterStatus === 'AVAILABLE' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Disponibles ({availableCount})
            </button>
            <button
              onClick={() => setFilterStatus('USED')}
              style={{
                background: filterStatus === 'USED' ? 'var(--bg-card-hover)' : 'transparent',
                color: filterStatus === 'USED' ? 'var(--color-success)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reutilizados ({usedCount})
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              style={{
                background: filterStatus === 'ALL' ? 'var(--bg-card-hover)' : 'transparent',
                color: filterStatus === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Todos ({offcuts.length})
            </button>
          </div>

          <div style={{
            fontSize: '0.78rem',
            color: 'var(--accent-cyan)',
            background: 'rgba(0, 240, 255, 0.08)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            fontWeight: 600,
          }}>
            📐 {totalM2Available} m² útiles
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>+ Nuevo Retazo</span>
          </button>
        </div>
      </div>

      {/* Grid of Offcut Cards */}
      {filteredOffcuts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-card)',
        }}>
          <Layers size={36} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>No hay retazos en esta categoría</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Cada vez que registres un corte de auto, puedes tildar &quot;Generó retazo sobrante&quot; para guardarlo aquí.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {filteredOffcuts.map((offcut) => {
            const isAvailable = offcut.status === 'AVAILABLE';
            return (
              <div
                key={offcut.id}
                style={{
                  background: 'var(--bg-card)',
                  border: isAvailable ? '1px solid var(--border-card)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  opacity: isAvailable ? 1 : 0.65,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="mono" style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)',
                      background: 'rgba(0, 240, 255, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {offcut.parentRollCode}
                    </span>
                    <span className={`badge ${isAvailable ? 'badge-active' : 'badge-sealed'}`}>
                      {isAvailable ? 'Disponible' : 'Utilizado'}
                    </span>
                  </div>

                  {/* Dimensions Box */}
                  <div style={{
                    background: 'var(--bg-surface)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '10px',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                      Medidas del Retazo
                    </span>
                    <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {offcut.widthCm} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>x</span> {offcut.lengthCm} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>cm</span>
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <strong>{offcut.brand}</strong> ({offcut.finish})
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {offcut.storageLocation}
                  </div>

                  {offcut.suggestedUse && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent-cyan)',
                      marginTop: '6px',
                      background: 'rgba(0, 240, 255, 0.05)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}>
                      💡 {offcut.suggestedUse}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  {isAvailable ? (
                    <button
                      onClick={() => onUpdateStatus(offcut.id, 'USED')}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <CheckCircle size={14} />
                      <span>Marcar como Usado</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(offcut.id, 'AVAILABLE')}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <span>Volver a Disponible</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este retazo?')) onDeleteOffcut(offcut.id);
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '6px 8px' }}
                    title="Eliminar retazo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Offcut Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-card)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Registrar Retazo Sobrante</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '16px 20px' }}>
              <div className="form-group">
                <label className="form-label">Bobina de Origen</label>
                <select
                  className="form-select mono"
                  value={parentRollId}
                  onChange={(e) => setParentRollId(e.target.value)}
                >
                  {rolls.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.code}] {r.brand} {r.model} ({r.finish})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ancho (cm) *</label>
                  <input
                    type="number"
                    min="5"
                    className="form-input mono"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Largo (cm) *</label>
                  <input
                    type="number"
                    min="5"
                    className="form-input mono"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ubicación en Taller</label>
                <input
                  type="text"
                  className="form-input"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  placeholder="Ej: Cajón 1 - Retazos Capot"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Uso Sugerido</label>
                <input
                  type="text"
                  className="form-input"
                  value={suggestedUse}
                  onChange={(e) => setSuggestedUse(e.target.value)}
                  placeholder="Espejos retrovisores, manijas, pantallas interiores"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas Adicionales</label>
                <input
                  type="text"
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre el retazo o estado"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Retazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
