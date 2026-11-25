'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DemoActionDetail } from '@/components/DemoTourOverlay';
import {
  PPFRoll,
  MaterialGrade,
} from '@/types/ppf';
import {
  VEHICLE_CATALOG,
  STANDARD_PANELS,
  PACKAGE_PRESETS,
} from '@/data/materialsAndPanels';
import { calculatePPFJob } from '@/utils/ppfCalculations';
import { CarBlueprintViewer } from './CarBlueprintViewer';
import { Vehicle3DShowroom } from './Vehicle3DShowroom';
import { RollNestingVisualizer } from './RollNestingVisualizer';
import { PlotterBridgeModal } from './PlotterBridgeModal';
import { VehicleCatalogSelector, BRAND_LOGOS } from './VehicleCatalogSelector';
import {
  Box,
  LayoutGrid,
  Scissors,
  Check,
  RotateCcw,
  Cpu,
  ArrowLeft,
} from 'lucide-react';

interface VehicleStudioViewProps {
  rolls: PPFRoll[];
  onOpenNewJobWithData: (data: {
    vehicle: string;
    parts: string[];
    metersUsed: number;
    notes: string;
    rollId?: string;
  }) => void;
}

export const VehicleStudioView: React.FC<VehicleStudioViewProps> = ({
  rolls,
  onOpenNewJobWithData,
}) => {
  const [studioScreen, setStudioScreen] = useState<'CATALOG' | 'STUDIO'>('CATALOG');
  const [catalogBrand, setCatalogBrand] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('golf_gti_mk7');
  const vehicle = VEHICLE_CATALOG[selectedVehicleId] || VEHICLE_CATALOG.golf_gti_mk7;

  const [displayMode, setDisplayMode] = useState<'3D' | 'CAD'>('3D');

  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([
    'hood',
    'bumper_front',
    'fender_left',
    'fender_right',
    'mirrors',
    'headlights',
  ]);
  const [hoveredPanelId, setHoveredPanelId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [materialGrade, setMaterialGrade] = useState<MaterialGrade>('PREMIUM');

  const [selectedRollId, setSelectedRollId] = useState<string>(() => {
    const active = rolls.find((r) => r.status === 'ACTIVE');
    return active ? active.id : rolls[0]?.id || '';
  });

  const [isPlotterModalOpen, setIsPlotterModalOpen] = useState(false);

  // Listen for interactive Demo Tour actions
  useEffect(() => {
    const handleDemoAction = (e: Event) => {
      const detail = (e as CustomEvent<DemoActionDetail>).detail;
      if (!detail) return;
      if (detail.type === 'STUDIO_CATALOG') {
        setCatalogBrand(detail.brand ?? null);
        setStudioScreen('CATALOG');
      } else if (detail.type === 'STUDIO_VEHICLE' && detail.vehicleId) {
        const chosen = VEHICLE_CATALOG[detail.vehicleId];
        if (chosen) setCatalogBrand(chosen.brand);
        setSelectedVehicleId(detail.vehicleId);
        setDisplayMode('3D');
        setStudioScreen('STUDIO');
      } else if (detail.type === 'STUDIO_SET_PANELS' && detail.panelIds) {
        setSelectedPanelIds(detail.panelIds);
      } else if (detail.type === 'STUDIO_HOVER_PANEL') {
        setHoveredPanelId(detail.panelId ?? null);
      } else if (detail.type === 'STUDIO_SCROLL_NESTING') {
        const el = document.getElementById('studio-nesting-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (detail.type === 'STUDIO_SCROLL_TOP') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('armorcut:demo-action', handleDemoAction);
    return () => window.removeEventListener('armorcut:demo-action', handleDemoAction);
  }, []);

  const activeRoll = useMemo(
    () => rolls.find((r) => r.id === selectedRollId) || rolls[0],
    [rolls, selectedRollId]
  );

  const availableActiveRolls = useMemo(
    () => rolls.filter((r) => r.status === 'ACTIVE'),
    [rolls]
  );

  const calcResult = useMemo(
    () =>
      calculatePPFJob({
        panelIds: selectedPanelIds,
        materialGrade,
        vehicleModelId: selectedVehicleId,
        wasteMarginPercent: 10,
      }),
    [selectedPanelIds, materialGrade, selectedVehicleId]
  );

  const togglePanel = useCallback((panelId: string) => {
    setSelectedPanelIds((prev) =>
      prev.includes(panelId) ? prev.filter((id) => id !== panelId) : [...prev, panelId]
    );
  }, []);

  const handleSelectPreset = useCallback((panelIds: string[]) => {
    setSelectedPanelIds(panelIds);
  }, []);

  const handleClearPanels = useCallback(() => {
    setSelectedPanelIds([]);
  }, []);

  const filteredPanels = useMemo(
    () =>
      STANDARD_PANELS.filter((p) => {
        if (activeCategoryFilter === 'ALL') return true;
        if (activeCategoryFilter === 'MICRO') return p.isMicroDetail;
        if (activeCategoryFilter === 'FRONT') return p.category === 'front';
        if (activeCategoryFilter === 'SIDES') return p.category === 'sides';
        if (activeCategoryFilter === 'REAR_ROOF') return p.category === 'rear' || p.category === 'roof';
        if (activeCategoryFilter === 'AERO') return p.category === 'aero';
        return true;
      }),
    [activeCategoryFilter]
  );

  const handleTransferToJob = () => {
    if (selectedPanelIds.length === 0) {
      alert('Selecciona al menos una pieza para transferir a la orden de trabajo.');
      return;
    }

    const panelNames = STANDARD_PANELS.filter((p) => selectedPanelIds.includes(p.id)).map(
      (p) => p.spanishName || p.name
    );

    onOpenNewJobWithData({
      vehicle: vehicle.name,
      parts: panelNames,
      metersUsed: calcResult.billedLinearMeters,
      rollId: selectedRollId,
      notes: `Orden generada desde Studio (${calcResult.selectedPanels.length} piezas, ${calcResult.sqMetersTotal} m² netos, eficiencia ${calcResult.nesting.efficiencyPercent}%)`,
    });
  };

  if (studioScreen === 'CATALOG') {
    return (
      <VehicleCatalogSelector
        vehicles={Object.values(VEHICLE_CATALOG)}
        initialBrand={catalogBrand}
        onSelectVehicle={(vehicleId) => {
          const chosen = VEHICLE_CATALOG[vehicleId];
          if (chosen) {
            setCatalogBrand(chosen.brand);
          }
          setSelectedVehicleId(vehicleId);
          setStudioScreen('STUDIO');
        }}
      />
    );
  }

  const sameBrandModels = Object.values(VEHICLE_CATALOG).filter(
    (v) => v.brand === vehicle.brand
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* 1. ARCHITECTURAL STUDIO BAR */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-5)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        {/* Left: Back Navigation + Brand Emblem + Active Vehicle Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setCatalogBrand(null);
                setStudioScreen('CATALOG');
              }}
              className="btn btn-secondary btn-sm"
              title="Volver al catálogo de marcas"
            >
              <ArrowLeft size={13} />
              <span>Marcas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCatalogBrand(vehicle.brand);
                setStudioScreen('CATALOG');
              }}
              className="btn btn-secondary btn-sm"
              title={`Ver todos los modelos de ${vehicle.brand}`}
            >
              <span>{vehicle.brand}</span>
            </button>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-card)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {BRAND_LOGOS[vehicle.brand] && (
              <img
                src={BRAND_LOGOS[vehicle.brand]}
                alt={vehicle.brand}
                style={{ height: '28px', width: '28px', objectFit: 'contain' }}
              />
            )}
            <div>
              <div
                className="mono"
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                }}
              >
                {vehicle.brand} · {vehicle.year}
              </div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {vehicle.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Center: Clean Model Switcher for Current Brand */}
        {sameBrandModels.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {sameBrandModels.map((v) => {
              const isSelected = selectedVehicleId === v.id;
              const shortLabel = v.name.startsWith(v.brand)
                ? v.name.slice(v.brand.length).trim()
                : v.name;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicleId(v.id)}
                  className="btn btn-sm"
                  style={{
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                    borderColor: isSelected ? 'var(--text-secondary)' : 'var(--border-subtle)',
                  }}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* Right: Viewport Mode Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-card)',
            padding: '2px',
            borderRadius: 'var(--radius-md)',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setDisplayMode('3D')}
            className="btn btn-sm"
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              color: displayMode === '3D' ? '#ffffff' : 'var(--text-muted)',
              background: displayMode === '3D' ? 'var(--bg-card-hover)' : 'transparent',
            }}
          >
            <Box size={13} />
            <span>Vista 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('CAD')}
            className="btn btn-sm"
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              color: displayMode === 'CAD' ? '#ffffff' : 'var(--text-muted)',
              background: displayMode === 'CAD' ? 'var(--bg-card-hover)' : 'transparent',
            }}
          >
            <LayoutGrid size={13} />
            <span>Plano 2D</span>
          </button>
        </div>
      </div>

      {/* 2. PRESETS BAR */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            className="mono"
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginRight: '4px',
            }}
          >
            Kits:
          </span>
          {PACKAGE_PRESETS.map((preset) => {
            const isPresetActive =
              preset.recommendedPanelIds.every((id) => selectedPanelIds.includes(id)) &&
              preset.recommendedPanelIds.length === selectedPanelIds.length;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.recommendedPanelIds)}
                className="btn btn-sm"
                style={{
                  padding: '5px 11px',
                  borderRadius: 'var(--radius-sm)',
                  color: isPresetActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isPresetActive ? 'var(--accent-red)' : 'var(--bg-card)',
                  borderColor: isPresetActive ? 'var(--accent-red)' : 'var(--border-card)',
                }}
                title={preset.description}
              >
                {preset.name.replace(' (El más solicitado)', '')}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleClearPanels}
          disabled={selectedPanelIds.length === 0}
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 10px' }}
        >
          <RotateCcw size={12} />
          <span>Limpiar</span>
        </button>
      </div>

      {/* 3. MAIN WORKSPACE: VIEWPORT (LEFT) & SPECIFICATION SIDEBAR (RIGHT) */}
      <div className="studio-workspace-grid">
        {/* Left Column: 3D or 2D CAD Viewport + Nesting */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {displayMode === '3D' ? (
            <Vehicle3DShowroom
              selectedPanelIds={selectedPanelIds}
              onTogglePanel={togglePanel}
              hoveredPanelId={hoveredPanelId}
              onHoverPanel={setHoveredPanelId}
              vehicleModelPath={vehicle.model3dPath || '/models/golf_gti_mk7.glb'}
              vehicleName={vehicle.name}
            />
          ) : (
            <CarBlueprintViewer
              selectedPanelIds={selectedPanelIds}
              onTogglePanel={togglePanel}
              hoveredPanelId={hoveredPanelId}
              onHoverPanel={setHoveredPanelId}
              vehicleName={vehicle.name}
            />
          )}

          {/* Bottom Nesting Roll Simulator Strip */}
          <div id="studio-nesting-section" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <RollNestingVisualizer
              selectedPanels={calcResult.selectedPanels}
              nesting={calcResult.nesting}
              billedLinearMeters={calcResult.billedLinearMeters}
              activeRoll={activeRoll}
              onSelectRoll={setSelectedRollId}
              availableRolls={availableActiveRolls}
            />
          </div>
        </div>

        {/* Right Column: Specification & Panel Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Specification & Cost Summary Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                className="mono"
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                Resumen de Corte
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {calcResult.selectedPanels.length} piezas
              </span>
            </div>

            {/* Key Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                }}
              >
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                  Consumo Lineal
                </span>
                <span
                  className="mono"
                  style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  {calcResult.billedLinearMeters.toFixed(2)}m
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>
                  +10% margen
                </span>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                }}
              >
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                  Tiempo Estimado
                </span>
                <span
                  className="mono"
                  style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  {calcResult.totalLaborHours.toFixed(1)}h
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>
                  {calcResult.sqMetersTotal.toFixed(1)} m² netos
                </span>
              </div>
            </div>

            {/* Material Grade Selector */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px',
                background: 'var(--bg-main)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {(['PREMIUM', 'COMUN'] as const).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setMaterialGrade(grade)}
                  style={{
                    padding: '6px 8px',
                    fontSize: '0.72rem',
                    fontWeight: materialGrade === grade ? 600 : 500,
                    color: materialGrade === grade ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: materialGrade === grade ? 'var(--bg-card-hover)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  {grade === 'PREMIUM' ? 'Film Premium 8.5m' : 'Film Standard 7.5m'}
                </button>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '12px',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Film PPF ({materialGrade})</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>
                  ${calcResult.materialCost.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Mano de obra</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>
                  ${calcResult.laborCost.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Preparación</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>
                  ${calcResult.prepCost.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '8px',
                  marginTop: '4px',
                }}
              >
                <span>Total Estimado</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>
                  ${calcResult.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={handleTransferToJob}
                disabled={selectedPanelIds.length === 0}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <Scissors size={14} />
                <span>Crear Orden de Corte</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPlotterModalOpen(true)}
                disabled={selectedPanelIds.length === 0}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <Cpu size={14} />
                <span>Exportar a Plotter</span>
              </button>
            </div>
          </div>

          {/* Panel Despiece Checklist */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '420px',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                className="mono"
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                Piezas ({selectedPanelIds.length}/{STANDARD_PANELS.length})
              </span>
            </div>

            {/* Category filter tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {(
                [
                  { id: 'ALL', label: 'Todos' },
                  { id: 'FRONT', label: 'Frente' },
                  { id: 'SIDES', label: 'Lados' },
                  { id: 'REAR_ROOF', label: 'Trasera' },
                  { id: 'MICRO', label: 'Micro' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(f.id)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    fontWeight: activeCategoryFilter === f.id ? 600 : 500,
                    color: activeCategoryFilter === f.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: activeCategoryFilter === f.id ? 'var(--bg-card-hover)' : 'transparent',
                    border:
                      activeCategoryFilter === f.id
                        ? '1px solid var(--border-highlight)'
                        : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Scrollable Panel List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {filteredPanels.map((panel) => {
                const isSel = selectedPanelIds.includes(panel.id);
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => togglePanel(panel.id)}
                    onMouseEnter={() => setHoveredPanelId(panel.id)}
                    onMouseLeave={() => setHoveredPanelId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isSel ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                      border: isSel
                        ? '1px solid var(--border-highlight)'
                        : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'border-color 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '3px',
                          border: isSel ? 'none' : '1px solid var(--text-dim)',
                          background: isSel ? 'var(--accent-red)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSel && <Check size={10} color="#ffffff" strokeWidth={3} />}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: isSel ? 600 : 500,
                            color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          {panel.spanishName || panel.name}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}
                        >
                          {panel.cutLength}m · {panel.sqMeters}m²
                        </div>
                      </div>
                    </div>

                    <span
                      className="mono"
                      style={{
                        fontSize: '0.62rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {panel.laborHours}h
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. PLOTTER BRIDGE MODAL */}
      <PlotterBridgeModal
        isOpen={isPlotterModalOpen}
        onClose={() => setIsPlotterModalOpen(false)}
        nesting={calcResult.nesting}
        vehicleName={vehicle.name}
      />
    </div>
  );
};
