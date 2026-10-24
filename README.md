# 🛡️ ArmorCut PPF — PlusCars Detailing Software

> **Sistema Monolítico Web para Control de Stock de Bobinas de PPF, Mermas (Scrap) y Banco de Retazos.**
> Diseñado para correr en **Vercel** con costo de mantenimiento **$0** de por vida utilizando **Supabase (PostgreSQL)** en su plan gratuito.

---

## ⚡ Características Principales

1. **Gestión Integral de Bobinas (Rollos de PPF):**
   * Control por metros lineales restantes con medidor visual animado de vida útil de la bobina.
   * Soporte de marcas líderes (*XPEL, STEK, SunTek, 3M, Avery Dennison, TeckWrap*).
   * Acabados: *Gloss (Brillante), Matte (Satinado), Satin, Black Piano (Techos/Parantes), Smoke (Ópticas), Windshield Protection*.
   * Anchos estándar (*1.52m / 60", 0.91m / 36", 0.76m, etc.*), lotes de fábrica y ubicación en taller (*Rack / Estante*).
   * **Alertas automáticas de stock bajo** cuando a un rollo le quedan menos de 3.00 metros.

2. **Registro de Cortes & Consumo en Vehículos:**
   * Descuento automático de metros de la bobina seleccionada.
   * Datos del auto (*Vehículo, Patente, Cliente, Orden de Trabajo, Técnico Instalador*).
   * Selector rápido de piezas (*Capot Completo, Paragolpes, Full Front, Ópticas, Espejos, Techo, etc.*).
   * Cálculo económico automático del costo del trabajo.

3. **Control Avanzado de Scrap / Desperdicio (Mermas):**
   * Registro exacto de metros arruinados por corte.
   * Motivo clasificado (*Polvo/Pelusa/Contaminación, Estiramiento excesivo, Error de plotter/cutter, Silvering, Fallo adhesivo*).
   * **Leaderboard / Ranking de Instaladores:** Tasa de desperdicio individual (**% Scrap Rate**) y pérdida en USD para premiar la prolijidad técnica o capacitar en áreas de mejora.

4. **Banco de Retazos Sobrantes (Off-cuts aprovechables):**
   * Al registrar un corte en un vehículo, si queda un retazo utilizable (ej: $45 \times 110 \text{ cm}$), se guarda con 1 clic en el banco de retazos.
   * Evita cortar bobinas enteras para piezas chicas (*espejos retrovisores, manijas de puerta, pantallas táctiles interiores, pilares B*), ahorrando miles de dólares en material.

5. **Métricas en Vivo & Exportación:**
   * Metros totales en stock, rollos activos, valor estimado del inventario.
   * Exportación instantánea a planillas de cálculo (**Excel / CSV**) con un solo clic.

---

## 🚀 Despliegue en Vercel ($0 Costo)

El sistema está optimizado para funcionar en el plan **Hobby Gratuito de Vercel** y la base de datos **Supabase Free Tier (PostgreSQL)**:

### Paso 1: Configurar la Base de Datos en Supabase (Gratis sin tarjeta)
1. Regístrate gratis en [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Ve a la pestaña **SQL Editor** > **New query**.
3. Copia y pega el contenido del archivo [`supabase-schema.sql`](./supabase-schema.sql) y pulsa **Run**. ¡Creará las tablas, políticas y datos de ejemplo automáticamente!
4. Ve a **Project Settings** > **API** y copia tu `Project URL` y `anon public key`.

### Paso 2: Desplegar en Vercel
1. Ingresa a [vercel.com](https://vercel.com) y conecta este repositorio GitHub (`ArmorCut-PPF`).
2. En la sección **Environment Variables**, agrega las dos variables:
   * `NEXT_PUBLIC_SUPABASE_URL`: Tu URL de Supabase (ej: `https://xyzcompany.supabase.co`)
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anónima pública de Supabase
   * *(Opcional)* `NEXT_PUBLIC_SHOP_NAME`: `PLUSCARS DETAILING`
3. Haz clic en **Deploy**. ¡En 60 segundos tu sistema estará online en tu dominio `https://tu-proyecto.vercel.app`!

---

## 💻 Ejecución Local

Si deseas probarlo o editarlo en tu máquina local:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables locales
# Copia .env.example a .env.local y pega tus credenciales
cp .env.example .env.local

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📂 Estructura del Proyecto Monolítico

```
├── supabase-schema.sql       # Script SQL DDL y datos demo para Supabase
├── src/
│   ├── app/
│   │   ├── globals.css       # Sistema de diseño automotriz (Vanilla CSS Dark Mode)
│   │   ├── layout.tsx        # Layout principal y SEO metadata
│   │   └── page.tsx          # Dashboard interactivo con navegación por tabs
│   ├── components/
│   │   ├── Header.tsx        # Navbar, KPIs en vivo y estado cloud
│   │   ├── RollCard.tsx      # Tarjeta de bobina con medidor visual animado
│   │   ├── NewRollModal.tsx  # Modal para dar de alta bobinas de PPF
│   │   ├── NewJobModal.tsx   # Modal de corte, descuento, scrap y retazo
│   │   ├── JobsHistoryView.tsx # Historial de instalaciones y mermas
│   │   ├── OffcutsView.tsx   # Banco de retazos aprovechables
│   │   ├── MetricsView.tsx   # Gráficos de scrap y ranking de instaladores
│   │   └── SupabaseGuideModal.tsx # Asistente interactivo con script SQL copiable
│   ├── lib/
│   │   ├── stockService.ts   # Lógica de negocio, cálculos de merma y persistencia
│   │   └── supabase.ts       # Cliente Supabase seguro
│   └── types/
│       └── ppf.ts            # Tipos TypeScript para bobinas, trabajos y retazos
└── package.json
```

---

*Desarrollado para PlusCars Detailing.*
