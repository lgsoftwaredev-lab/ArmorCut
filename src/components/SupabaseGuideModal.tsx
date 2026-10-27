'use client';

import React, { useState } from 'react';
import { Database, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const isConnected = isSupabaseConfigured();

  if (!isOpen) return null;

  const copySQL = () => {
    const sqlScript = `-- ARMORCUT PPF - PLUSCARS DETAILING SOFTWARE
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS ppf_rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    finish VARCHAR(50) NOT NULL DEFAULT 'GLOSS',
    width_meters NUMERIC(6, 2) NOT NULL DEFAULT 1.52,
    initial_meters NUMERIC(6, 2) NOT NULL,
    current_meters NUMERIC(6, 2) NOT NULL,
    cost_per_roll NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    batch_number VARCHAR(100),
    location VARCHAR(100) NOT NULL DEFAULT 'Rack Principal',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ppf_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_id UUID REFERENCES ppf_rolls(id) ON DELETE SET NULL,
    roll_code VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    finish VARCHAR(50) NOT NULL,
    vehicle VARCHAR(150) NOT NULL,
    license_plate VARCHAR(50),
    client_name VARCHAR(150) NOT NULL,
    work_order_number VARCHAR(50),
    installer VARCHAR(100) NOT NULL,
    parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    meters_used NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    meters_scrap NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    scrap_reason VARCHAR(100),
    scrap_notes TEXT,
    cost_calculated NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    job_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS ppf_offcuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_roll_id UUID REFERENCES ppf_rolls(id) ON DELETE SET NULL,
    parent_roll_code VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    finish VARCHAR(50) NOT NULL,
    width_cm NUMERIC(6, 2) NOT NULL,
    length_cm NUMERIC(6, 2) NOT NULL,
    storage_location VARCHAR(100) NOT NULL DEFAULT 'Cajón de Retazos',
    suggested_use TEXT DEFAULT 'Espejos, B-Pillars, Tazas de Puerta, Pantalla',
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    used_in_job_id UUID REFERENCES ppf_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS ppf_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    shop_name VARCHAR(150) NOT NULL DEFAULT 'PLUSCARS DETAILING',
    low_stock_threshold_meters NUMERIC(6, 2) NOT NULL DEFAULT 3.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ppf_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppf_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppf_offcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppf_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo anon en ppf_rolls" ON ppf_rolls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo anon en ppf_jobs" ON ppf_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo anon en ppf_offcuts" ON ppf_offcuts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo anon en ppf_settings" ON ppf_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO ppf_settings (id, shop_name, low_stock_threshold_meters, currency)
VALUES ('default', 'PLUSCARS DETAILING', 3.00, 'USD')
ON CONFLICT (id) DO NOTHING;`;

    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={22} color="var(--accent-red)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Conexión a Supabase ($0 de Mantenimiento)
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Status Badge */}
          <div style={{
            background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <ShieldCheck size={24} color={isConnected ? 'var(--color-success)' : 'var(--color-warning)'} />
            <div>
              <strong style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '0.9rem' }}>
                {isConnected ? '✓ Supabase PostgreSQL Conectado y Sincronizado' : 'Modo Demostración / Esperando Credenciales de Supabase'}
              </strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {isConnected
                  ? 'Todos los datos se están guardando en tu base de datos cloud en tiempo real para todos los dispositivos.'
                  : 'El sistema funciona de forma local con datos de muestra. Sigue los 3 pasos a continuación para activar tu base de datos gratuita.'}
              </div>
            </div>
          </div>

          {/* 3 Steps Guide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--bg-input)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                1
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Crear cuenta gratuita en Supabase</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Ingresa en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-red)', textDecoration: 'underline' }}>supabase.com</a> y crea un nuevo proyecto (plan Free $0, sin tarjeta de crédito).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--bg-input)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Ejecutar el script SQL de creación de tablas</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '8px' }}>
                  En tu panel de Supabase ve a <strong>SQL Editor</strong> &gt; <strong>New query</strong>, pega el script y pulsa <strong>Run</strong>:
                </p>
                <button
                  type="button"
                  onClick={copySQL}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                  <span>{copied ? '¡Script SQL Copiado al Portapapeles!' : 'Copiar Script SQL Completo (supabase-schema.sql)'}</span>
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--bg-input)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                3
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Pegar las credenciales en Vercel o en local</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  En Supabase ve a <strong>Project Settings</strong> &gt; <strong>API</strong> y copia:
                </p>
                <div style={{
                  background: 'var(--bg-input)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                  lineHeight: '1.6',
                }}>
                  NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co<br />
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-publica
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  En <strong>Vercel</strong> agrégalas en <strong>Settings &gt; Environment Variables</strong>. ¡Y listo, la web queda conectada para siempre!
                </p>
              </div>
            </div>
          </div>

          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
            <button onClick={onClose} className="btn btn-primary">
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
