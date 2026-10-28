# ARMORCUT PPF — PHASED IMPLEMENTATION PLAN

**Version:** 1.0.0  
**Methodology:** GitHub Spec Kit / Spec-Driven Development  
**Target Repository:** `ArmorCut-PPF`  
**Active Working Branch:** `feature/panel-matrix-catalog`  
**Base Stable Branch:** `main`  

---

## 1. Visión General del Plan

El objetivo es incorporar el módulo de **Matriz de Paneles de Vehículos, Simulación de Anidado en 1.52m y Puente de Corte para Plotter** sin alterar la estabilidad de la aplicación productiva en Vercel. 

El trabajo se organiza en **5 fases secuenciales con ramas aisladas**:

```
[ main (Producción Estable) ]
       │
       ├──► feature/panel-matrix-catalog  (FASE 1: En desarrollo activo)
       │        │
       │        ▼ (Validación y tests)
       ├──► feature/nesting-visualizer    (FASE 2: Simulador de rollo 1.52m)
       │        │
       │        ▼ (Validación y tests)
       ├──► feature/interactive-visualizer (FASE 3: Visor 2.5D y 3D WebGL)
       │        │
       │        ▼ (Validación y tests)
       ├──► feature/plotter-bridge        (FASE 4: Puente Web-to-Plotter)
       │        │
       │        ▼ (Auditoría final y QA)
       └──► MERGE FINAL A main            (FASE 5: Lanzamiento en Vercel)
```

---

## 2. Desglose de Fases y Tareas

### FASE 1: Catálogo de Vehículos & Matriz Paramétrica de Paneles
**Rama:** `feature/panel-matrix-catalog` (Rama actual activa)  
**Objetivo:** Permitir seleccionar un vehículo del catálogo (o ingresar uno personalizado), desglosar todos sus paneles de chapa, aplicar kits predeterminados (*Full Frontal, Full Body, Track Pack*), y calcular en tiempo real los metros lineales exactos a descontar de la bobina.

* [ ] **Tarea 1.1: Adaptación de Tipos y Modelos de Dominio**
  - Migrar y consolidar las interfaces de `PPFModule/src/types/ppf.ts` hacia `ArmorCut-PPF/src/types/ppf.ts`.
  - Unificar las definiciones de `VehiclePanel`, `VehicleProfile`, `PackagePreset` y `MaterialGrade`.
* [ ] **Tarea 1.2: Catálogo Paramétrico de Vehículos & Paneles**
  - Adaptar `PPFModule/src/data/materialsAndPanels.ts` a `ArmorCut-PPF/src/data/materialsAndPanels.ts`.
  - Incluir perfiles de vehículos representativos de PlusCars: *Porsche 911 GT3 RS, Audi RS3 / A1, Golf GTI, Peugeot 208/2008, Toyota Hilux / Pickup*.
  - Configurar las dimensiones de corte (`cutWidth`, `cutLength`, `laborHours`, `wrappedMarginMm`) para cada uno de los 25 paneles estándar.
* [ ] **Tarea 1.3: Componente de Matriz de Paneles (`VehicleMatrixSelector.tsx`)**
  - Diseñar el selector interactivo de piezas agrupadas por zona (*Frente, Laterales, Techo, Trasera, Micro-detalles, Aerodinámica*).
  - Aplicar el sistema de diseño Supercar Luxury: fondo carbón `#0f141c`, acentos `#ff1a3c`, badges de dificultad de instalación y chips de piezas seleccionadas.
* [ ] **Tarea 1.4: Selector Rápido de Kits (*Presets*)**
  - Botones de 1 clic para *Full Frontal*, *Full Body*, *Track Pack*, *High Impact*.
  - Cálculo instantáneo de metros lineales acumulados y tiempo de mano de obra en taller.
* [ ] **Tarea 1.5: Conexión con el Modal de Descuento de Stock (`NewJobModal.tsx`)**
  - Vincular la matriz de paneles con el formulario de corte existente: al elegir las piezas en la matriz, se transfieren automáticamente los paños y los metros sugeridos a la orden de trabajo.
* [ ] **Criterios de Aceptación Fase 1:**
  - `npm run lint` y `npm run build` pasan con 0 errores.
  - El usuario puede marcar piezas individuales o presets y ver cómo cambian los metros calculados.
  - Funciona fluidamente tanto en pantallas móviles como de escritorio.

---

### FASE 2: Simulador de Anidado Digital en Bobina de 1.52m (*Nesting*)
**Rama:** `feature/nesting-visualizer`  
**Objetivo:** Representar visualmente cómo se ubican las piezas cortadas dentro del rollo de 1.52m de ancho y 15 metros de largo, minimizando el desperdicio.

* [ ] **Tarea 2.1: Migración del Componente de Anidado**
  - Rescatar y refactorizar `PPFModule/src/components/RollNestingVisualizer.tsx` adaptándolo al diseño de ArmorCut.
* [ ] **Tarea 2.2: Algoritmo de Empaquetado 2D (Bin Packing)**
  - Implementar lógica que alinee piezas anchas (capot) y encaje piezas menores (ópticas, espejos, zócalos) en los espacios residuales del ancho de 1.52m.
* [ ] **Tarea 2.3: Barra de Consumo en Tiempo Real sobre la Bobina Activa**
  - Mostrar visualmente en el rollo: *Metros ya utilizados*, *Metros que ocupará el trabajo actual*, *Metros que quedarán disponibles*.
  - Alerta en rojo si el anidado excede el largo remanente en la bobina seleccionada.
* [ ] **Criterios de Aceptación Fase 2:**
  - El usuario ve el plano 2D del rollo de 1.52m con las piezas dibujadas a escala y la cota exacta de corte.

---

### FASE 3: Visor Interactivo (2.5D Blueprint & 3D WebGL Showroom)
**Rama:** `feature/interactive-visualizer`  
**Objetivo:** Permitir seleccionar las piezas haciendo clic directamente sobre el plano técnico o modelo tridimensional del vehículo.

* [ ] **Tarea 3.1: Blueprint Técnico 2.5D en SVG**
  - Crear siluetas vectoriales interactivas de carrocería (vistas superior, lateral y frontal).
  - Al hacer clic en un panel del blueprint, se activa/desactiva la pieza en la matriz y en el presupuesto.
* [ ] **Tarea 3.2: Visor 3D WebGL con Three.js (Arquetipos)**
  - Cargar modelos `.glb` optimizados de arquetipos (*Supercar Coupé, Sedán, SUV, Pickup*).
  - Configurar materiales PBR con selector de acabado: **Ultra-Gloss (Brillante)** vs **Satin-Matte (Mate)**.
* [ ] **Tarea 3.3: Detección de Clics en Paneles 3D (Raycasting)**
  - Mapear nombres de mallas 3D (`hood`, `fender_fl`, `door_fl`) con los `id` de paneles de la base de datos.
  - Al cliquear un panel en 3D, iluminarlo con el shader de film transparente/rojo.
* [ ] **Criterios de Aceptación Fase 3:**
  - La selección en el plano 2.5D o en el modelo 3D actualiza instantáneamente la lista de piezas y los metros del rollo.

---

### FASE 4: Puente con la Cortadora (*Plotter Bridge*)
**Rama:** `feature/plotter-bridge`  
**Objetivo:** Despachar órdenes de corte vectoriales directamente hacia el plotter o exportarlas en formatos estándar.

* [ ] **Tarea 4.1: Exportador Vectorial de Corte (`.dxf` y `.svg`)**
  - Generar el archivo de corte con las piezas organizadas en el ancho de 1.52m con márgenes de dobladillo incluidos.
* [ ] **Tarea 4.2: Generador de Comandos HP-GL/2 y GP-GL (`.plt`)**
  - Mapear las coordenadas vectoriales a instrucciones de corte tangencial (`IN; SP1; VS40; PU; PD; ... NR;`) compatibles con Graphtec y Roland.
* [ ] **Tarea 4.3: Conexión Directa USB vía Web Serial API**
  - Permitir abrir el puerto serie USB desde Chrome y disparar el corte directo al plotter sin intermediarios.
* [ ] **Criterios de Aceptación Fase 4:**
  - El sistema descarga archivos `.dxf` y `.plt` válidos y envía paquetes de datos al puerto de corte.

---

### FASE 5: QA Integral, Staging y Merge a `main`
**Rama:** `main`  
**Objetivo:** Integrar todas las ramas validadas en producción sobre Vercel.

* [ ] **Tarea 5.1: Auditoría de Regresión en Producción**
  - Verificar que el inventario existente en Supabase, las bobinas actuales y los registros históricos de cortes no sufran alteraciones.
* [ ] **Tarea 5.2: Pull Request y Merge a `main`**
  - Merge limpio de `feature/panel-matrix-catalog` hacia `main`.
* [ ] **Tarea 5.3: Verificación Live en Vercel (`https://armor-cut.vercel.app/`)**
  - Probar en celular y PC con emulación de hardware.

---

## 3. Matriz de Riesgos y Mitigación

| Riesgo Identificado | Severidad | Probabilidad | Estrategia de Mitigación |
| :--- | :---: | :---: | :--- |
| **Modelos 3D pesados que ralenticen celulares en taller** | Alta | Media | Arquitectura dual: el modo por defecto en móviles es el **Blueprint 2.5D SVG** (instantáneo); el visor 3D WebGL es opcional para presentación. |
| **Incompatibilidad con drivers de plotters antiguos** | Media | Baja | Soporte de doble vía: Web Serial directo para plotters modernos + Descarga de archivo `.dxf`/`.plt` para plotters con software propietario. |
| **Descuento de stock erróneo por sobreestimación** | Alta | Baja | Validación cruzada obligatoria: el instalador siempre ve y puede ajustar los metros sugeridos antes de confirmar. |
| **Afectación de la versión viva en producción** | Crítica | Nula | Regla de la Constitución: todo el desarrollo se realiza en la rama `feature/panel-matrix-catalog`; `main` permanece intacto. |
