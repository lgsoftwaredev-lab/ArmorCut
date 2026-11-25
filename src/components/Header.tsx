'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Scissors, TrendingUp, Box, RotateCcw, AlertTriangle, Play } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PlusCarsLogo } from '@/components/brand/PlusCarsBrand';

export type AppTab = 'ROLLS' | 'JOBS' | 'METRICS' | 'STUDIO';

interface HeaderProps {
  shopName: string;
  totalMeters: number;
  activeRollsCount: number;
  lowStockCount: number;
  totalJobsCount: number;
  rollsCount?: number;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onRefresh: () => void;
  onStartDemo?: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalMeters,
  activeRollsCount,
  lowStockCount,
  totalJobsCount,
  rollsCount = 0,
  activeTab,
  onSelectTab,
  onRefresh,
  onStartDemo,
  isLoading,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'local'>('checking');

  useEffect(() => {
    let isMounted = true;

    async function verifyConnection() {
      if (!isSupabaseConfigured() || !supabase) {
        if (isMounted) setConnectionStatus('local');
        return;
      }

      try {
        const { error } = await supabase.from('ppf_rolls').select('id').limit(1);
        if (isMounted) {
          setConnectionStatus(!error ? 'connected' : 'local');
        }
      } catch {
        if (isMounted) setConnectionStatus('local');
      }
    }

    verifyConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Left: Minimalist Brand Lockup */}
        <div className="header-top-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '8px',
                height: '18px',
                background: 'var(--accent-red)',
                borderRadius: '1px',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
              }}
            >
              ARMORCUT
            </span>
          </div>

          <div className="desktop-cobrand-lockup">
            <div className="cobrand-divider" />
            <PlusCarsLogo height={15} />
          </div>
        </div>

        {/* Center: Integrated Solid Navigation Bar */}
        <nav className="header-nav">
          <button
            type="button"
            onClick={() => onSelectTab('ROLLS')}
            className={`header-nav-btn ${activeTab === 'ROLLS' ? 'active' : ''}`}
          >
            <Layers size={15} />
            <span>Inventario</span>
            <span className="header-nav-count">{rollsCount}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('JOBS')}
            className={`header-nav-btn ${activeTab === 'JOBS' ? 'active' : ''}`}
          >
            <Scissors size={15} />
            <span>Órdenes de Corte</span>
            <span className="header-nav-count">{totalJobsCount}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('METRICS')}
            className={`header-nav-btn ${activeTab === 'METRICS' ? 'active' : ''}`}
          >
            <TrendingUp size={15} />
            <span>Métricas</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('STUDIO')}
            className={`header-nav-btn ${activeTab === 'STUDIO' ? 'active' : ''}`}
          >
            <Box size={15} />
            <span>Studio</span>
          </button>
        </nav>

        {/* Right: Restrained Telemetry & Status */}
        <div className="header-right-bar">
          <div className="kpi-bar">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stock</span>
              <strong className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {totalMeters}m
              </strong>
            </div>

            <div className="kpi-divider" />

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Activas</span>
              <strong className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {activeRollsCount}
              </strong>
            </div>

            {lowStockCount > 0 && (
              <>
                <div className="kpi-divider" />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--color-warning)',
                    fontWeight: 500,
                  }}
                >
                  <AlertTriangle size={13} />
                  <span className="mono">{lowStockCount}</span>
                </div>
              </>
            )}
          </div>

          <div className="cobrand-divider" />

          {/* Subtle Database Indicator + Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
              title={
                connectionStatus === 'connected'
                  ? 'Conectado a Supabase PostgreSQL'
                  : 'Almacenamiento local'
              }
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background:
                    connectionStatus === 'connected'
                      ? 'var(--color-success)'
                      : connectionStatus === 'local'
                      ? 'var(--color-warning)'
                      : 'var(--text-muted)',
                }}
              />
              <span>{connectionStatus === 'connected' ? 'DB' : 'LOCAL'}</span>
            </div>

            {onStartDemo && (
              <button
                type="button"
                onClick={onStartDemo}
                className="btn btn-secondary btn-sm"
                style={{ padding: '5px 10px', gap: '5px' }}
                title="Iniciar demo guiada interactiva"
              >
                <Play size={12} />
                <span>Demo</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="btn btn-secondary btn-sm"
              style={{ padding: '5px 8px' }}
              title="Actualizar datos"
            >
              <RotateCcw
                size={13}
                style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
