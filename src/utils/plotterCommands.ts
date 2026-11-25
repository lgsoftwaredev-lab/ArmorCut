import { VehiclePanel, NestingPlacement } from '../types/ppf';

export interface PlotterConfig {
  knifeSpeedCmS: number;       // e.g. 40 cm/s
  cuttingForceGrams: number;   // e.g. 18 (Graphtec scale 1-31)
  offsetMm: number;            // e.g. 0.25mm blade offset
  acceleration: number;        // e.g. 2
  curveQuality: 'STANDARD' | 'HIGH_PRECISION';
}

export const DEFAULT_PLOTTER_CONFIG: PlotterConfig = {
  knifeSpeedCmS: 40,
  cuttingForceGrams: 18,
  offsetMm: 0.25,
  acceleration: 2,
  curveQuality: 'HIGH_PRECISION',
};

/**
 * Genera código vectorial industrial HP-GL/2 para plotters Graphtec / Roland / Summa
 * 1 unidad HP-GL = 0.025 mm (40 unidades = 1 mm, 40,000 unidades = 1 metro)
 */
export function generateHPGL2(
  placements: NestingPlacement[],
  config: PlotterConfig = DEFAULT_PLOTTER_CONFIG
): string {
  const HPGL_UNITS_PER_METER = 40000;

  const lines: string[] = [
    '// ARMORCUT PPF PLOTTER OUTPUT - HP-GL/2 PROTOCOL',
    '// Generado para bobina 1.52m (60 pulgadas)',
    'IN;',                          // Initialize plotter
    'SC0,1.52,0,15.0;',            // User scale setup (meters)
    `VS${config.knifeSpeedCmS};`,  // Velocity
    `FS${config.cuttingForceGrams};`, // Cutting Force
    'SP1;',                        // Select tool (Swivel Blade 1)
  ];

  placements.forEach((item, idx) => {
    const xMin = Math.round(item.x * HPGL_UNITS_PER_METER);
    const yMin = Math.round(item.y * HPGL_UNITS_PER_METER);
    const xMax = Math.round((item.x + item.width) * HPGL_UNITS_PER_METER);
    const yMax = Math.round((item.y + item.length) * HPGL_UNITS_PER_METER);

    lines.push(`// PIEZA [${idx + 1}]: ${item.panelName} (${item.width}m x ${item.length}m)`);
    // Transit to origin with blade UP
    lines.push(`PU${xMin},${yMin};`);
    // Blade DOWN and cut perimeter rectangle with wrapped margin
    lines.push('PD;');
    lines.push(`PA${xMax},${yMin};`);
    lines.push(`PA${xMax},${yMax};`);
    lines.push(`PA${xMin},${yMax};`);
    lines.push(`PA${xMin},${yMin};`);
    lines.push('PU;'); // Blade UP after cut
  });

  // Finish and feed page forward for easy weeding
  lines.push('PU0,0;');
  lines.push('PG;'); // Advance page
  lines.push('IN;');

  return lines.join('\n');
}

/**
 * Genera código GP-GL (Graphtec Standard Native Format)
 */
export function generateGPGL(
  placements: NestingPlacement[],
  config: PlotterConfig = DEFAULT_PLOTTER_CONFIG
): string {
  const GPGL_UNITS_PER_METER = 10000; // 0.1 mm resolution

  const lines: string[] = [
    '',                             // STX
    'J0',                            // Step size setup
    `!${config.knifeSpeedCmS}`,      // Velocity
    `FX${config.cuttingForceGrams}`, // Force
  ];

  placements.forEach((item) => {
    const x1 = Math.round(item.x * GPGL_UNITS_PER_METER);
    const y1 = Math.round(item.y * GPGL_UNITS_PER_METER);
    const x2 = Math.round((item.x + item.width) * GPGL_UNITS_PER_METER);
    const y2 = Math.round((item.y + item.length) * GPGL_UNITS_PER_METER);

    lines.push(`M${x1},${y1}`);     // Move (PU)
    lines.push(`D${x2},${y1}`);     // Draw (PD)
    lines.push(`D${x2},${y2}`);
    lines.push(`D${x1},${y2}`);
    lines.push(`D${x1},${y1}`);
  });

  lines.push('H');                  // Home
  lines.push('');                  // ETX

  return lines.join('\n');
}

/**
 * Genera archivo SVG vectorial a escala 1:1 para corte directo o importación en CorelDraw / Illustrator
 */
export function generateCuttingSVG(
  placements: NestingPlacement[],
  totalLengthMeters: number
): string {
  const rollWidthMm = 1520; // 1.52m en mm
  const rollLengthMm = Math.max(1000, Math.round(totalLengthMeters * 1000));

  const rects = placements
    .map((item, idx) => {
      const x = (item.x * 1000).toFixed(1);
      const y = (item.y * 1000).toFixed(1);
      const w = (item.width * 1000).toFixed(1);
      const h = (item.length * 1000).toFixed(1);

      return `
    <!-- ${item.panelName} -->
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="15" fill="none" stroke="#e61937" stroke-width="1.5" />
    <text x="${Number(x) + 20}" y="${Number(y) + 35}" font-family="Arial" font-size="22" font-weight="bold" fill="#000000">${idx + 1}. ${item.panelName}</text>
    <text x="${Number(x) + 20}" y="${Number(y) + 65}" font-family="Arial" font-size="16" fill="#666666">${item.width}m x ${item.length}m</text>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${rollWidthMm}mm" height="${rollLengthMm}mm" viewBox="0 0 ${rollWidthMm} ${rollLengthMm}">
  <!-- ARMORCUT PPF 1.52m ROLL VECTOR CUT TEMPLATE -->
  <rect x="0" y="0" width="${rollWidthMm}" height="${rollLengthMm}" fill="#ffffff" stroke="#cccccc" stroke-width="1" />
  ${rects}
</svg>`;
}

/**
 * Dispara descarga de archivo en el navegador
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
