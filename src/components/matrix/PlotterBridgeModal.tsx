'use client';

import React, { useState } from 'react';
import { NestingResult } from '@/types/ppf';
import {
  generateHPGL2,
  generateGPGL,
  generateCuttingSVG,
  downloadFile,
  DEFAULT_PLOTTER_CONFIG,
  PlotterConfig,
} from '@/utils/plotterCommands';
import { Download, Cpu, X } from 'lucide-react';

interface PlotterBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nesting: NestingResult;
  vehicleName: string;
}

export const PlotterBridgeModal: React.FC<PlotterBridgeModalProps> = ({
  isOpen,
  onClose,
  nesting,
  vehicleName,
}) => {
  const [plotterBrand, setPlotterBrand] = useState<'GRAPHTEC' | 'ROLAND' | 'SUMMA' | 'GENERIC'>('GRAPHTEC');
  const [config, setConfig] = useState<PlotterConfig>(DEFAULT_PLOTTER_CONFIG);
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'SETTINGS'>('PREVIEW');
  const [isSendingSerial, setIsSendingSerial] = useState(false);
  const [serialStatus, setSerialStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGPGLEnabled = plotterBrand === 'GRAPHTEC';
  const commandOutput = isGPGLEnabled
    ? generateGPGL(nesting.placements, config)
    : generateHPGL2(nesting.placements, config);

  const handleDownloadPLT = () => {
    const filename = `${vehicleName.toLowerCase().replace(/\s+/g, '_')}_cut_${Date.now()}.plt`;
    downloadFile(commandOutput, filename, 'text/plain');
  };

  const handleDownloadSVG = () => {
    const svgContent = generateCuttingSVG(nesting.placements, nesting.totalLinearMeters);
    const filename = `${vehicleName.toLowerCase().replace(/\s+/g, '_')}_patterns.svg`;
    downloadFile(svgContent, filename, 'image/svg+xml');
  };

  const handleConnectSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Tu navegador no soporta Web Serial API (se requiere Chrome o Edge).');
      return;
    }

    try {
      setIsSendingSerial(true);
      setSerialStatus('Selecciona el puerto USB del plotter...');
      // @ts-expect-error Web Serial API
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSerialStatus('Conectado. Transmitiendo vectores...');

      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      await writer.write(encoder.encode(commandOutput));
      writer.releaseLock();
      await port.close();

      setSerialStatus('Corte transmitido exitosamente al plotter.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setSerialStatus(`Error de conexión USB: ${message}`);
    } finally {
      setIsSendingSerial(false);
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
          <div>
            <div
              className="mono"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              EXPORTACIÓN DE VECTORES · {nesting.placements.length} PIEZAS ({nesting.totalLinearMeters}M)
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>
              {vehicleName}
            </h3>
          </div>

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

        {/* Brand & Format Selector */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'GRAPHTEC', label: 'Graphtec (GP-GL)' },
                { id: 'ROLAND', label: 'Roland (HP-GL/2)' },
                { id: 'SUMMA', label: 'Summa (HP-GL/2)' },
                { id: 'GENERIC', label: 'HP-GL Estándar' },
              ] as const
            ).map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => setPlotterBrand(brand.id)}
                className="btn btn-sm"
                style={{
                  background: plotterBrand === brand.id ? 'var(--bg-card-hover)' : 'transparent',
                  color: plotterBrand === brand.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderColor: plotterBrand === brand.id ? 'var(--border-highlight)' : 'transparent',
                }}
              >
                {brand.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('PREVIEW')}
              className="btn btn-sm"
              style={{
                background: activeTab === 'PREVIEW' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'PREVIEW' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              Comandos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SETTINGS')}
              className="btn btn-sm"
              style={{
                background: activeTab === 'SETTINGS' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'SETTINGS' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              Cuchilla
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: 'var(--space-5) var(--space-6)', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'PREVIEW' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <pre
                className="mono"
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  lineHeight: 1.6,
                }}
              >
                {commandOutput}
              </pre>

              {serialStatus && (
                <div
                  className="mono"
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  {serialStatus}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  <span>Velocidad de Cuchilla</span>
                  <span className="mono">{config.knifeSpeedCmS} cm/s</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={config.knifeSpeedCmS}
                  onChange={(e) => setConfig({ ...config, knifeSpeedCmS: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-red)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  <span>Presión de Corte (PPF 8.5 mils)</span>
                  <span className="mono">{config.cuttingForceGrams} g</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={config.cuttingForceGrams}
                  onChange={(e) => setConfig({ ...config, cuttingForceGrams: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-red)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  <span>Compensación de Punta (Offset)</span>
                  <span className="mono">{config.offsetMm} mm</span>
                </label>
                <input
                  type="range"
                  min="0.10"
                  max="0.50"
                  step="0.05"
                  value={config.offsetMm}
                  onChange={(e) => setConfig({ ...config, offsetMm: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-red)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleDownloadPLT} className="btn btn-secondary btn-sm">
              <Download size={13} />
              <span>Descargar .PLT</span>
            </button>

            <button type="button" onClick={handleDownloadSVG} className="btn btn-secondary btn-sm">
              <Download size={13} />
              <span>Descargar .SVG</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleConnectSerial}
            disabled={isSendingSerial}
            className="btn btn-primary btn-sm"
          >
            <Cpu size={13} />
            <span>{isSendingSerial ? 'Transmitiendo...' : 'Transmitir por USB'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
