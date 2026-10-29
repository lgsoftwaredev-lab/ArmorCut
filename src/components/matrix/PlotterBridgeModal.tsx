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
import { Scissors, Download, Cpu, X, Check, Sliders, AlertTriangle } from 'lucide-react';

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

  // Web Serial API (Direct USB connection to plotter)
  const handleConnectSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Tu navegador no soporta la Web Serial API (se requiere Google Chrome o Microsoft Edge).');
      return;
    }

    try {
      setIsSendingSerial(true);
      setSerialStatus('Selecciona el puerto USB del plotter...');
      // @ts-expect-error Web Serial API
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSerialStatus('Conectado. Enviando comandos vectoriales...');

      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      await writer.write(encoder.encode(commandOutput));
      writer.releaseLock();
      await port.close();

      setSerialStatus('¡Corte transmitido exitosamente al plotter!');
    } catch (err: unknown) {
      console.error('Error streaming to serial plotter:', err);
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setSerialStatus(`Error de conexión USB: ${message}`);
    } finally {
      setIsSendingSerial(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 7, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#0e1118',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(12, 14, 20, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'rgba(230, 25, 55, 0.15)',
                border: '1px solid var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-red)',
              }}
            >
              <Cpu style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Puente Hardware Plotter & Exportación Vectorial
              </h3>
              <p style={{ fontSize: '11px', color: '#8893a4', margin: '2px 0 0 0' }}>
                {vehicleName} · {nesting.placements.length} paneles anidados ({nesting.totalLinearMeters}m)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8893a4',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Roadmap Phase 4 Information Notice */}
        <div
          style={{
            padding: '10px 24px',
            background: 'rgba(56, 189, 248, 0.08)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            FASE 4 · ROADMAP
          </span>
          <span style={{ fontSize: '11px', color: '#93c5fd', lineHeight: 1.4 }}>
            Feature asentado en especificación técnica (<strong>specs/spec.md</strong>). Exportador vectorial HP-GL/2, GP-GL, SVG y driver Web Serial para integración de plotters industriales (Graphtec / Roland / Summa).
          </span>
        </div>

        {/* Brand & Format Selector */}
        <div
          style={{
            padding: '16px 24px',
            background: '#090b10',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#626d7d', fontWeight: 600 }}>Plotter:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(
                [
                  { id: 'GRAPHTEC', label: 'Graphtec (GP-GL)' },
                  { id: 'ROLAND', label: 'Roland (HP-GL/2)' },
                  { id: 'SUMMA', label: 'Summa (HP-GL/2)' },
                  { id: 'GENERIC', label: 'Genérico HP-GL' },
                ] as const
              ).map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => setPlotterBrand(brand.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: plotterBrand === brand.id ? 700 : 500,
                    color: plotterBrand === brand.id ? '#ffffff' : '#8893a4',
                    background: plotterBrand === brand.id ? 'var(--accent-red)' : '#141822',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {brand.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab preview vs settings */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('PREVIEW')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                color: activeTab === 'PREVIEW' ? '#ffffff' : '#626d7d',
                background: activeTab === 'PREVIEW' ? '#1f2432' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Código
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SETTINGS')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                color: activeTab === 'SETTINGS' ? '#ffffff' : '#626d7d',
                background: activeTab === 'SETTINGS' ? '#1f2432' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Parámetros Cuchilla
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'PREVIEW' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  background: '#05070a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: '#93c5fd',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  lineHeight: '1.6',
                  whiteSpace: 'pre',
                }}
              >
                {commandOutput}
              </div>

              {serialStatus && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {serialStatus}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#9aa4b2', display: 'block', marginBottom: '4px' }}>
                  Velocidad de Cuchilla: {config.knifeSpeedCmS} cm/s
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
                <label style={{ fontSize: '11px', color: '#9aa4b2', display: 'block', marginBottom: '4px' }}>
                  Fuerza / Presión de Corte: {config.cuttingForceGrams} (Calibrado para PPF 8.5 mils)
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
                <label style={{ fontSize: '11px', color: '#9aa4b2', display: 'block', marginBottom: '4px' }}>
                  Blade Offset: {config.offsetMm} mm (Compensación de punta orientable)
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
            padding: '16px 24px',
            background: 'rgba(12, 14, 20, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDownloadPLT}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                background: '#1a202c',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              <Download style={{ width: 14, height: 14 }} />
              Descargar .PLT (Plotter)
            </button>

            <button
              type="button"
              onClick={handleDownloadSVG}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                background: '#1a202c',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              <Download style={{ width: 14, height: 14 }} />
              Descargar .SVG (Escala 1:1)
            </button>
          </div>

          <button
            type="button"
            onClick={handleConnectSerial}
            disabled={isSendingSerial}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
              background: 'var(--accent-red)',
              border: 'none',
              cursor: isSendingSerial ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 15px var(--accent-red-glow)',
            }}
          >
            <Cpu style={{ width: 14, height: 14 }} />
            {isSendingSerial ? 'Transmitiendo...' : 'Transmitir por USB Serial'}
          </button>
        </div>
      </div>
    </div>
  );
};
