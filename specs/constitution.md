# ARMORCUT PPF & PLUSCARS DETAILING — SYSTEM CONSTITUTION

**Version:** 1.0.0  
**Effective Date:** Octubre 2026  
**Status:** Activa & Vinculante  
**Repository:** `ArmorCut-PPF`  
**Active Working Branch:** `feature/panel-matrix-catalog`  

---

## 1. Declaración de Visión y Propósito

**ArmorCut PPF** es la plataforma tecnológica propietaria desarrollada exclusivamente para **PlusCars Detailing**. Su propósito es orquestar integralmente el ciclo de vida de la protección de pintura automotriz (Paint Protection Film - PPF):
1. **Control Físico y Financiero del Stock:** Trazabilidad milimétrica de bobinas de 1.52m (60"), consumo de material y costo real por instalación sin mermas ficticias ni desperdicio fantasma.
2. **Matriz Paramétrica de Carrocería & Paneles:** Selección visual e interactiva de paños automotrices (capot, paragolpes, guardabarros, puertas, etc.) con cálculo preciso de metros lineales requeridos considerando curvaturas y remates (*wrapped edges*).
3. **Simulación de Anidado (*Nesting*) y Conexión con Cortadoras (Plotters):** Empaquetado eficiente de moldería 2D dentro del ancho del rollo y despacho directo hacia plotters industriales de corte (Graphtec, Roland, Summa).
4. **Experiencia de Usuario Supercar Luxury:** Estética inspirada en el automovilismo de alta gama (Porsche GT, AMG, Ferrari), con rendimiento instantáneo en celulares y computadoras de taller.

---

## 2. Invariantes y Principios No Negociables (The Non-Negotiables)

### 2.1. Protección de la Rama Productiva (`main`)
* La rama `main` refleja el entorno de producción vivo en Vercel (`https://armor-cut.vercel.app/`).
* **Regla de oro:** Ningún feature en fase experimental, maqueta o investigación debe ser mergeado a `main` hasta haber cumplido el 100% de los criterios de aceptación en su respectiva rama de feature (`feature/*`).
* Todo commit en `main` debe compilar (`npm run build`) y pasar linting (`npm run lint`) con cero errores.

### 2.2. Realismo Operativo de Taller (El Rollo Manda)
* En la industria del PPF, el material se vende y se aplica en **rollos rectangulares de 1.52 metros (60 pulgadas) de ancho**.
* **Principio de cálculo:** El software prioriza los **metros lineales de bobina consumidos** sobre los metros cuadrados teóricos de una malla 3D. Un capot de 1.80 m² que mide 1.45m de ancho y 1.25m de largo consume **1.35 metros lineales** de bobina. Cualquier cálculo que ignore el ancho fijo de 1.52m y la sangría de manipulación del instalador se considera inválido.

### 2.3. Cero Mermas Ficticias (Single In/Out Flow)
* Se rechazan conceptos de "banco de retazos" o "tasa de merma abstracta".
* Cada centímetro que sale de una bobina se imputa directamente a una **Orden de Trabajo (OT)** asociada a un vehículo, cliente, instalador y piezas protegidas.

### 2.4. Fuente Única de la Verdad (Single Source of Truth)
* **PostgreSQL en Supabase** es la base de datos central en la nube.
* Si el cliente pierde conectividad en el taller, el sistema opera con fallback local (`localStorage`) y sincroniza tan pronto se restablece la red.

### 2.5. Modelo de Costo Cero de Infraestructura ($0 Serverless Monolith)
* La arquitectura se mantiene 100% serverless sobre las capas gratuitas (*Free Tier*) de Vercel y Supabase. No se introducen servicios de backend persistentes pagos salvo que el volumen de facturación del taller lo justifique expresamente.

---

## 3. Stack Tecnológico Mandatorio

| Capa | Tecnología | Justificación de Arquitectura |
| :--- | :--- | :--- |
| **Framework Web** | Next.js 16 (App Router) + React 19 | Monolito ágil, renderizado rápido, soporte nativo para Server Components y API Routes. |
| **Lenguaje** | TypeScript 5 (Strict Mode) | Tipado fuerte en catálogo de vehículos, dimensiones de paneles y protocolos de plotter. |
| **Estilos & UI** | Vanilla CSS Design System | Control absoluto de cada píxel, cero sobrecarga de frameworks externos, rendimiento máximo en móviles. |
| **Base de Datos** | Supabase (PostgreSQL + RLS) | Persistencia relacional segura, triggers automáticos para descuento de stock y ping de estado. |
| **Visualización 3D** | Three.js (WebGL / GLTF) | Renderizado interactivo de carrocerías segmentadas con shaders de PPF transparente y mate. |
| **Visualización 2.5D** | SVG Interactivo Orthographic | Carga ultrarrápida (sub-50ms) en teléfonos sin calentar la GPU ni consumir batería en el taller. |
| **Protocolo de Corte** | HP-GL/2 & GP-GL (Vectores 2D) | El estándar universal que interpretan los plotters de corte de PPF industriales. |

---

## 4. Sistema de Diseño & Identidad Visual (Luxury Supercar Aesthetic)

El diseño visual de ArmorCut + PlusCars es un activo estratégico de venta y posicionamiento:

1. **Regla Cromática de Marca (70 - 20 - 10):**
   * **70% Negro Carbono & Titanio:** Fondo `#060709`, tarjetas `#0f141c`, bordes sutiles `#1c2433`.
   * **20% Rojo Competición PlusCars:** Acentos, botones primarios, medidores de stock y alertas (`#ff1a3c`, gradientes a `#990f23`).
   * **10% Blanco & Plata:** Tipografía de alto contraste `#ffffff`, datos secundarios `#9aa4b2`.
2. **Atmósfera de Taller Oficial:**
   * Marca de agua fija translúcida (opacidad 4.8%) del monograma PlusCars con resplandor carmesí (`.bg-brand-watermark`).
   * Favicon oficial de la pestaña con la P aerodinámica.
   * Co-branding balanceado: *ArmorCut PPF PRO* (Software) | *PlusCars Detailing* (Estudio & Taller).
3. **Ergonomía Móvil para el Instalador:**
   * Botones táctiles de al menos 44px de alto para operar con dedos enguantados o húmedos.
   * Diálogos modales con `z-index: 9999` y backdrop total que jamás se solapen con la barra superior.

---

## 5. Especificaciones Hardware & Conectividad con Cortadoras

1. **Ancho Estándar de Cuchilla:** Todo anidado asume un ancho útil de **1.524 mm (60")** en el rollo de film, con márgenes de seguridad laterales de 10mm para las ruedas de arrastre del plotter (*pinch rollers*).
2. **Tolerancia de Elongación del TPU:** Las piezas de corte deben incorporar entre **15mm y 25mm de sangría perimetral** (*wrapped edge margin*) para permitir remate hacia el interior del panel y compensar el estiramiento en caliente.
3. **Salida de Datos Vectorial:** Los cortes se procesan como coordenadas 2D cerradas (polilíneas y arcos Bézier) exportables a `.dxf`, `.svg` o comandos directos `.plt` (HP-GL).

---

## 6. Gobernanza de Desarrollo (Spec-Driven Development)

El ciclo de desarrollo en este proyecto se rige obligatoriamente por el **GitHub Spec Kit**:
1. **Constitution (`specs/constitution.md`):** Establece las reglas, límites y principios rectores (este documento).
2. **Specification (`specs/spec.md`):** Detalla exhaustivamente qué hace el sistema, sus entidades, flujos, contratos de datos y fórmulas.
3. **Execution Plan (`specs/plan.md`):** Define las tareas en orden cronológico, criterios de éxito, dependencias y riesgos por rama de Git.

Cualquier propuesta de código que viole los principios de esta Constitución debe ser refactorizada antes de ser considerada para merge.
