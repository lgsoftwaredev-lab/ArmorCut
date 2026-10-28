'use client';

import React, { useState } from 'react';
import {
  VehiclePanel,
  PPFRoll,
  MaterialGrade,
  VehicleProfile,
} from '@/types/ppf';
import {
  VEHICLE_CATALOG,
  STANDARD_PANELS,
  PACKAGE_PRESETS,
  MATERIALS,
} from '@/data/materialsAndPanels';
import { calculatePPFJob } from '@/utils/ppfCalculations';
import { CarBlueprintViewer } from './CarBlueprintViewer';
import { Vehicle3DShowroom } from './Vehicle3DShowroom';
import { RollNestingVisualizer } from './RollNestingVisualizer';
import { PlotterBridgeModal } from './PlotterBridgeModal';
import {
  Box,
  LayoutGrid,
  Scissors,
  Check,
  RotateCcw,
  Sparkles,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  Cpu,
  ArrowRight,
} from 'lucide-react';

interface VehicleStudioViewProps {
  rolls: PPFRoll[];
  onOpenNewJobWithData: (data: {
    vehicle: string;
    parts: string[];
    metersUsed: number;
    notes: string;
  }) => void;
}

export const VehicleStudioView: React.FC<VehicleStudioViewProps> = ({
  rolls,
  onOpenNewJobWithData,
}) => {
  // Vehicle Selection State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('golf_gti_mk7');
  const vehicle = VEHICLE_CATALOG[selectedVehicleId] || VEHICLE_CATALOG.golf_gti_mk7;

  // View Display Mode (3D vs 2D CAD)
  const [displayMode, setDisplayMode] = useState<'3D' | 'CAD'>('3D');

  // Selected Panels & Hover
  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([
    'hood',
    'front_bumper',
    'fender_left',
    'fender_right',
    'mirrors',
    'headlights',
    'fog_lights',
  ]);
  const [hoveredPanelId, setHoveredPanelId] = useState<string | null>(null);

  // Category Filter for Panels
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  // Material Grade (Premium vs Común)
  const [materialGrade, setMaterialGrade] = useState<MaterialGrade>('PREMIUM');

  // Active Roll in Workshop for live stock comparison
  const [selectedRollId, setSelectedRollId] = useState<string>(() => {
    const active = rolls.find((r) => r.status === 'ACTIVE');
    return active ? active.id : rolls[0]?.id || '';
  });

  // Plotter Bridge Modal
  const [isPlotterModalOpen, setIsPlotterModalOpen] = useState(false);

  const activeRoll = rolls.find((r) => r.id === selectedRollId) || rolls[0];

  // Calculation Engine
  const calcResult = calculatePPFJob({
    panelIds: selectedPanelIds,
    materialGrade,
    vehicleModelId: selectedVehicleId,
    wasteMarginPercent: 10,
  });

  const togglePanel = (panelId: string) => {
    if (selectedPanelIds.includes(panelId)) {
      setSelectedPanelIds(selectedPanelIds.filter((id) => id !== panelId));
    } else {
      setSelectedPanelIds([...selectedPanelIds, panelId]);
    }
  };

  const handleSelectPreset = (panelIds: string[]) => {
    setSelectedPanelIds(panelIds);
  };

  const handleClearPanels = () => {
    setSelectedPanelIds([]);
  };

  // Filter panels for checklist
  const filteredPanels = STANDARD_PANELS.filter((p) => {
    if (activeCategoryFilter === 'ALL') return true;
    if (activeCategoryFilter === 'MICRO') return p.isMicroDetail;
    if (activeCategoryFilter === 'FRONT') return p.category === 'front';
    if (activeCategoryFilter === 'SIDES') return p.category === 'sides';
    if (activeCategoryFilter === 'REAR_ROOF') return p.category === 'rear' || p.category === 'roof';
    if (activeCategoryFilter === 'AERO') return p.category === 'aero';
    return true;
  });

  // Transfer to NewJobModal in Production
  const handleTransferToJob = () => {
    if (selectedPanelIds.length === 0) {
      alert('Selecciona al menos una pieza para transferir a la orden de trabajo.');
      return;
    }

    const panelNames = STANDARD_PANELS.filter((p) => selectedPanelIds.includes(p.id)).map(
      (p) => p.spanishName || p.name
    );

    const cleanVehicleName = vehicle.name.toLowerCase().startsWith(vehicle.brand.toLowerCase())
      ? `${vehicle.name} (${vehicle.year})`
      : `${vehicle.brand} ${vehicle.name} (${vehicle.year})`;

    onOpenNewJobWithData({
      vehicle: cleanVehicleName,
      parts: panelNames,
      metersUsed: calcResult.billedLinearMeters,
      notes: `Patrón calculado en Estudio CAD/Nesting ArmorCut (${calcResult.selectedPanels.length} piezas, ${calcResult.sqMetersTotal} m² neta, rendimiento bobina ${calcResult.nesting.efficiencyPercent}%)`,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* 1. TOP HERO: VEHICLE SELECTOR & MODE SWITCH */}
      <div
        style={{
          background: '#0d1017',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left: Vehicle Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                color: 'var(--accent-red)',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              Estudio 3D & Matriz CAD de Corte
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(230, 25, 55, 0.15)',
                color: 'var(--accent-red)',
                border: '1px solid var(--accent-red-border)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              {vehicle.badge}
            </span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {vehicle.name}
          </h2>
        </div>

        {/* Center: Vehicle Models Carousel / Quick Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Object.values(VEHICLE_CATALOG).map((v) => {
            const isSelected = selectedVehicleId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVehicleId(v.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#ffffff' : '#8893a4',
                  background: isSelected ? 'var(--accent-red)' : '#141822',
                  border: isSelected ? '1px solid var(--accent-red-hover)' : '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 12px var(--accent-red-glow)' : 'none',
                }}
              >
                {v.id === 'golf_gti_mk7' && '🏎️ Golf GTI MK7'}
                {v.id === 'porsche_gt3' && '🏁 911 GT3 RS'}
                {v.id === 'audi_rs3' && '⭕ Audi RS3'}
                {v.id === 'peugeot_208' && '🦁 208 Sport'}
                {v.id === 'toyota_hilux' && '🛻 Hilux GR'}
              </button>
            );
          })}
        </div>

        {/* Right: Mode Switch (3D Showroom vs 2D CAD) */}
        <div
          style={{
            display: 'flex',
            background: '#07090e',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px',
            borderRadius: '10px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setDisplayMode('3D')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: displayMode === '3D' ? 700 : 500,
              color: displayMode === '3D' ? '#ffffff' : '#8893a4',
              background: displayMode === '3D' ? 'var(--accent-red)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              boxShadow: displayMode === '3D' ? '0 0 10px var(--accent-red-glow)' : 'none',
            }}
          >
            <Box style={{ width: 14, height: 14 }} />
            Showroom 3D
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('CAD')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: displayMode === 'CAD' ? 700 : 500,
              color: displayMode === 'CAD' ? '#ffffff' : '#8893a4',
              background: displayMode === 'CAD' ? 'var(--accent-red)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              boxShadow: displayMode === 'CAD' ? '0 0 10px var(--accent-red-glow)' : 'none',
            }}
          >
            <LayoutGrid style={{ width: 14, height: 14 }} />
            Plano CAD 2.5D
          </button>
        </div>
      </div>

      {/* 2. PRESETS BAR & QUICK ACTIONS */}
      <div
        style={{
          background: '#0a0d14',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#626d7d', fontWeight: 600 }}>Kits Preconfigurados:</span>
          {PACKAGE_PRESETS.map((preset) => {
            const isPresetActive =
              preset.recommendedPanelIds.every((id) => selectedPanelIds.includes(id)) &&
              preset.recommendedPanelIds.length === selectedPanelIds.length;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.recommendedPanelIds)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: isPresetActive ? 700 : 500,
                  color: isPresetActive ? '#ffffff' : '#cbd5e1',
                  background: isPresetActive ? 'var(--accent-red-subtle)' : '#141822',
                  border: isPresetActive ? '1px solid var(--accent-red)' : '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                }}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleClearPanels}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#8893a4',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
          }}
        >
          <RotateCcw style={{ width: 12, height: 12 }} />
          Limpiar Selección
        </button>
      </div>

      {/* 3. MAIN WORKSPACE: CANVAS (LEFT) & METRICS/CHECKLIST (RIGHT) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px' }}>
        {/* Left Column: 3D or 2D CAD Viewport */}
        <div
          style={{
            background: '#0a0d14',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
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
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <RollNestingVisualizer
              selectedPanels={calcResult.selectedPanels}
              nesting={calcResult.nesting}
              billedLinearMeters={calcResult.billedLinearMeters}
              activeRoll={activeRoll}
              onSelectRoll={setSelectedRollId}
              availableRolls={rolls.filter((r) => r.status === 'ACTIVE')}
            />
          </div>
        </div>

        {/* Right Column: Order Calculator & Panel Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary / Price Card */}
          <div
            style={{
              background: '#0d1017',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: '#8893a4', fontWeight: 600 }}>
                Consumo & Estimación
              </span>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontWeight: 700 }}>
                {calcResult.selectedPanels.length} piezas
              </span>
            </div>

            {/* Big Metrics Display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#07090e', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '12px' }}>
                <span style={{ fontSize: '10px', color: '#626d7d', display: 'block', marginBottom: '2px' }}>Metros Lineales</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
                  {calcResult.billedLinearMeters.toFixed(2)}m
                </span>
                <span style={{ fontSize: '9px', color: '#8893a4', display: 'block', marginTop: '2px' }}>
                  (incluye 10% margen)
                </span>
              </div>

              <div style={{ background: '#07090e', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '12px' }}>
                <span style={{ fontSize: '10px', color: '#626d7d', display: 'block', marginBottom: '2px' }}>Tiempo Instalación</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {calcResult.totalLaborHours.toFixed(1)}h
                </span>
                <span style={{ fontSize: '9px', color: '#8893a4', display: 'block', marginTop: '2px' }}>
                  {calcResult.sqMetersTotal.toFixed(1)} m² chapa
                </span>
              </div>
            </div>

            {/* Financial Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8893a4' }}>
                <span>Material ({materialGrade}):</span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>${calcResult.materialCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8893a4' }}>
                <span>Mano de Obra Certificada:</span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>${calcResult.laborCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8893a4' }}>
                <span>Preparación & Descontaminado:</span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>${calcResult.prepCost.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#ffffff',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '8px',
                  marginTop: '4px',
                }}
              >
                <span>Total Estimado Taller:</span>
                <span style={{ color: 'var(--accent-red-hover)', fontFamily: 'var(--font-mono)' }}>
                  ${calcResult.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* CTAs: Transfer to NewJobModal & Export to Plotter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleTransferToJob}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'var(--accent-red)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 20px var(--accent-red-glow)',
                }}
              >
                <Scissors style={{ width: 16, height: 16 }} />
                Descontar en Bobina / Crear Orden
              </button>

              <button
                type="button"
                onClick={() => setIsPlotterModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  background: '#141822',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                }}
              >
                <Cpu style={{ width: 15, height: 15 }} />
                Exportar Comandos a Plotter
              </button>
            </div>
          </div>

          {/* Panel Despiece Checklist */}
          <div
            style={{
              background: '#0d1017',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '440px',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: '#8893a4', fontWeight: 600 }}>
                Despiece Individual ({selectedPanelIds.length}/{STANDARD_PANELS.length})
              </span>
            </div>

            {/* Category filter pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {(
                [
                  { id: 'ALL', label: 'Todos' },
                  { id: 'FRONT', label: 'Frente' },
                  { id: 'SIDES', label: 'Lados' },
                  { id: 'REAR_ROOF', label: 'Techo/Tras.' },
                  { id: 'MICRO', label: 'Micro' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(f.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    fontSize: '10px',
                    fontWeight: activeCategoryFilter === f.id ? 700 : 500,
                    color: activeCategoryFilter === f.id ? '#ffffff' : '#626d7d',
                    background: activeCategoryFilter === f.id ? '#1f2432' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Panel List Scrollable */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredPanels.map((panel) => {
                const isSel = selectedPanelIds.includes(panel.id);
                return (
                  <div
                    key={panel.id}
                    onClick={() => togglePanel(panel.id)}
                    onMouseEnter={() => setHoveredPanelId(panel.id)}
                    onMouseLeave={() => setHoveredPanelId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(230, 25, 55, 0.12)' : '#07090e',
                      border: isSel ? '1px solid var(--accent-red-border)' : '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '4px',
                          border: isSel ? 'none' : '1px solid #434c59',
                          background: isSel ? 'var(--accent-red)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSel && <Check style={{ width: 12, height: 12, color: '#ffffff' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: isSel ? '#ffffff' : '#cbd5e1' }}>
                          {panel.spanishName || panel.name}
                        </div>
                        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#626d7d' }}>
                          {panel.cutLength}m lineal · {panel.sqMeters} m² · {panel.laborHours}h
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#141822',
                        color: panel.difficulty === 'EXPERTO' ? '#ef4444' : panel.difficulty === 'ALTA' ? '#f59e0b' : '#94a3b8',
                      }}
                    >
                      {panel.difficulty}
                    </span>
                  </div>
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
