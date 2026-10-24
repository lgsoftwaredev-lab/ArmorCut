-- ==============================================================================
-- ARMORCUT PPF - PLUSCARS DETAILING SOFTWARE
-- Supabase PostgreSQL Database Schema
-- Ejecutar este script en el SQL Editor de supabase.com
-- ==============================================================================

-- 1. EXTENSIÓN PARA UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA DE BOBINAS (ROLLOS DE PPF)
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
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SEALED, DEPLETED
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA DE TRABAJOS / CONSUMOS (CORTES Y MERMAS)
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

-- 4. TABLA DE BANCO DE RETAZOS (OFF-CUTS APROVECHABLES)
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
-- Habilitamos RLS y permitimos acceso completo para clientes con la clave anon pública
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

-- 7. REGISTRO DE CONFIGURACIÓN INICIAL
INSERT INTO ppf_settings (id, shop_name, low_stock_threshold_meters, currency)
VALUES ('default', 'PLUSCARS DETAILING', 3.00, 'USD')
ON CONFLICT (id) DO NOTHING;

-- 8. DATOS DEMOSTRATIVOS REALISTAS PARA TALLER DE DETAILING
-- Bobinas de prueba
INSERT INTO ppf_rolls (code, brand, model, finish, width_meters, initial_meters, current_meters, cost_per_roll, currency, batch_number, location, status, notes)
VALUES 
('XP-GL-01', 'XPEL', 'Ultimate Plus 8mil', 'GLOSS', 1.52, 15.00, 11.20, 1350.00, 'USD', 'LOT-98214', 'Rack A - Nivel 1', 'ACTIVE', 'Bobina principal para capots y paragolpes frontales'),
('ST-DY-02', 'STEK', 'DYNOshield', 'GLOSS', 1.52, 15.00, 4.30, 1400.00, 'USD', 'LOT-84311', 'Rack A - Nivel 2', 'ACTIVE', 'Excelente hidrofobia y brillo profundo'),
('XP-ST-03', 'XPEL', 'Stealth Matte', 'MATTE', 1.52, 15.00, 2.10, 1550.00, 'USD', 'LOT-77402', 'Rack B - Nivel 1', 'ACTIVE', 'ALERTA: Quedan pocos metros para trabajos grandes'),
('3M-SC-04', '3M', 'Scotchgard Pro 200', 'GLOSS', 0.91, 30.00, 24.50, 1200.00, 'USD', 'LOT-3M-119', 'Rack B - Nivel 2', 'ACTIVE', 'Ancho especial para zócalos, ópticas y franjas'),
('ST-BK-05', 'STEK', 'DYNOblack Piano', 'BLACK_PIANO', 1.52, 15.00, 15.00, 1600.00, 'USD', 'LOT-BK-003', 'Depósito Sellados', 'SEALED', 'Bobina nueva cerrada para techos y parantes');

-- Trabajos y consumos registrados
INSERT INTO ppf_jobs (roll_code, brand, finish, vehicle, license_plate, client_name, work_order_number, installer, parts, meters_used, meters_scrap, scrap_reason, scrap_notes, cost_calculated, notes)
VALUES 
('XP-GL-01', 'XPEL', 'GLOSS', 'Porsche 911 Carrera S', 'AF 281 OK', 'Alejandro Benitez', 'OT-2026-104', 'Lucas', '["Capot Completo", "Paragolpes Frontal", "Espejos"]'::jsonb, 3.80, 0.00, NULL, NULL, 342.00, 'Instalación impecable sin merma'),
('ST-DY-02', 'STEK', 'GLOSS', 'Audi RS3 Sportback', 'AE 754 PL', 'Nicolás Rossi', 'OT-2026-108', 'Lucas', '["Full Frontal", "Ópticas", "Zócalos"]'::jsonb, 4.20, 0.50, 'CONTAMINATION', 'Partícula de polvo en la esquina inferior del capot obligó a repetir pieza', 438.67, 'Desperdicio registrado y cargado a scrap'),
('XP-ST-03', 'XPEL', 'MATTE', 'BMW M2 Competition', 'AG 112 ZZ', 'Ignacio Falcon', 'OT-2026-115', 'Marcos', '["Capot Satinado", "Guardabarros Delanteros"]'::jsonb, 3.60, 0.40, 'STRETCH_TEAR', 'Exceso de tensión en la curvatura del guardabarros generó línea de estrés', 413.33, 'Se capacitó sobre técnica de anclaje térmico');

-- Retazos útiles disponibles
INSERT INTO ppf_offcuts (parent_roll_code, brand, finish, width_cm, length_cm, storage_location, suggested_use, status, notes)
VALUES 
('XP-GL-01', 'XPEL', 'GLOSS', 55.00, 110.00, 'Cajón 1 - Retazos Capot', 'Espejos retrovisores o paragolpe inferior', 'AVAILABLE', 'Sobrante limpio del corte de Porsche 911'),
('ST-DY-02', 'STEK', 'GLOSS', 35.00, 80.00, 'Cajón 2 - Retazos Chicos', 'Tazas de puertas, pantalla táctil, B-Pillars', 'AVAILABLE', 'Perfecto para interiores de Audi o BMW'),
('XP-ST-03', 'XPEL', 'MATTE', 40.00, 95.00, 'Cajón Matte', 'Espejos satinados o detalles de alerón', 'AVAILABLE', 'Material intacto para piezas chicas');
