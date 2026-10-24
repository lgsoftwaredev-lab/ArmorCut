'use client';

import React, { useState, useEffect } from 'react';
import { PPFRoll, PPFFinish, PPFRollStatus } from '@/types/ppf';
import { X, Save, Layers } from 'lucide-react';

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
  { value: 'SMOKE_HEADLIGHT', label: 'Smoke / Ópticas Tintadas' },
  { value: 'WINDSHIELD', label: 'Protección Parabrisas (Windshield)' },
  { value: 'OTHER', label: 'Otro / Especial' },
];

export const NewRollModal: React.FC<NewRollModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRoll,
}) => {
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('XPEL');
  const [model, setModel] = useState('Ultimate Plus 8mil');
  const [finish, setFinish] = useState<PPFFinish>('GLOSS');
  const [widthMeters, setWidthMeters] = useState(1.52);
  const [initialMeters, setInitialMeters] = useState(15.0);
  const [currentMeters, setCurrentMeters] = useState(15.0);
  const [costPerRoll, setCostPerRoll] = useState(1400);
  const [location, setLocation] = useState('Rack A');
  const [batchNumber, setBatchNumber] = useState('');
  const [status, setStatus] = useState<PPFRollStatus>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRoll) {
      setCode(editingRoll.code);
      setBrand(editingRoll.brand);
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
      setCode(`PPF-${Math.floor(100 + Math.random() * 900)}`);
      setBrand('XPEL');
      setModel('Ultimate Plus 8mil');
      setFinish('GLOSS');
      setWidthMeters(1.52);
      setInitialMeters(15.0);
      setCurrentMeters(15.0);
      setCostPerRoll(1400);
      setLocation('Rack Principal');
      setBatchNumber('');
      setStatus('ACTIVE');
      setNotes('');
    }
  }, [editingRoll, isOpen]);

  if (!isOpen) return null;

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
              {editingRoll ? 'Editar Bobina de PPF' : 'Dar de Alta Nueva Bobina'}
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
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Código / Identificador *</label>
              <input
                type="text"
                className="form-input mono"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: XP-GL-05"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Marca de PPF *</label>
              <input
                type="text"
                className="form-input"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="XPEL, STEK, SunTek, 3M, Avery"
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
                placeholder="Ultimate Plus, DYNOshield, Reaction"
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
              <label className="form-label">Ancho de la Bobina (metros)</label>
              <select
                className="form-select"
                value={widthMeters}
                onChange={(e) => setWidthMeters(Number(e.target.value))}
              >
                <option value={1.52}>1.52 m (60 pulgadas - Estándar Capots/Paragolpes)</option>
                <option value={0.91}>0.91 m (36 pulgadas - Zócalos/Ópticas)</option>
                <option value={0.76}>0.76 m (30 pulgadas)</option>
                <option value={0.61}>0.61 m (24 pulgadas)</option>
                <option value={1.83}>1.83 m (72 pulgadas - Camionetas Grandes)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Metros Iniciales del Rollo</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                className="form-input"
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
                className="form-input"
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
                className="form-input"
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
                placeholder="Ej: Rack A - Nivel 2"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lote de Fabricación (Opcional)</label>
              <input
                type="text"
                className="form-input"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Ej: LOT-98214"
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
              <span>{isSubmitting ? 'Guardando...' : editingRoll ? 'Guardar Cambios' : 'Registrar Bobina'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
