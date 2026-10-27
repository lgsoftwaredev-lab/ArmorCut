'use client';

import React, { useState } from 'react';
import { PPFRoll, CreateJobInput } from '@/types/ppf';
import { Scissors, X, Check, Plus } from 'lucide-react';
import { PlusCarsMonogram } from '@/components/brand/PlusCarsBrand';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  rolls: PPFRoll[];
  preselectedRoll?: PPFRoll | null;
  onSaveJob: (jobData: CreateJobInput) => Promise<void>;
}

const COMMON_PARTS = [
  'Capot Completo',
  'Paragolpes Delantero',
  'Guardabarros Delanteros',
  'Full Frontal (Kit)',
  'Ópticas / Faros',
  'Espejos Retrovisores',
  'Zócalos / Estribos',
  'Techo (Roof)',
  'Paragolpes Trasero',
  'Full Body (Auto Completo)',
  'Pantalla Interior / Consola',
];

const JobModalContent: React.FC<{
  rolls: PPFRoll[];
  preselectedRoll?: PPFRoll | null;
  onClose: () => void;
  onSaveJob: (jobData: CreateJobInput) => Promise<void>;
}> = ({ rolls, preselectedRoll, onClose, onSaveJob }) => {
  const activeRolls = rolls.filter((r) => r.status === 'ACTIVE' || r.id === preselectedRoll?.id);

  const [selectedRollId, setSelectedRollId] = useState(
    () => preselectedRoll?.id || (activeRolls.length > 0 ? activeRolls[0].id : '')
  );
  const [vehicle, setVehicle] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [clientName, setClientName] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [installer, setInstaller] = useState('Lucas');
  const [selectedParts, setSelectedParts] = useState<string[]>(['Capot Completo']);
  const [customPart, setCustomPart] = useState('');
  const [metersUsed, setMetersUsed] = useState(2.2);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRoll = rolls.find((r) => r.id === selectedRollId) || activeRolls[0];
  const metersDeducted = Number(metersUsed) || 0;
  const costPerMeter = currentRoll && currentRoll.initialMeters > 0 ? currentRoll.costPerRoll / currentRoll.initialMeters : 90;
  const totalCostEstimate = (costPerMeter * metersDeducted).toFixed(2);
  const remainingAfterJob = currentRoll ? Math.max(0, currentRoll.currentMeters - metersDeducted) : 0;

  const togglePart = (part: string) => {
    if (selectedParts.includes(part)) {
      setSelectedParts(selectedParts.filter((p) => p !== part));
    } else {
      setSelectedParts([...selectedParts, part]);
    }
  };

  const addCustomPart = () => {
    if (customPart.trim() && !selectedParts.includes(customPart.trim())) {
      setSelectedParts([...selectedParts, customPart.trim()]);
      setCustomPart('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoll) {
      alert('Debes seleccionar una bobina de PPF.');
      return;
    }
    if (!vehicle.trim() || !clientName.trim() || !installer.trim()) {
      alert('Por favor completa el vehículo, cliente e instalador.');
      return;
    }
    if (metersDeducted <= 0) {
      alert('Ingresa los metros utilizados.');
      return;
    }
    if (currentRoll.currentMeters < metersDeducted) {
      const confirmExceed = confirm(
        `Atención: La bobina tiene ${currentRoll.currentMeters.toFixed(2)}m disponibles pero el trabajo requiere ${metersDeducted.toFixed(2)}m. ¿Deseas descontar de todos modos?`
      );
      if (!confirmExceed) return;
    }

    try {
      setIsSubmitting(true);
      const jobData: CreateJobInput = {
        rollId: currentRoll.id,
        rollCode: currentRoll.code,
        brand: currentRoll.brand,
        model: currentRoll.model,
        finish: currentRoll.finish,
        vehicle: vehicle.trim(),
        licensePlate: licensePlate.trim().toUpperCase() || undefined,
        clientName: clientName.trim(),
        workOrderNumber: workOrderNumber.trim() || undefined,
        installer: installer.trim(),
        parts: selectedParts,
        metersUsed: Number(metersUsed),
        notes: notes.trim() || undefined,
      };

      await onSaveJob(jobData);
      onClose();
    } catch (err) {
      console.error('Error saving job:', err);
      alert('Ocurrió un error al registrar el trabajo.');
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
          maxWidth: '650px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
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
              <Scissors size={20} color="var(--accent-red)" />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Registrar Salida de Material (Corte)
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <PlusCarsMonogram height={22} style={{ opacity: 0.85 }} />
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Roll Selector & Live preview */}
          <div className="form-group">
            <label className="form-label">
              <span>Bobina de Origen *</span>
              {currentRoll && (
                <span style={{ color: currentRoll.currentMeters < 3 ? 'var(--color-warning)' : 'var(--accent-red)' }}>
                  Disponible: <strong>{currentRoll.currentMeters.toFixed(2)} m</strong> (Ancho: {currentRoll.widthMeters}m)
                </span>
              )}
            </label>
            <select
              className="form-select mono"
              value={selectedRollId}
              onChange={(e) => setSelectedRollId(e.target.value)}
              required
            >
              {activeRolls.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.code}] {r.brand} {r.model} ({r.finish}) — {r.currentMeters.toFixed(2)}m restantes — {r.location}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle & Plate */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Vehículo *</label>
              <input
                type="text"
                className="form-input"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Ej: Porsche 911 GT3 / BMW M3"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Patente / Placa</label>
              <input
                type="text"
                className="form-input mono"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="Ej: AF 123 CD"
              />
            </div>
          </div>

          {/* Client, Work Order & Installer */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <input
                type="text"
                className="form-input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del cliente o concesionario"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Orden de Trabajo (OT)</label>
              <input
                type="text"
                className="form-input mono"
                value={workOrderNumber}
                onChange={(e) => setWorkOrderNumber(e.target.value)}
                placeholder="Ej: OT-2026-105"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Técnico Instalador *</label>
              <input
                type="text"
                className="form-input"
                value={installer}
                onChange={(e) => setInstaller(e.target.value)}
                placeholder="Ej: Lucas / Marcos"
                required
              />
            </div>
          </div>

          {/* Parts Checkboxes */}
          <div className="form-group">
            <label className="form-label">Piezas a Proteger</label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: '4px',
              background: 'var(--bg-input)',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)',
            }}>
              {COMMON_PARTS.map((part) => {
                const isSelected = selectedParts.includes(part);
                return (
                  <button
                    key={part}
                    type="button"
                    onClick={() => togglePart(part)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(230, 25, 55, 0.15)' : 'var(--bg-card)',
                      color: isSelected ? 'var(--accent-red)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    {part}
                  </button>
                );
              })}
            </div>

            {/* Custom part addition */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Agregar otra pieza (ej: Alerón Trasero, Zócalo Interior...)"
                value={customPart}
                onChange={(e) => setCustomPart(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomPart();
                  }
                }}
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              />
              <button
                type="button"
                onClick={addCustomPart}
                className="btn btn-secondary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Plus size={14} />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {/* Meters Used */}
          <div className="form-group">
            <label className="form-label">Metros Lineales Cortados / Descontados *</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              className="form-input mono"
              value={metersUsed}
              onChange={(e) => setMetersUsed(Number(e.target.value))}
              required
            />
          </div>

          {/* Live Cut Summary Box */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Quedará en Bobina:</span>
              <strong className="mono" style={{ color: remainingAfterJob < 3 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                {remainingAfterJob.toFixed(2)} m restantes
              </strong>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Costo Estimado Salida:</span>
              <strong className="mono" style={{ color: 'var(--accent-red)', fontSize: '1rem' }}>
                ~${totalCostEstimate} USD
              </strong>
            </div>
          </div>

          {/* General Job Notes */}
          <div className="form-group">
            <label className="form-label">Notas del Trabajo (Opcional)</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el corte, observaciones o cliente"
            />
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
              <Scissors size={16} />
              <span>{isSubmitting ? 'Guardando...' : 'Confirmar y Descontar Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  rolls,
  preselectedRoll,
  onSaveJob,
}) => {
  if (!isOpen) return null;
  return (
    <JobModalContent
      key={preselectedRoll?.id || 'new-job-modal'}
      rolls={rolls}
      preselectedRoll={preselectedRoll}
      onClose={onClose}
      onSaveJob={onSaveJob}
    />
  );
};
