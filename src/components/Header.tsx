'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface HeaderProps {
  shopName: string;
  totalMeters: number;
  activeRollsCount: number;
  lowStockCount: number;
  totalJobsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  shopName,
  totalMeters,
  activeRollsCount,
  lowStockCount,
  totalJobsCount,
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
          if (!error) {
            setConnectionStatus('connected');
          } else {
            console.warn('Supabase ping check failed:', error.message);
            setConnectionStatus('local');
          }
        }
      } catch (err) {
        console.warn('Supabase connection error:', err);
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
        {/* Top / Brand Row */}
        <div className="header-top-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff1a3c 0%, #990f23 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(230, 25, 55, 0.45)',
              flexShrink: 0,
            }}>
              <Layers size={22} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="header-brand-title" style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  ARMORCUT
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(230, 25, 55, 0.15)',
                  color: 'var(--accent-red)',
                  border: '1px solid rgba(230, 25, 55, 0.35)',
                  letterSpacing: '0.05em',
                }}>
                  PPF PRO
                </span>
              </div>
              <div className="header-brand-sub" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {shopName || 'PLUSCARS DETAILING'} • STOCK & CORTES
              </div>
            </div>
          </div>

          {/* Cloud Status Pill (Visible on top right on mobile, and right on desktop) */}
          <div style={{ flexShrink: 0 }}>
            {connectionStatus === 'connected' && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  borderRadius: 'var(--radius-md)',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)',
                }}
                title="Base de datos PostgreSQL en Supabase conectada"
              >
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                  display: 'inline-block',
                }} />
                <CheckCircle2 size={13} color="#34d399" />
                <span>Supabase Conectado</span>
              </div>
            )}

            {connectionStatus === 'checking' && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-md)',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Database size={12} />
                <span>Conectando...</span>
              </div>
            )}

            {connectionStatus === 'local' && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: 'var(--color-warning)',
                  borderRadius: 'var(--radius-md)',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Guardando en almacenamiento local del navegador"
              >
                <Database size={12} />
                <span>Modo Local</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="kpi-bar">
          <div className="kpi-item">
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Stock Total</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{totalMeters} m</strong>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-item">
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Bobinas Activas</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{activeRollsCount}</strong>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-item">
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Cortes Realizados</span>
            <strong style={{ color: 'var(--accent-red)', fontSize: '0.95rem' }}>
              {totalJobsCount}
            </strong>
          </div>

          {lowStockCount > 0 && (
            <div className="kpi-alert-item" style={{
              alignItems: 'center',
              gap: '5px',
              color: 'var(--color-warning)',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}>
              <AlertTriangle size={14} />
              <span>{lowStockCount} por agotarse</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
