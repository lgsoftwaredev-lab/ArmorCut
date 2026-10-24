-- ==============================================================================
-- ARMORCUT PPF - PLUSCARS DETAILING SOFTWARE
-- Supabase PostgreSQL Database Schema (Optimizado para Kryptonite PPF)
-- Medidas: 156cm x 15m (Carrocería) y 120cm x 15m (Parabrisas)
-- ==============================================================================

-- 1. EXTENSIÓN PARA UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA DE BOBINAS (ROLLOS DE PPF KRYPTONITE)
CREATE TABLE IF NOT EXISTS ppf_rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL DEFAULT 'Kryptonite',
    model VARCHAR(100) NOT NULL DEFAULT 'Ultra Gloss',
    finish VARCHAR(50) NOT NULL DEFAULT 'GLOSS',
    width_meters NUMERIC(6, 2) NOT NULL DEFAULT 1.56, -- 1.56m estándar o 1.20m parabrisas
    initial_meters NUMERIC(6, 2) NOT NULL DEFAULT 15.00, -- Siempre 15 metros
    current_meters NUMERIC(6, 2) NOT NULL,
    cost_per_roll NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    batch_number VARCHAR(100),
    location VARCHAR(100) NOT NULL DEFAULT 'Rack Principal',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SEALED, DEPLETED
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA DE TRABAJOS / CONSUMOS (CORTES EXTERNOS Y MERMAS DE INSTALACIÓN)
CREATE TABLE IF NOT EXISTS ppf_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_id UUID REFERENCES ppf_rolls(id) ON DELETE SET NULL,
    roll_code VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL DEFAULT 'Kryptonite',
    finish VARCHAR(50) NOT NULL,
    vehicle VARCHAR(150) NOT NULL,
    license_plate VARCHAR(50),
    client_name VARCHAR(150) NOT NULL,
    work_order_number VARCHAR(50),
    installer VARCHAR(100) NOT NULL,
    cutting_provider VARCHAR(100) DEFAULT 'Centro de Corte Externo',
    parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    meters_used NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    meters_scrap NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    scrap_reason VARCHAR(100),
    scrap_notes TEXT,
    cost_calculated NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    job_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- 4. TABLA DE BANCO DE RETAZOS (SOBRANTES ÚTILES PARA PIEZAS CHICAS)
CREATE TABLE IF NOT EXISTS ppf_offcuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_roll_id UUID REFERENCES ppf_rolls(id) ON DELETE SET NULL,
    parent_roll_code VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL DEFAULT 'Kryptonite',
    finish VARCHAR(50) NOT NULL,
    width_cm NUMERIC(6, 2) NOT NULL,
    length_cm NUMERIC(6, 2) NOT NULL,
    storage_location VARCHAR(100) NOT NULL DEFAULT 'Cajón de Retazos',
    suggested_use TEXT DEFAULT 'Espejos, B-Pillars, Tazas de Puerta, Pantalla',
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, USED, DISCARDED
    used_in_job_id UUID REFERENCES ppf_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- 5. TABLA DE CONFIGURACIÓN DEL TALLER
CREATE TABLE IF NOT EXISTS ppf_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    shop_name VARCHAR(150) NOT NULL DEFAULT 'PLUSCARS DETAILING',
    low_stock_threshold_meters NUMERIC(6, 2) NOT NULL DEFAULT 3.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. POLÍTICAS DE ACCESO (ROW LEVEL SECURITY)
ALTER TABLE ppf_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppf_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppf_offcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppf_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo anon en ppf_rolls" ON ppf_rolls;
CREATE POLICY "Permitir todo anon en ppf_rolls" ON ppf_rolls FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo anon en ppf_jobs" ON ppf_jobs;
CREATE POLICY "Permitir todo anon en ppf_jobs" ON ppf_jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo anon en ppf_offcuts" ON ppf_offcuts;
CREATE POLICY "Permitir todo anon en ppf_offcuts" ON ppf_offcuts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo anon en ppf_settings" ON ppf_settings;
CREATE POLICY "Permitir todo anon en ppf_settings" ON ppf_settings FOR ALL USING (true) WITH CHECK (true);

-- 7. CONFIGURACIÓN INICIAL
INSERT INTO ppf_settings (id, shop_name, low_stock_threshold_meters, currency)
VALUES ('default', 'PLUSCARS DETAILING', 3.00, 'USD')
ON CONFLICT (id) DO NOTHING;

-- 8. DATOS REALES DE EJEMPLO KRYPTONITE (156cm y 120cm x 15m)
INSERT INTO ppf_rolls (code, brand, model, finish, width_meters, initial_meters, current_meters, cost_per_roll, currency, batch_number, location, status, notes)
VALUES 
('KRYP-GL-01', 'Kryptonite', 'Ultra Gloss (Carrocería)', 'GLOSS', 1.56, 15.00, 10.80, 1300.00, 'USD', 'KRYP-2026-A1', 'Rack A - Nivel 1', 'ACTIVE', 'Bobina principal para capots, paragolpes y full front'),
('KRYP-MT-02', 'Kryptonite', 'Satin Matte', 'MATTE', 1.56, 15.00, 4.20, 1450.00, 'USD', 'KRYP-2026-M4', 'Rack A - Nivel 2', 'ACTIVE', 'Para acabados satinados y autos mate'),
('KRYP-WP-03', 'Kryptonite', 'Windshield Armor (Parabrisas)', 'WINDSHIELD', 1.20, 15.00, 12.00, 1100.00, 'USD', 'KRYP-WP-89', 'Rack Vidrios', 'ACTIVE', 'Medida especial 1.20m x 15m exclusiva para protección de parabrisas'),
('KRYP-BK-04', 'Kryptonite', 'Piano Black', 'BLACK_PIANO', 1.56, 15.00, 15.00, 1500.00, 'USD', 'KRYP-BK-02', 'Depósito Sellados', 'SEALED', 'Bobina nueva cerrada para techos y parantes negro brillante'),
('KRYP-GL-05', 'Kryptonite', 'Ultra Gloss (Carrocería)', 'GLOSS', 1.56, 15.00, 2.10, 1300.00, 'USD', 'KRYP-2025-Z9', 'Rack B - Nivel 1', 'ACTIVE', 'ALERTA: Quedan 2.10m. Ideal para piezas chicas o espejos');

-- Trabajos de prueba con corte externo y mermas
INSERT INTO ppf_jobs (roll_code, brand, finish, vehicle, license_plate, client_name, work_order_number, installer, cutting_provider, parts, meters_used, meters_scrap, scrap_reason, scrap_notes, cost_calculated, notes)
VALUES 
('KRYP-GL-01', 'Kryptonite', 'GLOSS', 'Porsche 911 Carrera S', 'AF 281 OK', 'Alejandro Benitez', 'OT-2026-104', 'Lucas', 'Plotter Master', '["Capot Completo", "Paragolpes Frontal", "Espejos"]'::jsonb, 4.20, 0.00, NULL, NULL, 364.00, 'Kit precortado instalado sin inconvenientes'),
('KRYP-GL-01', 'Kryptonite', 'GLOSS', 'Audi RS3 Sportback', 'AE 754 PL', 'Nicolás Rossi', 'OT-2026-108', 'Lucas', 'Plotter Master', '["Full Frontal", "Ópticas", "Zócalos"]'::jsonb, 4.50, 0.60, 'CONTAMINATION', 'Polvo en la esquina inferior del capot obligó a pedir re-corte de la pieza', 442.00, 'Re-corte solicitado a centro externo'),
('KRYP-WP-03', 'Kryptonite', 'WINDSHIELD', 'BMW M2 Competition', 'AG 112 ZZ', 'Ignacio Falcon', 'OT-2026-115', 'Marcos', 'Cortes PPF Express', '["Parabrisas Completo"]'::jsonb, 1.50, 0.00, NULL, NULL, 110.00, 'Colocación de film parabrisas 1.20m');

-- Retazos devueltos por el centro de corte
INSERT INTO ppf_offcuts (parent_roll_code, brand, finish, width_cm, length_cm, storage_location, suggested_use, status, notes)
VALUES 
('KRYP-GL-01', 'Kryptonite', 'GLOSS', 50.00, 120.00, 'Cajón 1 - Retazos Capot', 'Espejos retrovisores o paragolpe inferior', 'AVAILABLE', 'Sobrante limpio devuelto del ploteo de Porsche 911'),
('KRYP-MT-02', 'Kryptonite', 'MATTE', 40.00, 95.00, 'Cajón Matte', 'Espejos satinados o detalles de alerón', 'AVAILABLE', 'Material intacto para piezas chicas'),
('KRYP-WP-03', 'Kryptonite', 'WINDSHIELD', 30.00, 70.00, 'Tubo Parabrisas', 'Pruebas térmicas o visores', 'AVAILABLE', 'Recorte de parabrisas');
