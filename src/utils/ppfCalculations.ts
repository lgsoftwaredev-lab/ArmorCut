import { STANDARD_PANELS, MATERIALS, VEHICLE_CATALOG } from '../data/materialsAndPanels';
import { MaterialGrade, VehiclePanel, NestingResult, NestingPlacement } from '../types/ppf';

export interface CalculationResult {
  selectedPanels: VehiclePanel[];
  rawLinearMeters: number;
  nestedLinearMeters: number;
  wasteMarginPercent: number; // e.g. 10%
  billedLinearMeters: number;
  materialUnitPrice: number;
  materialCost: number;
  prepCost: number;
  totalLaborHours: number;
  laborRatePerHour: number;
  laborCost: number;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  totalPrice: number;
  sqMetersTotal: number;
  scaleFactor: number;
  nesting: NestingResult;
}

/**
 * Motor de empaquetado y cálculo de bobina PPF de 1.52m (60")
 * Aplica factor de escala por categoría de vehículo y calcula anidado 2D.
 */
export function calculatePPFJob({
  panelIds,
  materialGrade,
  vehicleModelId = 'golf_gti_mk7',
  wasteMarginPercent = 10,
  laborRatePerHour = 45,
  prepCost = 65,
  taxPercent = 21,
}: {
  panelIds: string[];
  materialGrade: MaterialGrade;
  vehicleModelId?: string;
  wasteMarginPercent?: number;
  laborRatePerHour?: number;
  prepCost?: number;
  taxPercent?: number;
}): CalculationResult {
  const profile = VEHICLE_CATALOG[vehicleModelId] || VEHICLE_CATALOG.golf_gti_mk7;
  const scale = profile ? profile.scaleFactor : 1.0;

  const selectedPanels = STANDARD_PANELS.filter((p) => panelIds.includes(p.id)).map((p) => ({
    ...p,
    cutLength: Number((p.cutLength * scale).toFixed(2)),
    sqMeters: Number((p.sqMeters * scale).toFixed(2)),
    laborHours: Number((p.laborHours * Math.sqrt(scale)).toFixed(1)),
  }));

  const material = MATERIALS[materialGrade] || MATERIALS.PREMIUM;

  if (selectedPanels.length === 0) {
    return {
      selectedPanels: [],
      rawLinearMeters: 0,
      nestedLinearMeters: 0,
      wasteMarginPercent,
      billedLinearMeters: 0,
      materialUnitPrice: material.salePricePerMeter,
      materialCost: 0,
      prepCost: 0,
      totalLaborHours: 0,
      laborRatePerHour,
      laborCost: 0,
      subtotal: 0,
      taxPercent,
      taxAmount: 0,
      totalPrice: 0,
      sqMetersTotal: 0,
      scaleFactor: scale,
      nesting: {
        totalLinearMeters: 0,
        wasteLinearMeters: 0,
        efficiencyPercent: 100,
        placements: [],
      },
    };
  }

  // Metros lineales brutos si se cortaran uno tras otro sin optimizar
  const rawLinear = selectedPanels.reduce((sum, p) => sum + p.cutLength, 0);
  const sqMetersTotal = selectedPanels.reduce((sum, p) => sum + p.sqMeters, 0);
  const totalLaborHours = selectedPanels.reduce((sum, p) => sum + p.laborHours, 0);

  // Algoritmo de Anidado 2D en Bobina de 1.52m
  // - Paneles anchos (> 1.15m) ocupan todo el ancho del rollo
  // - Paneles medianos y pequeños se colocan lado a lado hasta cubrir 1.52m
  const placements: NestingPlacement[] = [];
  let currentY = 0;
  
  // Separamos paneles grandes de paneles que pueden compartir franja
  const sortedPanels = [...selectedPanels].sort((a, b) => b.cutWidth - a.cutWidth);
  const widePanels = sortedPanels.filter((p) => p.cutWidth > 1.10);
  const smallPanels = sortedPanels.filter((p) => p.cutWidth <= 1.10);

  // Ubicar paneles anchos
  for (const wp of widePanels) {
    placements.push({
      panelId: wp.id,
      panelName: wp.spanishName || wp.name,
      x: 0,
      y: currentY,
      width: wp.cutWidth,
      length: wp.cutLength,
      rotated: false,
    });
    currentY += wp.cutLength;
  }

  // Agrupar piezas pequeñas en niveles (Shelves)
  let shelfX = 0;
  let shelfMaxLen = 0;
  let shelfY = currentY;

  for (const sp of smallPanels) {
    if (shelfX + sp.cutWidth <= 1.52) {
      placements.push({
        panelId: sp.id,
        panelName: sp.spanishName || sp.name,
        x: shelfX,
        y: shelfY,
        width: sp.cutWidth,
        length: sp.cutLength,
        rotated: false,
      });
      shelfX += sp.cutWidth;
      shelfMaxLen = Math.max(shelfMaxLen, sp.cutLength);
    } else {
      // Iniciar nuevo nivel
      shelfY += shelfMaxLen;
      shelfX = 0;
      shelfMaxLen = sp.cutLength;
      placements.push({
        panelId: sp.id,
        panelName: sp.spanishName || sp.name,
        x: 0,
        y: shelfY,
        width: sp.cutWidth,
        length: sp.cutLength,
        rotated: false,
      });
      shelfX += sp.cutWidth;
    }
  }

  const nestedLength = Number((shelfY + shelfMaxLen).toFixed(2));
  const billedLinearMeters = Number((nestedLength * (1 + wasteMarginPercent / 100)).toFixed(2));

  // Rendimiento de material (% de aprovechamiento del área de film)
  const totalFilmArea = nestedLength * 1.52;
  const efficiencyPercent = totalFilmArea > 0 ? Math.min(95, Math.round((sqMetersTotal / totalFilmArea) * 100)) : 85;

  const materialCost = Number((billedLinearMeters * material.salePricePerMeter).toFixed(2));
  const laborCost = Number((totalLaborHours * laborRatePerHour).toFixed(2));
  const actualPrep = selectedPanels.length > 0 ? prepCost : 0;
  const subtotal = Number((materialCost + laborCost + actualPrep).toFixed(2));
  const taxAmount = Number(((subtotal * taxPercent) / 100).toFixed(2));
  const totalPrice = Number((subtotal + taxAmount).toFixed(2));

  return {
    selectedPanels,
    rawLinearMeters: Number(rawLinear.toFixed(2)),
    nestedLinearMeters: nestedLength,
    wasteMarginPercent,
    billedLinearMeters,
    materialUnitPrice: material.salePricePerMeter,
    materialCost,
    prepCost: actualPrep,
    totalLaborHours: Number(totalLaborHours.toFixed(1)),
    laborRatePerHour,
    laborCost,
    subtotal,
    taxPercent,
    taxAmount,
    totalPrice,
    sqMetersTotal: Number(sqMetersTotal.toFixed(2)),
    scaleFactor: scale,
    nesting: {
      totalLinearMeters: nestedLength,
      wasteLinearMeters: Number((rawLinear - nestedLength).toFixed(2)),
      efficiencyPercent,
      placements,
    },
  };
}
