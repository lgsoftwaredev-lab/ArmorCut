'use client';

import React, { useState } from 'react';
import { PPFRoll, PPFFinish, PPFRollStatus, CreateRollInput } from '@/types/ppf';
import { X, Save, Layers, Check } from 'lucide-react';
import { PlusCarsMonogram } from '@/components/brand/PlusCarsBrand';

interface NewRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rollData: CreateRollInput) => Promise<void>;
  editingRoll?: PPFRoll | null;
}

const FINISHES: { value: PPFFinish; label: string }[] = [
  { value: 'GLOSS', label: 'Gloss (Brillante Transparente)' },
  { value: 'MATTE', label: 'Matte (Satinado)' },
  { value: 'SATIN', label: 'Satin' },
  { value: 'BLACK_PIANO', label: 'Black Piano (Techos / Parantes)' },
  { value: 'WINDSHIELD', label: 'Parabrisas / Windshield Protection (120cm)' },
  { value: 'SMOKE_HEADLIGHT', label: 'Smoke / Ópticas Tintadas' },
  { value: 'OTHER', label: 'Otro / Especial' },
];

const RollModalContent: React.FC<{
  editingRoll?: PPFRoll | null;
  onClose: () => void;
  onSave: (rollData: CreateRollInput) => Promise<void>;
}> = ({ editingRoll, onClose, onSave }) => {
  const [code, setCode] = useState(() => editingRoll?.code || `KRYP-${Math.floor(10 + Math.random() * 90)}`);
  const [brand, setBrand] = useState(() => editingRoll?.brand || 'Kryptonite');
  const [model, setModel] = useState(() => editingRoll?.model || 'Ultra Gloss');
  const [finish, setFinish] = useState<PPFFinish>(() => editingRoll?.finish || 'GLOSS');
  const [widthMeters, setWidthMeters] = useState(() => editingRoll?.widthMeters ?? 1.56);
  const [initialMeters, setInitialMeters] = useState(() => editingRoll?.initialMeters ?? 15.0);
  const [currentMeters, setCurrentMeters] = useState(() => editingRoll?.currentMeters ?? 15.0);
  const [costPerRoll, setCostPerRoll] = useState(() => editingRoll?.costPerRoll ?? 1300);
  const [location, setLocation] = useState(() => editingRoll?.location || 'Rack Principal');
  const [batchNumber, setBatchNumber] = useState(() => editingRoll?.batchNumber || '');
  const [status, setStatus] = useState<PPFRollStatus>(() => editingRoll?.status || 'ACTIVE');
  const [notes, setNotes] = useState(() => editingRoll?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset selector for Kryptonite
  const selectPreset = (type: 'BODY' | 'WINDSHIELD') => {
    if (type === 'BODY') {
      setWidthMeters(1.56);
      setInitialMeters(15.0);
      setCurrentMeters(15.0);
      setFinish('GLOSS');
      setModel('Ultra Gloss');
    } else {
      setWidthMeters(1.20);
      setInitialMeters(15.0);
      setCurrentMeters(15.0);
      setFinish('WINDSHIELD');
      setModel('Windshield Armor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !brand.trim()) {
      alert('Por favor completa el código y marca.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        code: code.trim().toUpperCase(),
        brand: brand.trim(),
        model: model.trim(),
        finish,
        widthMeters: Number(widthMeters),
        initialMeters: Number(initialMeters),
        currentMeters: Number(currentMeters),
        costPerRoll: Number(costPerRoll),
        currency: 'USD',
        location: location.trim() || 'Taller',
        batchNumber: batchNumber.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error saving roll:', err);
      alert('Error al guardar la bobina.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '12px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(230, 25, 55, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Layers size={20} color="var(--accent-red)" />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {editingRoll ? 'Editar Bobina de PPF' : 'Dar de Alta Bobina Kryptonite'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <PlusCarsMonogram height={22} style={{ opacity: 0.85 }} />
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Quick Preset Selector */}
          {!editingRoll && (
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ marginBottom: '6px' }}>Formato Rápido Kryptonite</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => selectPreset('BODY')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: widthMeters === 1.56 ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                    background: widthMeters === 1.56 ? 'rgba(230, 25, 55, 0.15)' : 'var(--bg-input)',
                    color: widthMeters === 1.56 ? 'var(--accent-red)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong>🚘 Carrocería Estándar</strong>
                    {widthMeters === 1.56 && <Check size={14} />}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>156 cm ancho × 15 mts</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectPreset('WINDSHIELD')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: widthMeters === 1.20 ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                    background: widthMeters === 1.20 ? 'rgba(230, 25, 55, 0.15)' : 'var(--bg-input)',
                    color: widthMeters === 1.20 ? 'var(--accent-red)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong>🪟 Vidrios Parabrisas</strong>
                    {widthMeters === 1.20 && <Check size={14} />}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>120 cm ancho × 15 mts</span>
                </button>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Código / Identificador *</label>
              <input
                type="text"
                className="form-input mono"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: KRYP-GL-01"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Marca *</label>
              <input
                type="text"
                className="form-input"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Modelo / Gama</label>
              <input
                type="text"
                className="form-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ultra Gloss, Satin Matte, etc."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Acabado / Terminación *</label>
              <select
                className="form-select"
                value={finish}
                onChange={(e) => setFinish(e.target.value as PPFFinish)}
              >
                {FINISHES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ancho de la Bobina</label>
              <select
                className="form-select mono"
                value={widthMeters}
                onChange={(e) => setWidthMeters(Number(e.target.value))}
              >
                <option value={1.56}>1.56 m (156 cm - Carrocería Kryptonite)</option>
                <option value={1.20}>1.20 m (120 cm - Parabrisas Kryptonite)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Metros Iniciales</label>
              <input
                type="number"
                step="0.5"
                min="1"
                className="form-input mono"
                value={initialMeters}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setInitialMeters(val);
                  if (!editingRoll) setCurrentMeters(val);
                }}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Metros Restantes Disponibles *</label>
              <input
                type="number"
                step="0.05"
                min="0"
                className="form-input mono"
                value={currentMeters}
                onChange={(e) => setCurrentMeters(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Costo Total del Rollo (USD)</label>
              <input
                type="number"
                step="1"
                min="0"
                className="form-input mono"
                value={costPerRoll}
                onChange={(e) => setCostPerRoll(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ubicación en Taller</label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Rack A - Nivel 1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lote de Fabricación (Opcional)</label>
              <input
                type="text"
                className="form-input"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Ej: KRYP-2026-A1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Estado de la Bobina</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as PPFRollStatus)}
              >
                <option value="ACTIVE">Activa (En Uso en Taller)</option>
                <option value="SEALED">Sellada / Cerrada en Depósito</option>
                <option value="DEPLETED">Agotada / Descartada</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notas Adicionales</label>
              <input
                type="text"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Comentarios o uso previsto"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-card)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Guardando...' : editingRoll ? 'Guardar Cambios' : 'Registrar Bobina Kryptonite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const NewRollModal: React.FC<NewRollModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRoll,
}) => {
  if (!isOpen) return null;
  return (
    <RollModalContent
      key={editingRoll?.id || 'new-roll'}
      editingRoll={editingRoll}
      onClose={onClose}
      onSave={onSave}
    />
  );
};
