'use client';

import React from 'react';
import { Layers, Plus, Scissors, Database, Download, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface HeaderProps {
  shopName: string;
  totalMeters: number;
  activeRollsCount: number;
  lowStockCount: number;
  scrapRate: number;
  onOpenNewRoll: () => void;
  onOpenNewJob: () => void;
  onOpenSupabaseGuide: () => void;
  onExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shopName,
  totalMeters,
  activeRollsCount,
  lowStockCount,
  scrapRate,
  onOpenNewRoll,
  onOpenNewJob,
  onOpenSupabaseGuide,
  onExportCSV,
}) => {
  const isCloudConnected = isSupabaseConfigured();

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(15, 20, 28, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f0ff 0%, #0077b6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
          }}>
            <Layers size={24} color="#050b14" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(90deg, #ffffff 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                ARMORCUT
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'rgba(0, 240, 255, 0.15)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                letterSpacing: '0.05em',
              }}>
                PPF PRO
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {shopName || 'PLUSCARS DETAILING'} • CONTROL DE STOCK & MERMAS
            </div>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(21, 27, 38, 0.7)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Stock Total</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{totalMeters} m</strong>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Bobinas Activas</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{activeRollsCount}</strong>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>% Scrap (Merma)</span>
            <strong style={{ color: scrapRate > 10 ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '0.95rem' }}>
              {scrapRate}%
            </strong>
          </div>

          {lowStockCount > 0 && (
            <>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--color-warning)',
                fontWeight: 600,
              }}>
                <AlertTriangle size={15} />
                <span>{lowStockCount} por agotarse</span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons & Cloud Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Cloud Badge */}
          <button
            onClick={onOpenSupabaseGuide}
            title={isCloudConnected ? "Conectado a Supabase PostgreSQL" : "Modo Local / Clic para conectar Supabase $0"}
            style={{
              background: isCloudConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${isCloudConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              color: isCloudConnected ? 'var(--color-success)' : 'var(--color-warning)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <Database size={14} />
            <span>{isCloudConnected ? 'Supabase Nube' : 'Modo Demo ($0 DB)'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCSV}
            className="btn btn-secondary btn-sm"
            title="Descargar reporte en Excel / CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          {/* New Job Button */}
          <button
            onClick={onOpenNewJob}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'var(--accent-cyan-dark)', color: 'var(--accent-cyan)' }}
          >
            <Scissors size={15} />
            <span>+ Registrar Corte</span>
          </button>

          {/* New Roll Button */}
          <button
            onClick={onOpenNewRoll}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>+ Nueva Bobina</span>
          </button>
        </div>
      </div>
    </header>
  );
};
