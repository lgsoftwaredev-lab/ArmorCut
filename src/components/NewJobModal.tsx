'use client';

import React, { useState } from 'react';
import { PPFRoll, ScrapReason, CreateJobInput, JobCreatedOffcutInput } from '@/types/ppf';
import { Scissors, AlertTriangle, X, Check, Layers, Plus } from 'lucide-react';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  rolls: PPFRoll[];
  preselectedRoll?: PPFRoll | null;
  onSaveJob: (
    jobData: CreateJobInput,
    createdOffcut?: JobCreatedOffcutInput
  ) => Promise<void>;
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

const SCRAP_REASONS: { value: ScrapReason; label: string }[] = [
  { value: 'CONTAMINATION', label: 'Polvo / Pelusa / Contaminación de agua' },
  { value: 'STRETCH_TEAR', label: 'Estiramiento excesivo / Rotura en curvatura' },
  { value: 'CUTTING_ERROR', label: 'Error de corte en plotter o manual con cutter' },
  { value: 'SILVERING_ADHESIVE', label: 'Silvering / Marcas de adhesivo y huellas' },
  { value: 'INSTALLATION_ERROR', label: 'Fallo de espátula / Error de colocación' },
  { value: 'DEFECTIVE_MATERIAL', label: 'Falla o defecto de fábrica en film' },
  { value: 'OTHER', label: 'Otro motivo' },
];

const JobModalContent: React.FC<{
  rolls: PPFRoll[];
  preselectedRoll?: PPFRoll | null;
  onClose: () => void;
  onSaveJob: (jobData: CreateJobInput, createdOffcut?: JobCreatedOffcutInput) => Promise<void>;
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

  // Scrap State
  const [hasScrap, setHasScrap] = useState(false);
  const [metersScrap, setMetersScrap] = useState(0.4);
  const [scrapReason, setScrapReason] = useState<ScrapReason>('CONTAMINATION');
  const [scrapNotes, setScrapNotes] = useState('');

  // Offcut State
  const [hasOffcut, setHasOffcut] = useState(false);
  const [offcutWidthCm, setOffcutWidthCm] = useState(45);
  const [offcutLengthCm, setOffcutLengthCm] = useState(110);
  const [offcutLocation, setOffcutLocation] = useState('Cajón 1 - Retazos Capot');
  const [offcutSuggestedUse, setOffcutSuggestedUse] = useState('Espejos retrovisores, tazas de puerta o B-Pillars');
  const [offcutNotes, setOffcutNotes] = useState('');

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRoll = rolls.find((r) => r.id === selectedRollId) || activeRolls[0];
  const totalMetersDeducted = Number(metersUsed) + (hasScrap ? Number(metersScrap) : 0);
  const costPerMeter = currentRoll && currentRoll.initialMeters > 0 ? currentRoll.costPerRoll / currentRoll.initialMeters : 90;
  const scrapCostEstimate = (costPerMeter * (hasScrap ? Number(metersScrap) : 0)).toFixed(2);

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
    if (totalMetersDeducted <= 0) {
      alert('Ingresa los metros utilizados.');
      return;
    }
    if (currentRoll.currentMeters < totalMetersDeducted) {
      const confirmExceed = confirm(
        `Atención: La bobina tiene ${currentRoll.currentMeters.toFixed(2)}m disponibles pero el trabajo requiere ${totalMetersDeducted.toFixed(2)}m. ¿Deseas descontar de todos modos?`
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
        metersScrap: hasScrap ? Number(metersScrap) : 0,
        scrapReason: hasScrap ? scrapReason : undefined,
        scrapNotes: hasScrap && scrapNotes.trim() ? scrapNotes.trim() : undefined,
        notes: notes.trim() || undefined,
      };

      const offcutData: JobCreatedOffcutInput | undefined = hasOffcut && offcutWidthCm > 0 && offcutLengthCm > 0
        ? {
            widthCm: Number(offcutWidthCm),
            lengthCm: Number(offcutLengthCm),
            storageLocation: offcutLocation.trim() || 'Cajón de Retazos',
            suggestedUse: offcutSuggestedUse.trim() || 'Piezas chicas',
            notes: offcutNotes.trim() || undefined,
          }
        : undefined;

      await onSaveJob(jobData, offcutData);
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
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
              }}
            >
              <Scissors size={20} color="var(--accent-red)" />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Registrar Corte & Descuento de PPF
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
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
            <label className="form-label">Metros Lineales Instalados (Auto) *</label>
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

          {/* Scrap Section (Collapsible Toggle) */}
          <div style={{
            background: hasScrap ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-input)',
            border: hasScrap ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color={hasScrap ? 'var(--color-danger)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: hasScrap ? '#fca5a5' : 'var(--text-primary)' }}>
                  ¿Hubo Scrap o Desperdicio de Material?
                </span>
              </div>
              <input
                type="checkbox"
                id="scrapToggle"
                checked={hasScrap}
                onChange={(e) => setHasScrap(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-danger)', cursor: 'pointer' }}
              />
            </div>

            {hasScrap && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Metros de Scrap (Arruinados) *</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      className="form-input mono"
                      value={metersScrap}
                      onChange={(e) => setMetersScrap(Number(e.target.value))}
                      required={hasScrap}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Motivo de la Merma *</label>
                    <select
                      className="form-select"
                      value={scrapReason}
                      onChange={(e) => setScrapReason(e.target.value as ScrapReason)}
                    >
                      {SCRAP_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Detalle del Error o Rotura (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={scrapNotes}
                    onChange={(e) => setScrapNotes(e.target.value)}
                    placeholder="Ej: Contaminación de polvo en capot al bajar film, se repitió la pieza"
                  />
                </div>

                <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                  Pérdida económica calculada en este corte: ~<strong>${scrapCostEstimate} USD</strong>
                </div>
              </div>
            )}
          </div>

          {/* Usable Offcut Section (Collapsible Toggle) */}
          <div style={{
            background: hasOffcut ? 'rgba(230, 25, 55, 0.08)' : 'var(--bg-input)',
            border: hasOffcut ? '1px solid rgba(230, 25, 55, 0.35)' : '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color={hasOffcut ? 'var(--accent-red)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: hasOffcut ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                  ¿Generó un Retazo Sobrante Aprovechable?
                </span>
              </div>
              <input
                type="checkbox"
                id="offcutToggle"
                checked={hasOffcut}
                onChange={(e) => setHasOffcut(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-red)', cursor: 'pointer' }}
              />
            </div>

            {hasOffcut && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Ancho del Retazo (cm)</label>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      className="form-input mono"
                      value={offcutWidthCm}
                      onChange={(e) => setOffcutWidthCm(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Largo del Retazo (cm)</label>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      className="form-input mono"
                      value={offcutLengthCm}
                      onChange={(e) => setOffcutLengthCm(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ubicación para Guardarlo en Taller</label>
                  <input
                    type="text"
                    className="form-input"
                    value={offcutLocation}
                    onChange={(e) => setOffcutLocation(e.target.value)}
                    placeholder="Ej: Cajón 1 - Retazos Capot"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Uso Sugerido para este Retazo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={offcutSuggestedUse}
                    onChange={(e) => setOffcutSuggestedUse(e.target.value)}
                    placeholder="Ej: Espejos retrovisores, B-Pillars, Tazas de Puerta"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Notas del Retazo (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={offcutNotes}
                    onChange={(e) => setOffcutNotes(e.target.value)}
                    placeholder="Observaciones sobre el sobrante"
                  />
                </div>
              </div>
            )}
          </div>

          {/* General Job Notes */}
          <div className="form-group">
            <label className="form-label">Notas del Trabajo / Instalación (Opcional)</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el acabado, cliente o proveedor de corte"
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
