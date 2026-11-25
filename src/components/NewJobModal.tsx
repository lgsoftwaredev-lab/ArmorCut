'use client';

import React, { useState } from 'react';
import { PPFRoll, PPFJobConsumption, CreateJobInput } from '@/types/ppf';
import { Scissors, X, Check, Plus, Save } from 'lucide-react';
import { PlusCarsMonogram } from '@/components/brand/PlusCarsBrand';

export interface InitialJobData {
  vehicle?: string;
  parts?: string[];
  metersUsed?: number;
  notes?: string;
  rollId?: string;
}

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  rolls: PPFRoll[];
  preselectedRoll?: PPFRoll | null;
  editingJob?: PPFJobConsumption | null;
  onSaveJob: (jobData: CreateJobInput) => Promise<void>;
  initialJobData?: InitialJobData | null;
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
  editingJob?: PPFJobConsumption | null;
  initialJobData?: InitialJobData | null;
  onClose: () => void;
  onSaveJob: (jobData: CreateJobInput) => Promise<void>;
}> = ({ rolls, preselectedRoll, editingJob, initialJobData, onClose, onSaveJob }) => {
  const activeRolls = rolls.filter(
    (r) =>
      r.status === 'ACTIVE' ||
      r.id === preselectedRoll?.id ||
      r.id === initialJobData?.rollId ||
      r.id === editingJob?.rollId ||
      r.code === editingJob?.rollCode
  );

  const [selectedRollId, setSelectedRollId] = useState(() => {
    if (editingJob) {
      const matched = rolls.find(
        (r) => r.id === editingJob.rollId || r.code === editingJob.rollCode
      );
      if (matched) return matched.id;
    }
    return (
      initialJobData?.rollId ||
      preselectedRoll?.id ||
      (activeRolls.length > 0 ? activeRolls[0].id : '')
    );
  });

  const [vehicle, setVehicle] = useState(editingJob?.vehicle || initialJobData?.vehicle || '');
  const [licensePlate, setLicensePlate] = useState(editingJob?.licensePlate || '');
  const [clientName, setClientName] = useState(editingJob?.clientName || '');
  const [workOrderNumber, setWorkOrderNumber] = useState(editingJob?.workOrderNumber || '');
  const [installer, setInstaller] = useState(editingJob?.installer || 'Lucas');
  const [selectedParts, setSelectedParts] = useState<string[]>(
    editingJob?.parts && editingJob.parts.length > 0
      ? editingJob.parts
      : initialJobData?.parts && initialJobData.parts.length > 0
      ? initialJobData.parts
      : ['Capot Completo']
  );
  const [customPart, setCustomPart] = useState('');
  const [metersUsed, setMetersUsed] = useState(
    editingJob?.metersUsed ?? initialJobData?.metersUsed ?? 2.2
  );
  const [notes, setNotes] = useState(editingJob?.notes || initialJobData?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRoll = rolls.find((r) => r.id === selectedRollId) || activeRolls[0];
  const metersDeducted = Number(metersUsed) || 0;
  const costPerMeter =
    currentRoll && currentRoll.initialMeters > 0
      ? currentRoll.costPerRoll / currentRoll.initialMeters
      : 90;
  const totalCostEstimate = (costPerMeter * metersDeducted).toFixed(2);

  // Available meters on the selected roll (if editing on the same roll, include the meters previously taken by this job)
  const effectiveAvailableMeters = currentRoll
    ? editingJob &&
      (currentRoll.id === editingJob.rollId || currentRoll.code === editingJob.rollCode)
      ? Number((currentRoll.currentMeters + Number(editingJob.metersUsed)).toFixed(2))
      : currentRoll.currentMeters
    : 0;

  const remainingAfterJob = Math.max(0, Number((effectiveAvailableMeters - metersDeducted).toFixed(2)));

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
    if (effectiveAvailableMeters < metersDeducted) {
      const confirmExceed = confirm(
        `Atención: La bobina dispone de ${effectiveAvailableMeters.toFixed(2)}m pero la orden requiere ${metersDeducted.toFixed(2)}m. ¿Deseas guardar de todos modos?`
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
      alert('Ocurrió un error al guardar la orden de corte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-5) var(--space-6)',
            borderBottom: '1px solid var(--border-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scissors size={18} color="var(--accent-red)" />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
              {editingJob ? 'Editar Orden de Corte' : 'Registrar Orden de Corte'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <PlusCarsMonogram height={20} style={{ opacity: 0.85 }} />
            <button
              type="button"
              aria-label="Cerrar modal"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5) var(--space-6)' }}>
          {/* Roll Selector & Live preview */}
          <div className="form-group">
            <label className="form-label">
              <span>Bobina de Origen *</span>
              {currentRoll && (
                <span
                  className="mono"
                  style={{
                    color:
                      effectiveAvailableMeters < 3
                        ? 'var(--color-warning)'
                        : 'var(--text-secondary)',
                  }}
                >
                  Disponible: <strong>{effectiveAvailableMeters.toFixed(2)}m</strong> ({currentRoll.widthMeters}m)
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
                  [{r.code}] {r.brand} {r.model} ({r.finish}) — {r.currentMeters.toFixed(2)}m — {r.location}
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
                placeholder="Ej: Porsche 911 GT3 / BMW M2"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Patente / Dominio</label>
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
                placeholder="Nombre del cliente"
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
              <label className="form-label">Instalador *</label>
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
            <label className="form-label">Piezas Cubiertas</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginTop: '4px',
                background: 'var(--bg-input)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-card)',
              }}
            >
              {Array.from(new Set([...COMMON_PARTS, ...selectedParts])).map((part) => {
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
                      border: isSelected
                        ? '1px solid var(--text-primary)'
                        : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isSelected && <Check size={12} color="var(--accent-red)" />}
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
                placeholder="Agregar otra pieza..."
                value={customPart}
                onChange={(e) => setCustomPart(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomPart();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomPart}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {/* Meters Used */}
          <div className="form-group">
            <label className="form-label">Metros Lineales Cortados *</label>
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
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block' }}>
                Remanente en Bobina
              </span>
              <strong
                className="mono"
                style={{
                  color: remainingAfterJob < 3 ? 'var(--color-warning)' : 'var(--text-primary)',
                }}
              >
                {remainingAfterJob.toFixed(2)}m
              </strong>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block' }}>
                Costo Estimado Material
              </span>
              <strong className="mono" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>
                ${totalCostEstimate} USD
              </strong>
            </div>
          </div>

          {/* General Job Notes */}
          <div className="form-group">
            <label className="form-label">Notas (Opcional)</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre la orden de corte"
            />
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-5)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-card)',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {editingJob ? <Save size={15} /> : <Scissors size={15} />}
              <span>
                {isSubmitting
                  ? 'Guardando...'
                  : editingJob
                  ? 'Guardar Cambios'
                  : 'Confirmar y Descontar Stock'}
              </span>
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
  editingJob,
  onSaveJob,
  initialJobData,
}) => {
  if (!isOpen) return null;
  return (
    <JobModalContent
      key={editingJob?.id || preselectedRoll?.id || initialJobData?.vehicle || 'new-job-modal'}
      rolls={rolls}
      preselectedRoll={preselectedRoll}
      editingJob={editingJob}
      initialJobData={initialJobData}
      onClose={onClose}
      onSaveJob={onSaveJob}
    />
  );
};
