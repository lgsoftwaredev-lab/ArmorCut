# ARMORCUT PPF — FUNCTIONAL & TECHNICAL SPECIFICATION

**Version:** 1.0.0  
**Status:** Approved for Development  
**Target Repository:** `ArmorCut-PPF`  
**Working Branch:** `feature/panel-matrix-catalog`  

---

## 1. Arquitectura General del Sistema

ArmorCut PPF opera bajo una arquitectura de **Monolito Serverless React/Next.js** sincronizado en tiempo real con **Supabase (PostgreSQL)**, extendido con un **Motor de Anidado 2D** y un **Puente de Comunicación con Plotters Industriales**:

```
[ Celular / Tablet / PC del Taller ]
               │
               ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                  ARMORCUT FRONTEND (NEXT.JS 16)              │
   │                                                             │
   │  ┌───────────────────────┐   ┌───────────────────────────┐  │
   │  │ 1. Core Stock & Jobs  │   │ 2. Matriz de Paneles      │  │
   │  │    (En producción)    │   │    (2.5D SVG / 3D WebGL)  │  │
   │  └──────────┬────────────┘   └─────────────┬─────────────┘  │
   │             │                              │                │
   │             ▼                              ▼                │
   │  ┌───────────────────────────────────────────────────────┐  │
   │  │ 3. Simulador de Anidado en Rollo 1.52m (Nesting)      │  │
   │  └──────────────────────────┬────────────────────────────┘  │
   └─────────────────────────────┼───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
   ┌───────────────────────────┐   ┌───────────────────────────┐
   │   SUPABASE (PostgreSQL)   │   │     HARDWARE BRIDGE       │
   │ • Bobinas (ppf_rolls)     │   │ • Web Serial API (USB)    │
   │ • Cortes (ppf_jobs)       │   │ • Exportador DXF / HP-GL  │
   │ • Catálogo de Vehículos   │   │ • Plotter Graphtec/Roland │
   └───────────────────────────┘   └───────────────────────────┘
```

---

## 2. Entidades del Dominio & Modelos de Datos

### 2.1. Entidades del Core Productivo (Activas)

#### `PPFRoll` (Inventario de Bobinas)
Representa cada bobina física de PPF presente en el rack del taller.
```typescript
interface PPFRoll {
  id: string;                    // UUID
  code: string;                  // Código visible (ej: "KRYP-GL-01")
  brand: string;                 // Marca (ej: "Kryptonite", "Stek", "Xpel")
  model: string;                 // Modelo (ej: "Ultra Gloss Carrocería")
  finish: PPFFinish;             // 'GLOSS' | 'MATTE' | 'SATIN' | 'BLACK_PIANO' | 'WINDSHIELD' | 'SMOKE_HEADLIGHT'
  widthMeters: number;           // Estándar 1.52m (o 1.20m para parabrisas)
  initialMeters: number;         // Metros iniciales de fábrica (ej: 15.0m)
  currentMeters: number;         // Metros disponibles en tiempo real
  costPerRoll: number;           // Costo de compra en USD (ej: 1300)
  location?: string;             // Ubicación en taller (ej: "Rack A - Nivel 1")
  batchNumber?: string;          // Lote de fabricación
  receivedDate: string;          // ISO Date
  status: 'ACTIVE' | 'SEALED' | 'DEPLETED';
  notes?: string;
}
```

#### `PPFJobConsumption` (Registro Histórico de Cortes)
```typescript
interface PPFJobConsumption {
  id: string;                    // UUID
  rollId: string;                // FK a ppf_rolls
  rollCode: string;              // Snapshot del código al momento del corte
  brand: string;
  model: string;
  finish: PPFFinish;
  vehicle: string;               // Ej: "Porsche 911 GT3 RS"
  licensePlate?: string;         // Ej: "AF 123 CD"
  clientName: string;            // Nombre cliente o concesionario
  workOrderNumber?: string;      // OT interna
  installer: string;             // Nombre del instalador (ej: "Lucas")
  parts: string[];               // Lista de paños (ej: ["Capot", "Paragolpes"])
  metersUsed: number;            // Metros lineales descontados (ej: 2.5)
  costPerMeter: number;          // Costo unitario al momento del corte
  totalCost: number;             // metersUsed * costPerMeter
  jobDate: string;               // ISO Date
  notes?: string;
}
```

---

### 2.2. Nuevas Entidades del Módulo PPF (En Desarrollo)

#### `VehicleProfile` (Catálogo de Vehículos)
```typescript
type VehicleCategory = 'COUPE_SUPERCAR' | 'SEDAN' | 'SUV' | 'PICKUP' | 'HATCHBACK';

interface VehicleProfile {
  id: string;                    // Slug único (ej: "porsche_911_gt3", "hilux_gr")
  brand: string;                 // "Porsche"
  model: string;                 // "911 GT3 RS (992)"
  year: number;                  // 2024
  category: VehicleCategory;     // "COUPE_SUPERCAR"
  lengthMeters: number;          // 4.57
  widthMeters: number;           // 1.90
  scaleFactor: number;           // Factor de escala sobre el arquetipo base (ej: 1.0)
  blueprintSvgPath?: string;     // Ruta a los vectores 2.5D
  mesh3dPath?: string;           // Ruta al archivo .glb segmentado
  features: string[];            // Detalles distintivos (tomas de aire, alerones)
}
```

#### `VehiclePanel` (Matriz Paramétrica de Paneles de Carrocería)
```typescript
type PanelCategory = 'front' | 'sides' | 'rear' | 'roof' | 'micro_details' | 'aero';
type PanelDifficulty = 'BAJA' | 'MEDIA' | 'ALTA' | 'EXPERTO';

interface VehiclePanel {
  id: string;                    // Identificador único (ej: "hood", "bumper_front")
  name: string;                  // Nombre técnico
  spanishName: string;           // Nombre coloquial de taller (ej: "Capot Completo")
  category: PanelCategory;       // Zona de carrocería
  cutWidth: number;              // Ancho requerido sobre el rollo (m) - máx 1.52m
  cutLength: number;             // Largo lineal a descontar de la bobina (m)
  sqMeters: number;              // Superficie neta calculada en m²
  laborHours: number;            // Horas hombre estimadas de instalación
  difficulty: PanelDifficulty;   // Nivel de dificultad técnica
  isMicroDetail?: boolean;       // Ópticas, tazas de espejo, parantes piano
  wrappedMarginMm: number;       // Margen perimetral para doblar hacia adentro (ej: 20mm)
  vectorPathDxf?: string;        // Archivo vectorial de corte para plotter
}
```

#### `PackagePreset` (Kits de Protección Predeterminados)
```typescript
interface PackagePreset {
  id: string;                    // "FULL_FRONTAL", "FULL_BODY", "TRACK_PACK"
  name: string;
  description: string;
  badge: string;
  recommendedPanelIds: string[];
  discountPercent?: number;
}
```
* **Kits Estándar:**
  1. `FULL_FRONTAL`: Capot, Paragolpes Delantero, Guardabarros Delanteros (Par), Ópticas (Par), Espejos Retrovisores (Par).
  2. `TRACK_PACK`: Full Frontal + Zócalos/Estribos + Pasos de rueda traseros + Labio/Splitter aerodinámico.
  3. `FULL_BODY`: Protección 100% de la chapa del vehículo.
  4. `HIGH_IMPACT`: Paragolpes delantero + Copas de manijas + Borde de carga de baúl.

---

## 3. Especificación del Simulador de Anidado (*Nesting 1.52m*)

El ancho útil de la bobina de PPF es fijo: **`1524 mm (1.52m)`**.
El motor de anidado toma los paneles seleccionados y resuelve el problema de empaquetado 2D (*2D Rectangular Bin Packing*):

### Reglas del Algoritmo:
1. **Orientación de Veta y Extrusión del TPU:**
   - Ciertas piezas largas (como zócalos o parantes) pueden rotarse 90° si su largo no excede 1.50m (dejando 24mm de margen de arrastre para el plotter).
   - Los capots de vehículos grandes (ancho > 1.40m) se ubican obligatoriamente alineados con el ancho del rollo.
2. **Emparejamiento de Piezas Menores (*Nesting Cavities*):**
   - En el hueco lateral que deja un guardabarros o un lateral de capot, el algoritmo inserta automáticamente las piezas de menor tamaño (ópticas, retrovisores, copas de manija, parantes piano black).
3. **Cálculo de Longitud Facturable (*Billed Linear Meters*):**
   $$\text{Metros Lineales Requeridos} = \max(Y_{\text{final}}) + \text{Margen de Cabezal (0.10m)}$$
4. **Alerta de Capacidad de Bobina:**
   - Si $\text{Metros Requeridos} > \text{currentMeters}$ de la bobina activa, el sistema dispara una alerta visual en rojo advirtiendo el faltante antes de cortar.

---

## 4. Especificación del Puente con la Cortadora (*Plotter Bridge*)

### 4.1. Protocolo de Comunicación
Los plotters de PPF (Graphtec, Roland, Summa) se controlan mediante lenguaje de comandos vectorial **HP-GL/2** o **GP-GL**:
* `IN;` ➔ Inicializar plotter.
* `SP1;` ➔ Seleccionar cuchilla de PPF (Pen 1).
* `FS32;` ➔ Fuerza de corte (gramos de presión para atravesar 8-10 mils de TPU).
* `VS40;` ➔ Velocidad de corte tangencial (cm/s).
* `PU x,y;` ➔ Pen Up (desplazar cabezal sin cortar a coordenadas X,Y).
* `PD x,y;` ➔ Pen Down (bajar cuchilla y cortar polilínea continua).
* `PU;` ➔ Levantar cuchilla.
* `NR;` ➔ Finalizar trabajo y avanzar material para despachar.

### 4.2. Métodos de Conexión
1. **Conexión Directa USB (Web Serial API):**
   - Desde el navegador Chrome/Edge en la PC del taller, el usuario presiona **"Cortar en Plotter"**.
   - El navegador abre el puerto serie USB virtual del plotter (`COM3` / `ttyUSB0`) y transmite las coordenadas directamente sin necesidad de software intermedio.
2. **Exportación Standalone (`.dxf` / `.plt`):**
   - Para plotters conectados a software propietario preexistente (Graphtec Cutting Master, CorelDRAW, Illustrator), ArmorCut genera el archivo `.dxf` optimizado con las piezas ya anidadas en 1.52m con un clic.
3. **Agente Daemon de Red Local (Opcional):**
   - Script ligero en Node.js que escucha en el puerto `9100` (impresión RAW de red) para plotters con tarjeta Ethernet integrada.

---

## 5. Especificación del Visor Interactivo (2.5D Blueprint & 3D WebGL)

### Modo 2.5D Blueprint (Ultra-Rápido, Celular y Taller)
* Renderizado con vectores SVG escalables y transparentes.
* Cada pieza de la carrocería contiene:
  - Evento `onClick`: Alterna selección de la pieza.
  - Estado visual:
    - No seleccionada: Silueta gris carbón (`#263142`) con borde fino (`#3b485d`).
    - Seleccionada: Relleno rojo translúcido (`rgba(255, 26, 60, 0.35)`) con borde rojo brillante (`#ff1a3c`) y resplandor de corte.
* Información al pasar el cursor o pulsar: Nombre en español, medidas de corte, tiempo de instalación y metros de film.

### Modo 3D Showroom (Venta y Presentación al Cliente)
* Implementado con **Three.js**.
* Escena con fondo oscuro supercar, luz de estudio automotriz superior y sombras suaves de contacto.
* El modelo 3D rota 360°, permitiendo alternar el acabado entre:
  - **Ultra-Gloss (Brillante):** Shader de carrocero con capa transparente (*clearcoat roughness 0.05*).
  - **Satin-Matte (Satinado):** Shader difuso (*roughness 0.45*).
* Al seleccionar un panel en 3D, el shader de ese panel específico cambia dinámicamente para simular la película instalada.

---

## 6. Extensiones del Esquema de Base de Datos (Supabase PostgreSQL)

Para soportar el catálogo y el historial de órdenes de corte generadas desde la matriz, se añadirán las siguientes tablas sin alterar las existentes `ppf_rolls` y `ppf_jobs`:

```sql
-- Catálogo de Modelos de Vehículos
CREATE TABLE IF NOT EXISTS ppf_vehicles (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  category TEXT NOT NULL,
  scale_factor NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo de Moldería de Paneles
CREATE TABLE IF NOT EXISTS ppf_panels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  spanish_name TEXT NOT NULL,
  category TEXT NOT NULL,
  cut_width NUMERIC NOT NULL,
  cut_length NUMERIC NOT NULL,
  sq_meters NUMERIC NOT NULL,
  labor_hours NUMERIC NOT NULL,
  difficulty TEXT NOT NULL,
  wrapped_margin_mm INT DEFAULT 20
);

-- Órdenes de Corte y Salida Digital
CREATE TABLE IF NOT EXISTS ppf_cut_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  vehicle_id TEXT REFERENCES ppf_vehicles(id),
  vehicle_text TEXT NOT NULL,
  license_plate TEXT,
  client_name TEXT NOT NULL,
  roll_id UUID REFERENCES ppf_rolls(id),
  selected_panels JSONB NOT NULL,
  billed_linear_meters NUMERIC NOT NULL,
  total_sq_meters NUMERIC NOT NULL,
  installer TEXT NOT NULL,
  status TEXT DEFAULT 'CONFIRMADO',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Criterios de Rendimiento y Presupuestos Técnicos

1. **Tiempo de Carga Inicial (LCP):** < 1.2 segundos sobre redes 4G móviles.
2. **Frame Rate en Visor 3D:** Mínimo 55 FPS en navegadores móviles (usando geometrías simplificadas < 35,000 polígonos por modelo).
3. **Cálculo de Anidado:** Tiempo de ejecución del algoritmo de nesting < 150 milisegundos para kits completos de hasta 25 piezas.
4. **Compatibilidad:** 100% responsive en pantallas desde 360px (móvil) hasta monitores ultrawide 4K de mostrador.

---

## 8. Especificación de Futuro Feature: Motor de Nesting 2D Irregular Avanzado & Exportador de Hardware Plotter (Fase 4 - Roadmap)

> **Estado:** Documentado como Feature a Futuro (Fase 4 en Roadmap de Ingeniería).  
> **Objetivo:** Automatizar la optimización matemática de anidado poligonal sobre bobina y la comunicación directa con plotters industriales de corte (Graphtec, Roland, Summa).

### 8.1. Motor de Nesting 2D Irregular Avanzado (Poligonal)
* **Algoritmo de Disposición:** Empaquetado bidimensional basado en polígonos irregulares (*No-Fit Polygon / NFP* asistido por algoritmos genéticos de optimización geométrica).
* **Restricciones de Material (TPU Grain & Elongation):**
  - Orientación fija del grano molecular: Los paños de gran extensión (capots, laterales) deben respetar el eje longitudinal del rollo para evitar deformaciones mecánicas durante la estirada en caliente.
  - Tolerancia de rotación permitida: 0° o 180° para piezas mayores; rotación libre (0° a 360°) restringida únicamente a micro-piezas (manijas, ópticas, zócalos interiores).
* **Márgenes de Seguridad & Corte:**
  - Margen de perímetro entre piezas: Mínimo 20mm a 30mm para garantizar corte limpio de cuchilla tangencial y facilitar el pelado (*weeding*) del film residual.
  - Borde de pinzado de rodillos (*Pinch Roller Margin*): 25mm en los extremos laterales del rollo de 1.52m (ancho útil de corte: 1.47m).
* **Objetivo de Rendimiento:** Aumentar la eficiencia de bobina a más del 82% en kits de carrocería completa, minimizando el costo de TPU residual descartado.

### 8.2. Exportador de Comandos Vectoriales & Hardware Bridge
* **Protocolos de Corte Industriales Soportados:**
  1. **HP-GL/2 (Hewlett-Packard Graphics Language):**
     - Comandos estándar: `IN` (inicialización), `SP1` (seleccionar cuchilla 1), `VS` (velocidad tangencial), `PU` (pen up / avance en vacío), `PD` (pen down / corte), `PA` (coordenadas absolutas), `NR` (finalizar y avanzar rollo).
     - Compatible con plotters Roland CAMM-1 Pro, Summa S Class, Mimaki CG-FX.
  2. **GP-GL (Graphtec Protocol):**
     - Comandos nativos para control de fuerza, aceleración y corte tangencial inteligente sobre plotters Graphtec FC9000 / CE7000.
  3. **Exportación Gráfica Directa:**
     - Archivo `.plt` descargable para spooler local o RIP de corte propietario (CorelDraw, Illustrator, FlexiSign).
     - Archivo `.svg` y `.dxf` (Release 12) con capas separadas de contorno exterior, perforaciones de sensores y marcas de registro ópticas.
* **Conexión Directa USB vía Web Serial API:**
  - Implementación con `navigator.serial` en navegadores Chromium (Chrome / Edge).
  - Parámetros de transmisión: 9600 baud, 8 data bits, no parity, 1 stop bit, hardware flow control (RTS/CTS).
  - Disparo de órdenes de corte directamente desde la tablet o terminal de taller sin requerir PC intermediaria con software pago.
* **Matriz de Calibración de Corte por Micrones de TPU:**
  - Cuchilla tangencial de 60° con compensación de offset (*Knife Offset*): 0.25mm – 0.50mm.
  - Fuerza de corte (*Downforce*): 180g a 220g para películas de 7.5 mils; 240g a 260g para películas de 8.5 a 10 mils con liner pesado.
  - Sobre-corte (*Overcut*): 0.30mm para garantizar cierre perfecto de esquinas en películas elásticas.

