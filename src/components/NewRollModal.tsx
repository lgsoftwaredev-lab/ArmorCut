'use client';

import React, { useState, useEffect } from 'react';
import { PPFRoll, PPFFinish, PPFRollStatus } from '@/types/ppf';
import { X, Save, Layers, Check } from 'lucide-react';

interface NewRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rollData: any) => Promise<void>;
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

export const NewRollModal: React.FC<NewRollModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRoll,
}) => {
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('Kryptonite');
  const [model, setModel] = useState('Ultra Gloss');
  const [finish, setFinish] = useState<PPFFinish>('GLOSS');
  const [widthMeters, setWidthMeters] = useState(1.56);
  const [initialMeters, setInitialMeters] = useState(15.0);
  const [currentMeters, setCurrentMeters] = useState(15.0);
  const [costPerRoll, setCostPerRoll] = useState(1300);
  const [location, setLocation] = useState('Rack A');
  const [batchNumber, setBatchNumber] = useState('');
  const [status, setStatus] = useState<PPFRollStatus>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRoll) {
      setCode(editingRoll.code);
      setBrand(editingRoll.brand || 'Kryptonite');
      setModel(editingRoll.model);
      setFinish(editingRoll.finish);
      setWidthMeters(editingRoll.widthMeters);
      setInitialMeters(editingRoll.initialMeters);
      setCurrentMeters(editingRoll.currentMeters);
      setCostPerRoll(editingRoll.costPerRoll);
      setLocation(editingRoll.location);
      setBatchNumber(editingRoll.batchNumber || '');
      setStatus(editingRoll.status);
      setNotes(editingRoll.notes || '');
    } else {
      setCode(`KRYP-${Math.floor(10 + Math.random() * 90)}`);
      setBrand('Kryptonite');
      setModel('Ultra Gloss');
      setFinish('GLOSS');
      setWidthMeters(1.56);
      setInitialMeters(15.0);
      setCurrentMeters(15.0);
      setCostPerRoll(1300);
      setLocation('Rack Principal');
      setBatchNumber('');
      setStatus('ACTIVE');
      setNotes('');
    }
  }, [editingRoll, isOpen]);

  if (!isOpen) return null;

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
      setLocation('Rack Vidrios');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !brand.trim()) {
      alert('Por favor completa el código y la marca de la bobina.');
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
        batchNumber: batchNumber.trim() || undefined,
        location: location.trim() || 'Taller',
        status,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error guardando la bobina');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {editingRoll ? 'Editar Bobina de PPF' : 'Dar de Alta Bobina Kryptonite'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
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
                    border: widthMeters === 1.56 ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    background: widthMeters === 1.56 ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-input)',
                    color: widthMeters === 1.56 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
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
                    border: widthMeters === 1.20 ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    background: widthMeters === 1.20 ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-input)',
                    color: widthMeters === 1.20 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
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
              <label className="form-label">Modelo / Serie</label>
              <input
                type="text"
                className="form-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ultra Gloss, Satin Matte, etc."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Acabado / Tipo de Film</label>
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
              <label className="form-label">Metros Actuales Restantes</label>
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-card)',
          }}>
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
