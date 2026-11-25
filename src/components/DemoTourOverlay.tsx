'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AppTab } from '@/components/Header';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

export interface DemoActionDetail {
  type:
    | 'SET_TAB'
    | 'STUDIO_CATALOG'
    | 'STUDIO_VEHICLE'
    | 'STUDIO_SET_PANELS'
    | 'STUDIO_HOVER_PANEL'
    | 'STUDIO_SCROLL_NESTING'
    | 'STUDIO_SCROLL_TOP'
    | 'SHOWROOM_CAMERA'
    | 'SHOWROOM_ROTATE';
  tab?: AppTab;
  brand?: string | null;
  vehicleId?: string;
  panelIds?: string[];
  panelId?: string | null;
  cameraAngle?: 'iso' | 'front' | 'side' | 'rear' | 'top';
  rotate?: boolean;
}

export function dispatchDemoAction(detail: DemoActionDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<DemoActionDetail>('armorcut:demo-action', { detail }));
  }
}

interface DemoStep {
  id: string;
  tag: string;
  title: string;
  description: string;
  durationMs: number;
  run: (schedule: (ms: number, fn: () => void) => void) => void;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'inventory',
    tag: 'INVENTARIO · STOCK EN VIVO',
    title: 'Control de Bobinas en Tiempo Real',
    description:
      'Trazabilidad precisa de cada rollo de PPF por marca, acabado, ancho y metros disponibles, con alertas automáticas de stock bajo.',
    durationMs: 4800,
    run: (schedule) => {
      dispatchDemoAction({ type: 'SET_TAB', tab: 'ROLLS' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      schedule(1400, () => {
        window.scrollTo({ top: 140, behavior: 'smooth' });
      });
    },
  },
  {
    id: 'brands',
    tag: 'STUDIO · CATÁLOGO DE MARCAS',
    title: 'Catálogo Jerárquico por Marcas',
    description:
      'Estética sobria de configurador automotriz. Acceso directo a cada fabricante y sus modelos con matrices 3D listas para cotizar.',
    durationMs: 4800,
    run: (schedule) => {
      dispatchDemoAction({ type: 'SET_TAB', tab: 'STUDIO' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      schedule(120, () => {
        dispatchDemoAction({ type: 'STUDIO_CATALOG', brand: null });
      });
      schedule(1800, () => {
        window.scrollTo({ top: 180, behavior: 'smooth' });
      });
    },
  },
  {
    id: 'brand_models',
    tag: 'VOLKSWAGEN · MODELOS',
    title: 'Selección de Vehículo',
    description:
      'Cada marca organiza sus modelos por carrocería y año. Ingresamos al Volkswagen Golf GTI Clubsport MK7.',
    durationMs: 3800,
    run: (schedule) => {
      dispatchDemoAction({ type: 'SET_TAB', tab: 'STUDIO' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      schedule(100, () => {
        dispatchDemoAction({ type: 'STUDIO_CATALOG', brand: 'Volkswagen' });
      });
    },
  },
  {
    id: 'studio_3d',
    tag: 'SHOWROOM 3D · CRITERIO DE PLOTTER',
    title: 'Selección Quirúrgica Pieza por Pieza',
    description:
      'Segmentación topológica con criterio real de taller: chapa, parantes Piano Black, carcasas de espejos y ópticas — excluyendo burletes y llantas.',
    durationMs: 11000,
    run: (schedule) => {
      dispatchDemoAction({ type: 'SET_TAB', tab: 'STUDIO' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      schedule(100, () => {
        dispatchDemoAction({ type: 'STUDIO_VEHICLE', vehicleId: 'golf_gti_mk7' });
        dispatchDemoAction({ type: 'STUDIO_SET_PANELS', panelIds: [] });
        dispatchDemoAction({ type: 'STUDIO_HOVER_PANEL', panelId: null });
      });
      schedule(1300, () => {
        dispatchDemoAction({ type: 'SHOWROOM_CAMERA', cameraAngle: 'side' });
        dispatchDemoAction({ type: 'SHOWROOM_ROTATE', rotate: false });
      });
      // 1. Hover & Select Driver Door
      schedule(1900, () => {
        dispatchDemoAction({ type: 'STUDIO_HOVER_PANEL', panelId: 'door_front_left' });
      });
      schedule(2900, () => {
        dispatchDemoAction({ type: 'STUDIO_SET_PANELS', panelIds: ['door_front_left'] });
      });
      // 2. Hover & Select B-Pillar Piano Black
      schedule(3600, () => {
        dispatchDemoAction({ type: 'STUDIO_HOVER_PANEL', panelId: 'pillars_a_b' });
      });
      schedule(4600, () => {
        dispatchDemoAction({
          type: 'STUDIO_SET_PANELS',
          panelIds: ['door_front_left', 'pillars_a_b'],
        });
      });
      // 3. Switch to 3/4 iso + gentle rotation, hover & select Mirrors, Headlights, Hood, Front Bumper
      schedule(5200, () => {
        dispatchDemoAction({ type: 'SHOWROOM_CAMERA', cameraAngle: 'iso' });
        dispatchDemoAction({ type: 'SHOWROOM_ROTATE', rotate: true });
        dispatchDemoAction({ type: 'STUDIO_HOVER_PANEL', panelId: 'mirrors' });
      });
      schedule(6300, () => {
        dispatchDemoAction({
          type: 'STUDIO_SET_PANELS',
          panelIds: ['door_front_left', 'pillars_a_b', 'mirrors'],
        });
        dispatchDemoAction({ type: 'STUDIO_HOVER_PANEL', panelId: 'headlights' });
      });
      schedule(7500, () => {
        dispatchDemoAction({
          type: 'STUDIO_SET_PANELS',
          panelIds: ['door_front_left', 'pillars_a_b', 'mirrors', 'headlights'],
        });
        dispatchDemoAction({ type: 'STUDIO_HOVER_PANEL', panelId: 'hood' });
      });
      schedule(8800, () => {
        dispatchDemoAction({
          type: 'STUDIO_SET_PANELS',
          panelIds: ['door_front_left', 'pillars_a_b', 'mirrors', 'headlights', 'hood', 'bumper_front'],
        });
        dispatchDemoAction({ type: 'STUDIO_HOVER_PANEL', panelId: null });
      });
    },
  },
  {
    id: 'nesting',
    tag: 'NESTING 2D · BOBINA 1.52M (60")',
    title: 'Empaquetado y Consumo Real en Rollo',
    description:
      'Las piezas elegidas en 3D se distribuyen automáticamente sobre la bobina de 1.52m, calculando metros lineales, desperdicio y eficiencia.',
    durationMs: 5800,
    run: (schedule) => {
      dispatchDemoAction({ type: 'SHOWROOM_ROTATE', rotate: false });
      dispatchDemoAction({ type: 'STUDIO_HOVER_PANEL', panelId: null });
      schedule(120, () => {
        dispatchDemoAction({ type: 'STUDIO_SCROLL_NESTING' });
      });
    },
  },
  {
    id: 'jobs',
    tag: 'ÓRDENES DE CORTE · TRAZABILIDAD',
    title: 'Registro y Descuento Automático',
    description:
      'Cada corte queda vinculado a su bobina, cliente, patente y técnico instalador, con edición y reconciliación automática del stock.',
    durationMs: 5000,
    run: () => {
      dispatchDemoAction({ type: 'SET_TAB', tab: 'JOBS' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  },
  {
    id: 'metrics',
    tag: 'TELEMETRÍA · ARMORCUT PPF',
    title: 'Métricas Operativas del Taller',
    description:
      'Consumo acumulado, valor del inventario y rendimiento por instalador en un solo panel. Ingeniería web moderna aplicada al detailing.',
    durationMs: 4800,
    run: () => {
      dispatchDemoAction({ type: 'SET_TAB', tab: 'METRICS' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  },
];

interface DemoTourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
}

export const DemoTourOverlay: React.FC<DemoTourOverlayProps> = ({
  isOpen,
  onClose,
  autoPlay = true,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const clearScheduled = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    clearScheduled();
    dispatchDemoAction({ type: 'SHOWROOM_ROTATE', rotate: false });
    dispatchDemoAction({ type: 'STUDIO_HOVER_PANEL', panelId: null });
    onClose();
  }, [clearScheduled, onClose]);

  useEffect(() => {
    if (!isOpen) {
      clearScheduled();
      setStepIndex(0);
      setIsFinished(false);
      setProgress(0);
      return;
    }
    setStepIndex(0);
    setIsPlaying(autoPlay);
    setIsFinished(false);
  }, [isOpen, autoPlay, clearScheduled]);

  // Execute current step actions
  useEffect(() => {
    if (!isOpen) return;
    clearScheduled();

    const step = DEMO_STEPS[stepIndex];
    if (!step) return;

    const schedule = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    step.run(schedule);

    if (!isPlaying) {
      setProgress(0);
      return () => clearScheduled();
    }

    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / step.durationMs) * 100);
      setProgress(pct);
      if (elapsed < step.durationMs) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (stepIndex < DEMO_STEPS.length - 1) {
          setStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setIsFinished(true);
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearScheduled();
    };
  }, [isOpen, stepIndex, isPlaying, clearScheduled]);

  if (!isOpen) return null;

  const step = DEMO_STEPS[stepIndex];

  return (
    <div
      data-demo-overlay="true"
      data-demo-step={step.id}
      data-demo-finished={isFinished ? 'true' : 'false'}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: 'min(410px, calc(100vw - 32px))',
        background: 'rgba(14, 16, 20, 0.96)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderLeft: '3px solid var(--accent-red)',
        borderRadius: '8px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 9998,
        overflow: 'hidden',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ padding: '16px 18px 14px' }}>
        {/* Top Row: Step Tag + Counter + Close */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} color="var(--accent-red)" />
            <span
              className="mono"
              style={{
                fontSize: '0.66rem',
                letterSpacing: '0.08em',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              {step.tag}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="mono"
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
              }}
            >
              {String(stepIndex + 1).padStart(2, '0')} / {String(DEMO_STEPS.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar demo"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Title & Explanation */}
        <h3
          style={{
            margin: '0 0 6px 0',
            fontSize: '0.98rem',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '-0.01em',
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            margin: '0 0 14px 0',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
          }}
        >
          {step.description}
        </p>

        {/* Controls Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* Step Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {DEMO_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Ir al paso ${idx + 1}`}
                onClick={() => {
                  setStepIndex(idx);
                  setIsFinished(false);
                }}
                style={{
                  width: idx === stepIndex ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '999px',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background:
                    idx === stepIndex
                      ? 'var(--accent-red)'
                      : idx < stepIndex
                      ? 'rgba(255, 255, 255, 0.45)'
                      : 'rgba(255, 255, 255, 0.16)',
                  transition: 'width 200ms ease, background 200ms ease',
                }}
              />
            ))}
          </div>

          {/* Playback Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                if (isFinished) {
                  setStepIndex(0);
                  setIsFinished(false);
                  setIsPlaying(true);
                } else {
                  setIsPlaying((p) => !p);
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 9px', fontSize: '0.72rem' }}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isFinished ? 'Repetir' : isPlaying ? 'Pausar' : 'Play'}</span>
            </button>

            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => {
                setStepIndex((prev) => Math.max(0, prev - 1));
                setIsFinished(false);
              }}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 6px' }}
              aria-label="Paso anterior"
            >
              <ChevronLeft size={13} />
            </button>

            <button
              type="button"
              disabled={stepIndex === DEMO_STEPS.length - 1}
              onClick={() => {
                setStepIndex((prev) => Math.min(DEMO_STEPS.length - 1, prev + 1));
                setIsFinished(false);
              }}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 6px' }}
              aria-label="Siguiente paso"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Progress Line */}
      <div
        style={{
          height: '2px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${isPlaying ? progress : isFinished ? 100 : 0}%`,
            background: 'var(--accent-red)',
            transition: isPlaying ? 'none' : 'width 150ms ease',
          }}
        />
      </div>
    </div>
  );
};

