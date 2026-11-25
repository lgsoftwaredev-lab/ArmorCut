'use client';

import React, { useState } from 'react';
import { VehiclePanel } from '@/types/ppf';
import { STANDARD_PANELS } from '@/data/materialsAndPanels';
import { Eye, ZoomIn, RotateCcw, Maximize2 } from 'lucide-react';

interface CarBlueprintViewerProps {
  selectedPanelIds: string[];
  onTogglePanel: (panelId: string) => void;
  hoveredPanelId: string | null;
  onHoverPanel: (panelId: string | null) => void;
  vehicleName?: string;
  licensePlate?: string;
  showDimensionsDefault?: boolean;
}

export type ViewAngle = 'front' | 'top' | 'lateral' | 'rear';

export const CarBlueprintViewer: React.FC<CarBlueprintViewerProps> = ({
  selectedPanelIds,
  onTogglePanel,
  hoveredPanelId,
  onHoverPanel,
  vehicleName = 'Volkswagen Golf GTI Clubsport MK7',
  licensePlate = 'PLUSCARS-PPF',
  showDimensionsDefault = true,
}) => {
  const [activeView, setActiveView] = useState<ViewAngle>('front');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showDimensions, setShowDimensions] = useState<boolean>(showDimensionsDefault);

  const isSelected = (id: string) => selectedPanelIds.includes(id);
  const hoveredPanel = STANDARD_PANELS.find((p) => p.id === hoveredPanelId);

  return (
    <div className="blueprint-container" style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-toolbar: Angles & Tools */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 18px',
          background: 'rgba(8, 9, 14, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Angle Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#0e1017', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          {(
            [
              { id: 'front', label: 'Frente & Ópticas' },
              { id: 'top', label: 'Planta Superior' },
              { id: 'lateral', label: 'Lateral Completo' },
              { id: 'rear', label: 'Trasera & Baúl' },
            ] as const
          ).map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#8893a4',
                  background: isActive ? 'var(--accent-red)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 0 12px var(--accent-red-glow)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* View Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: showDimensions ? 'var(--accent-red-hover)' : '#8893a4',
              background: showDimensions ? 'var(--accent-red-subtle)' : '#141720',
              border: `1px solid ${showDimensions ? 'var(--accent-red-border)' : 'rgba(255, 255, 255, 0.08)'}`,
              cursor: 'pointer',
            }}
          >
            <Eye style={{ width: 14, height: 14 }} />
            Cotas (m)
          </button>

          <button
            type="button"
            onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.25 : 1))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: zoomLevel > 1 ? '#ffffff' : '#8893a4',
              background: zoomLevel > 1 ? '#1f2432' : '#141720',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
            }}
          >
            <ZoomIn style={{ width: 14, height: 14 }} />
            {zoomLevel > 1 ? 'Zoom 125%' : 'Zoom 100%'}
          </button>
        </div>
      </div>

      {/* Blueprint Canvas Surface */}
      <div
        style={{
          position: 'relative',
          minHeight: '440px',
          background: 'radial-gradient(circle at 50% 50%, #0d1017 0%, #06070a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {/* Subtle CAD Coordinate Grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        {/* CAD watermark & instructions */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 16,
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255, 255, 255, 0.3)',
            pointerEvents: 'none',
            letterSpacing: '0.05em',
          }}
        >
          ARMORCUT VECTOR BLUEPRINT · CLIC DIRECTO SOBRE CADA PANEL PARA SELECCIONAR CORTE
        </div>

        {/* SVG Drawing Container with Smooth Zoom */}
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'center',
          }}
        >
          {/* =========================================================================
              VISTA FRONTAL (Capot, Ópticas, Antinieblas, Splitter, Espejos, Techo)
             ========================================================================= */}
          {activeView === 'front' && (
            <svg viewBox="0 0 760 480" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))' }}>
              <defs>
                <filter id="crimsonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#e61937" floodOpacity="0.8" />
                </filter>
                <pattern id="carbonFront" width="6" height="6" patternUnits="userSpaceOnUse">
                  <rect width="6" height="6" fill="#0c0e14" />
                  <line x1="0" y1="0" x2="6" y2="6" stroke="#161b24" strokeWidth="1" />
                  <line x1="6" y1="0" x2="0" y2="6" stroke="#161b24" strokeWidth="1" />
                </pattern>
                <linearGradient id="windshieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10141d" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#1a202c" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#0a0d14" stopOpacity="0.95" />
                </linearGradient>
              </defs>

              {/* Floor Shadow */}
              <ellipse cx="380" cy="445" rx="330" ry="16" fill="#000000" opacity="0.9" />

              {/* Tires */}
              <rect x="105" y="320" width="65" height="110" rx="10" fill="#07080c" stroke="#1c202a" strokeWidth="2" />
              <rect x="590" y="320" width="65" height="110" rx="10" fill="#07080c" stroke="#1c202a" strokeWidth="2" />

              {/* Roof Arch / Windshield */}
              <g>
                <path
                  d="M 235 155 L 285 75 C 330 68 430 68 475 75 L 525 155 Z"
                  className="cursor-pointer"
                  onClick={() => onTogglePanel('roof')}
                  onMouseEnter={() => onHoverPanel('roof')}
                  onMouseLeave={() => onHoverPanel(null)}
                  fill={isSelected('roof') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke={isSelected('roof') ? '#ff2d4e' : '#242b38'}
                  strokeWidth={isSelected('roof') ? 3 : 1.5}
                  filter={isSelected('roof') ? 'url(#crimsonGlow)' : undefined}
                />
                <polygon points="245,152 290,82 470,82 515,152" fill="url(#windshieldGrad)" stroke="#1a202c" strokeWidth="2" />
                <polygon points="370,95 390,95 385,110 375,110" fill="#334155" />
              </g>

              {/* Side Mirrors */}
              <g
                style={{ cursor: 'pointer' }}
                onClick={() => onTogglePanel('mirrors')}
                onMouseEnter={() => onHoverPanel('mirrors')}
                onMouseLeave={() => onHoverPanel(null)}
              >
                <path
                  d="M 185 145 C 160 135 140 145 145 168 C 150 180 185 175 195 160 Z"
                  fill={isSelected('mirrors') ? 'rgba(230, 25, 55, 0.55)' : '#0e121a'}
                  stroke={isSelected('mirrors') ? '#ff2d4e' : '#334155'}
                  strokeWidth="2"
                  filter={isSelected('mirrors') ? 'url(#crimsonGlow)' : undefined}
                />
                <path d="M 152 160 L 180 162" stroke="#e61937" strokeWidth="2.5" strokeLinecap="round" />

                <path
                  d="M 575 145 C 600 135 620 145 615 168 C 610 180 575 175 565 160 Z"
                  fill={isSelected('mirrors') ? 'rgba(230, 25, 55, 0.55)' : '#0e121a'}
                  stroke={isSelected('mirrors') ? '#ff2d4e' : '#334155'}
                  strokeWidth="2"
                  filter={isSelected('mirrors') ? 'url(#crimsonGlow)' : undefined}
                />
                <path d="M 608 160 L 580 162" stroke="#e61937" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              {/* Hood */}
              <g
                style={{ cursor: 'pointer' }}
                onClick={() => onTogglePanel('hood')}
                onMouseEnter={() => onHoverPanel('hood')}
                onMouseLeave={() => onHoverPanel(null)}
              >
                <path
                  d="M 230 155 C 270 152 490 152 530 155 L 565 240 C 490 255 270 255 195 240 Z"
                  fill={isSelected('hood') ? 'rgba(230, 25, 55, 0.45)' : '#0f131c'}
                  stroke={isSelected('hood') ? '#ff2d4e' : '#334155'}
                  strokeWidth={isSelected('hood') ? 3 : 2}
                  filter={isSelected('hood') ? 'url(#crimsonGlow)' : undefined}
                />
                <path d="M 280 160 L 255 235" stroke="#1e2634" strokeWidth="1.5" />
                <path d="M 480 160 L 505 235" stroke="#1e2634" strokeWidth="1.5" />
                <circle cx="380" cy="235" r="7" fill="#e61937" stroke="#ffffff" strokeWidth="1" />

                <text x="380" y="200" fill={isSelected('hood') ? '#ffffff' : '#94a3b8'} fontSize="14" fontWeight="bold" fontFamily="var(--font-main)" textAnchor="middle">
                  CAPOT COMPLETO
                </text>
                {showDimensions && (
                  <text x="380" y="218" fill="#626d7d" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">
                    1.45m × 1.52m
                  </text>
                )}
              </g>

              {/* Front Fenders */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('fender_left')} onMouseEnter={() => onHoverPanel('fender_left')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 195 240 L 230 155 L 175 165 C 150 185 135 230 145 285 L 180 270 Z"
                  fill={isSelected('fender_left') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke={isSelected('fender_left') ? '#ff2d4e' : '#242b38'}
                  strokeWidth={isSelected('fender_left') ? 2.5 : 1.5}
                />
              </g>
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('fender_right')} onMouseEnter={() => onHoverPanel('fender_right')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 565 240 L 530 155 L 585 165 C 610 185 625 230 615 285 L 580 270 Z"
                  fill={isSelected('fender_right') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke={isSelected('fender_right') ? '#ff2d4e' : '#242b38'}
                  strokeWidth={isSelected('fender_right') ? 2.5 : 1.5}
                />
              </g>

              {/* Headlights */}
              <g
                style={{ cursor: 'pointer' }}
                onClick={() => onTogglePanel('headlights')}
                onMouseEnter={() => onHoverPanel('headlights')}
                onMouseLeave={() => onHoverPanel(null)}
              >
                {/* Left Headlight */}
                <polygon
                  points="165,225 245,215 220,260 160,250"
                  fill={isSelected('headlights') ? 'rgba(230, 25, 55, 0.65)' : '#070a10'}
                  stroke={isSelected('headlights') ? '#ff2d4e' : '#60a5fa'}
                  strokeWidth={isSelected('headlights') ? 3 : 1.5}
                  filter={isSelected('headlights') ? 'url(#crimsonGlow)' : undefined}
                />
                <circle cx="185" cy="238" r="8" fill="#60a5fa" opacity="0.9" />
                <circle cx="210" cy="233" r="6" fill="#93c5fd" opacity="0.9" />
                <path d="M 170 223 L 238 217" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

                {/* Right Headlight */}
                <polygon
                  points="595,225 515,215 540,260 600,250"
                  fill={isSelected('headlights') ? 'rgba(230, 25, 55, 0.65)' : '#070a10'}
                  stroke={isSelected('headlights') ? '#ff2d4e' : '#60a5fa'}
                  strokeWidth={isSelected('headlights') ? 3 : 1.5}
                  filter={isSelected('headlights') ? 'url(#crimsonGlow)' : undefined}
                />
                <circle cx="575" cy="238" r="8" fill="#60a5fa" opacity="0.9" />
                <circle cx="550" cy="233" r="6" fill="#93c5fd" opacity="0.9" />
                <path d="M 590 223 L 522 217" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

                <text x="200" y="205" fill="#60a5fa" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">
                  ÓPTICA IZQ
                </text>
                <text x="560" y="205" fill="#60a5fa" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">
                  ÓPTICA DER
                </text>
              </g>

              {/* Front Bumper Main Body */}
              <g
                style={{ cursor: 'pointer' }}
                onClick={() => onTogglePanel('front_bumper')}
                onMouseEnter={() => onHoverPanel('front_bumper')}
                onMouseLeave={() => onHoverPanel(null)}
              >
                <path
                  d="M 155 255 C 240 255 520 255 605 255 L 625 350 C 580 395 180 395 135 350 Z"
                  fill={isSelected('front_bumper') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke={isSelected('front_bumper') ? '#ff2d4e' : '#334155'}
                  strokeWidth={isSelected('front_bumper') ? 3 : 2}
                  filter={isSelected('front_bumper') ? 'url(#crimsonGlow)' : undefined}
                />
                <text x="380" y="280" fill={isSelected('front_bumper') ? '#ffffff' : '#94a3b8'} fontSize="13" fontWeight="bold" fontFamily="var(--font-main)" textAnchor="middle">
                  PARAGOLPES DELANTERO
                </text>
              </g>

              {/* Grille Honeycomb & Plate */}
              <path d="M 265 295 L 495 295 L 475 360 L 285 360 Z" fill="url(#carbonFront)" stroke="#1e2634" strokeWidth="1.5" />
              <rect x="320" y="315" width="120" height="25" rx="3" fill="#06070a" stroke="#334155" strokeWidth="1" />
              <text x="380" y="331" fill="#cbd5e1" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">
                {licensePlate}
              </text>

              {/* Fog Lights (Micro-details) */}
              <g
                style={{ cursor: 'pointer' }}
                onClick={() => onTogglePanel('fog_lights')}
                onMouseEnter={() => onHoverPanel('fog_lights')}
                onMouseLeave={() => onHoverPanel(null)}
              >
                <ellipse
                  cx="195"
                  cy="365"
                  rx="16"
                  ry="11"
                  fill={isSelected('fog_lights') ? '#ff2d4e' : '#070a10'}
                  stroke={isSelected('fog_lights') ? '#ffffff' : '#38bdf8'}
                  strokeWidth={isSelected('fog_lights') ? 2.5 : 1.5}
                />
                <circle cx="195" cy="365" r="4.5" fill="#ffffff" />

                <ellipse
                  cx="565"
                  cy="365"
                  rx="16"
                  ry="11"
                  fill={isSelected('fog_lights') ? '#ff2d4e' : '#070a10'}
                  stroke={isSelected('fog_lights') ? '#ffffff' : '#38bdf8'}
                  strokeWidth={isSelected('fog_lights') ? 2.5 : 1.5}
                />
                <circle cx="565" cy="365" r="4.5" fill="#ffffff" />

                <text x="195" y="392" fill={isSelected('fog_lights') ? '#ff2d4e' : '#38bdf8'} fontSize="9" fontWeight="bold" fontFamily="var(--font-mono)" textAnchor="middle">
                  ANTINIEBLA
                </text>
                <text x="565" y="392" fill={isSelected('fog_lights') ? '#ff2d4e' : '#38bdf8'} fontSize="9" fontWeight="bold" fontFamily="var(--font-mono)" textAnchor="middle">
                  ANTINIEBLA
                </text>
              </g>

              {/* Front Splitter / Lip */}
              <g
                style={{ cursor: 'pointer' }}
                onClick={() => onTogglePanel('front_splitter')}
                onMouseEnter={() => onHoverPanel('front_splitter')}
                onMouseLeave={() => onHoverPanel(null)}
              >
                <path
                  d="M 125 365 C 195 405 565 405 635 365 L 640 380 C 560 425 200 425 120 380 Z"
                  fill={isSelected('front_splitter') ? 'rgba(230, 25, 55, 0.75)' : '#0d1017'}
                  stroke={isSelected('front_splitter') ? '#ff2d4e' : '#e61937'}
                  strokeWidth={isSelected('front_splitter') ? 3 : 2}
                />
                <text x="380" y="408" fill={isSelected('front_splitter') ? '#ffffff' : '#e61937'} fontSize="10" fontWeight="bold" fontFamily="var(--font-mono)" textAnchor="middle">
                  SPLITTER / LIP FRONTAL AERODINÁMICO
                </text>
              </g>
            </svg>
          )}

          {/* =========================================================================
              VISTA SUPERIOR DE PLANTA
             ========================================================================= */}
          {activeView === 'top' && (
            <svg viewBox="0 0 820 480" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))' }}>
              <defs>
                <filter id="crimsonGlowTop" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#e61937" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Outline */}
              <path
                d="M 110 240 C 110 160 155 105 240 92 C 380 82 540 82 640 102 C 700 115 740 170 740 240 C 740 310 700 365 640 378 C 540 398 380 398 240 388 C 155 375 110 320 110 240 Z"
                fill="none"
                stroke="#1c202a"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* Front Bumper & Splitter */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('front_bumper')} onMouseEnter={() => onHoverPanel('front_bumper')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 120 175 C 105 205 105 275 120 305 L 155 308 C 145 275 145 205 155 172 Z"
                  fill={isSelected('front_bumper') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke={isSelected('front_bumper') ? '#ff2d4e' : '#242b38'}
                  strokeWidth="2"
                />
              </g>

              {/* Hood */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('hood')} onMouseEnter={() => onHoverPanel('hood')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 158 172 C 150 215 150 265 158 308 L 295 325 C 300 270 300 210 295 155 Z"
                  fill={isSelected('hood') ? 'rgba(230, 25, 55, 0.45)' : '#0f131c'}
                  stroke={isSelected('hood') ? '#ff2d4e' : '#334155'}
                  strokeWidth="2.5"
                  filter={isSelected('hood') ? 'url(#crimsonGlowTop)' : undefined}
                />
                <text x="225" y="244" fill={isSelected('hood') ? '#ffffff' : '#94a3b8'} fontSize="13" fontWeight="bold" fontFamily="var(--font-main)" textAnchor="middle">
                  CAPOT
                </text>
              </g>

              {/* Front Fenders L/R */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('fender_left')} onMouseEnter={() => onHoverPanel('fender_left')} onMouseLeave={() => onHoverPanel(null)}>
                <path d="M 160 135 L 290 155 L 285 110 C 220 105 180 115 160 135 Z" fill={isSelected('fender_left') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'} stroke="#242b38" strokeWidth="1.5" />
              </g>
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('fender_right')} onMouseEnter={() => onHoverPanel('fender_right')} onMouseLeave={() => onHoverPanel(null)}>
                <path d="M 160 345 L 290 325 L 285 370 C 220 375 180 365 160 345 Z" fill={isSelected('fender_right') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'} stroke="#242b38" strokeWidth="1.5" />
              </g>

              {/* Mirrors */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('mirrors')} onMouseEnter={() => onHoverPanel('mirrors')} onMouseLeave={() => onHoverPanel(null)}>
                <ellipse cx="290" cy="95" rx="18" ry="11" fill={isSelected('mirrors') ? '#e61937' : '#0e121a'} stroke={isSelected('mirrors') ? '#ff2d4e' : '#334155'} />
                <ellipse cx="290" cy="385" rx="18" ry="11" fill={isSelected('mirrors') ? '#e61937' : '#0e121a'} stroke={isSelected('mirrors') ? '#ff2d4e' : '#334155'} />
              </g>

              {/* Windshield */}
              <polygon points="300,158 360,172 360,308 300,322" fill="#080a10" stroke="#1c202a" strokeWidth="1.5" />

              {/* Roof */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('roof')} onMouseEnter={() => onHoverPanel('roof')} onMouseLeave={() => onHoverPanel(null)}>
                <rect x="365" y="168" width="175" height="144" rx="8" fill={isSelected('roof') ? 'rgba(230, 25, 55, 0.45)' : '#0f131c'} stroke={isSelected('roof') ? '#ff2d4e' : '#334155'} strokeWidth="2.5" />
                <text x="450" y="244" fill={isSelected('roof') ? '#ffffff' : '#94a3b8'} fontSize="13" fontWeight="bold" fontFamily="var(--font-main)" textAnchor="middle">
                  TECHO
                </text>
              </g>

              {/* Doors Front */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('doors_front')} onMouseEnter={() => onHoverPanel('doors_front')} onMouseLeave={() => onHoverPanel(null)}>
                <path d="M 295 152 L 420 162 L 420 108 L 290 110 Z" fill={isSelected('doors_front') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'} stroke="#242b38" />
                <path d="M 295 328 L 420 318 L 420 372 L 290 370 Z" fill={isSelected('doors_front') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'} stroke="#242b38" />
              </g>

              {/* Doors Rear */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('doors_rear')} onMouseEnter={() => onHoverPanel('doors_rear')} onMouseLeave={() => onHoverPanel(null)}>
                <path d="M 425 162 L 535 166 L 535 108 L 425 108 Z" fill={isSelected('doors_rear') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'} stroke="#242b38" />
                <path d="M 425 318 L 535 314 L 535 372 L 425 372 Z" fill={isSelected('doors_rear') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'} stroke="#242b38" />
              </g>

              {/* Rockers / Zócalos */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('rockers')} onMouseEnter={() => onHoverPanel('rockers')} onMouseLeave={() => onHoverPanel(null)}>
                <rect x="290" y="85" width="245" height="12" rx="2" fill={isSelected('rockers') ? '#e61937' : '#0d1017'} stroke="#242b38" />
                <rect x="290" y="383" width="245" height="12" rx="2" fill={isSelected('rockers') ? '#e61937' : '#0d1017'} stroke="#242b38" />
              </g>

              {/* Trunk / Portón */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('trunk')} onMouseEnter={() => onHoverPanel('trunk')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 545 180 L 655 185 C 665 215 665 265 655 295 L 545 300 Z"
                  fill={isSelected('trunk') ? 'rgba(230, 25, 55, 0.45)' : '#0f131c'}
                  stroke={isSelected('trunk') ? '#ff2d4e' : '#334155'}
                  strokeWidth="2.5"
                />
                <text x="600" y="244" fill={isSelected('trunk') ? '#ffffff' : '#94a3b8'} fontSize="13" fontWeight="bold" fontFamily="var(--font-main)" textAnchor="middle">
                  BAÚL
                </text>
              </g>

              {/* Rear Wing / Spoiler */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('rear_wing_spoiler')} onMouseEnter={() => onHoverPanel('rear_wing_spoiler')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 645 160 L 670 160 C 685 210 685 270 670 320 L 645 320 C 655 270 655 210 645 160 Z"
                  fill={isSelected('rear_wing_spoiler') ? '#e61937' : '#141822'}
                  stroke={isSelected('rear_wing_spoiler') ? '#ff2d4e' : '#334155'}
                  strokeWidth="2"
                />
              </g>

              {/* Luggage Loading Strip */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('luggage_strip')} onMouseEnter={() => onHoverPanel('luggage_strip')} onMouseLeave={() => onHoverPanel(null)}>
                <rect x="655" y="210" width="12" height="60" rx="3" fill={isSelected('luggage_strip') ? '#ff2d4e' : '#252e3d'} stroke="#e61937" />
              </g>

              {/* Rear Bumper */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('rear_bumper')} onMouseEnter={() => onHoverPanel('rear_bumper')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 660 180 C 680 210 680 270 660 300 L 690 288 C 700 260 700 220 690 192 Z"
                  fill={isSelected('rear_bumper') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke="#242b38"
                  strokeWidth="2"
                />
              </g>
            </svg>
          )}

          {/* =========================================================================
              VISTA LATERAL
             ========================================================================= */}
          {activeView === 'lateral' && (
            <svg viewBox="0 0 840 340" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))' }}>
              {/* Wheels */}
              <g>
                <circle cx="215" cy="245" r="48" fill="#080a10" stroke="#334155" strokeWidth="4" />
                <circle cx="215" cy="245" r="32" fill="#141822" stroke="#475569" strokeWidth="1.5" />
                <path d="M 235 220 A 28 28 0 0 0 243 250" stroke="#e61937" strokeWidth="8" fill="none" strokeLinecap="round" />
                <line x1="215" y1="205" x2="215" y2="285" stroke="#64748b" strokeWidth="2.5" />
                <line x1="175" y1="245" x2="255" y2="245" stroke="#64748b" strokeWidth="2.5" />

                <circle cx="625" cy="245" r="48" fill="#080a10" stroke="#334155" strokeWidth="4" />
                <circle cx="625" cy="245" r="32" fill="#141822" stroke="#475569" strokeWidth="1.5" />
                <path d="M 645 220 A 28 28 0 0 0 653 250" stroke="#e61937" strokeWidth="8" fill="none" strokeLinecap="round" />
                <line x1="625" y1="205" x2="625" y2="285" stroke="#64748b" strokeWidth="2.5" />
                <line x1="585" y1="245" x2="665" y2="245" stroke="#64748b" strokeWidth="2.5" />
              </g>

              {/* Front Bumper & Splitter */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('front_bumper')} onMouseEnter={() => onHoverPanel('front_bumper')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 105 220 C 100 180 115 155 160 145 L 210 142 L 235 195 C 220 200 200 205 180 240 L 120 240 Z"
                  fill={isSelected('front_bumper') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke={isSelected('front_bumper') ? '#ff2d4e' : '#242b38'}
                  strokeWidth="1.5"
                />
              </g>
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('front_splitter')}>
                <path d="M 98 230 L 135 242" stroke={isSelected('front_splitter') ? '#ff2d4e' : '#e61937'} strokeWidth="4" strokeLinecap="round" />
              </g>

              {/* Front Fender */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('fender_left')} onMouseEnter={() => onHoverPanel('fender_left')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 160 145 L 270 140 L 275 210 L 250 210 C 240 170 190 170 180 220 L 160 145 Z"
                  fill={isSelected('fender_left') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke="#242b38"
                  strokeWidth="1.5"
                />
              </g>

              {/* Front & Rear Doors */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('doors_front')} onMouseEnter={() => onHoverPanel('doors_front')} onMouseLeave={() => onHoverPanel(null)}>
                <path d="M 275 140 L 415 140 L 415 245 L 275 245 Z" fill={isSelected('doors_front') ? 'rgba(230, 25, 55, 0.45)' : '#0f131c'} stroke="#334155" strokeWidth="2" />
                <text x="345" y="195" fill={isSelected('doors_front') ? '#ffffff' : '#94a3b8'} fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle">PUERTA DEL.</text>
              </g>
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('doors_rear')} onMouseEnter={() => onHoverPanel('doors_rear')} onMouseLeave={() => onHoverPanel(null)}>
                <path d="M 420 140 L 545 140 L 545 210 C 530 215 530 245 545 245 L 420 245 Z" fill={isSelected('doors_rear') ? 'rgba(230, 25, 55, 0.45)' : '#0f131c'} stroke="#334155" strokeWidth="2" />
                <text x="480" y="195" fill={isSelected('doors_rear') ? '#ffffff' : '#94a3b8'} fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle">PUERTA TRAS.</text>
              </g>

              {/* Rocker Panel / Zócalo */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('rockers')} onMouseEnter={() => onHoverPanel('rockers')} onMouseLeave={() => onHoverPanel(null)}>
                <rect x="265" y="248" width="315" height="16" rx="3" fill={isSelected('rockers') ? '#e61937' : '#0d1017'} stroke="#242b38" strokeWidth="2" />
                <text x="420" y="260" fill="#ffffff" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">
                  ZÓCALO / ROCKER PANEL (2.10m)
                </text>
              </g>

              {/* Rear Quarter Panel */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('quarter_panels')} onMouseEnter={() => onHoverPanel('quarter_panels')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 548 140 L 710 160 L 715 225 L 675 225 C 665 185 600 185 590 225 L 548 225 Z"
                  fill={isSelected('quarter_panels') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke="#242b38"
                  strokeWidth="1.5"
                />
              </g>

              {/* Rear Wing */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('rear_wing_spoiler')} onMouseEnter={() => onHoverPanel('rear_wing_spoiler')} onMouseLeave={() => onHoverPanel(null)}>
                <path d="M 690 120 L 735 115 L 730 145 L 700 140 Z" fill={isSelected('rear_wing_spoiler') ? '#e61937' : '#141822'} stroke="#ff2d4e" strokeWidth="2" />
              </g>
            </svg>
          )}

          {/* =========================================================================
              VISTA TRASERA
             ========================================================================= */}
          {activeView === 'rear' && (
            <svg viewBox="0 0 680 440" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))' }}>
              {/* Tires */}
              <rect x="90" y="270" width="60" height="120" rx="8" fill="#07080c" stroke="#1c202a" />
              <rect x="530" y="270" width="60" height="120" rx="8" fill="#07080c" stroke="#1c202a" />

              {/* Rear Windshield & Roof */}
              <polygon points="190,95 490,95 530,175 150,175" fill="#080a10" stroke="#1c202a" strokeWidth="2" />
              <rect x="300" y="100" width="80" height="6" rx="2" fill="#e61937" />

              {/* Rear Wing Blade */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('rear_wing_spoiler')} onMouseEnter={() => onHoverPanel('rear_wing_spoiler')} onMouseLeave={() => onHoverPanel(null)}>
                <path d="M 120 70 L 560 70 L 545 88 L 135 88 Z" fill={isSelected('rear_wing_spoiler') ? 'rgba(230, 25, 55, 0.85)' : '#141822'} stroke="#ff2d4e" strokeWidth="2" />
                <line x1="240" y1="88" x2="250" y2="175" stroke="#334155" strokeWidth="3" />
                <line x1="440" y1="88" x2="430" y2="175" stroke="#334155" strokeWidth="3" />
              </g>

              {/* Trunk / Portón */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('trunk')} onMouseEnter={() => onHoverPanel('trunk')} onMouseLeave={() => onHoverPanel(null)}>
                <polygon
                  points="150,175 530,175 515,255 165,255"
                  fill={isSelected('trunk') ? 'rgba(230, 25, 55, 0.45)' : '#0f131c'}
                  stroke={isSelected('trunk') ? '#ff2d4e' : '#334155'}
                  strokeWidth="2.5"
                />
                <text x="340" y="215" fill={isSelected('trunk') ? '#ffffff' : '#94a3b8'} fontSize="13" fontWeight="bold" fontFamily="var(--font-main)" textAnchor="middle">
                  PORTÓN / BAÚL
                </text>
              </g>

              {/* Lightbar */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('taillights')}>
                <path d="M 145 240 L 535 240 L 530 258 L 150 258 Z" fill="#881323" stroke="#e61937" strokeWidth="1.5" />
                <path d="M 160 248 L 520 248" stroke="#ff8090" strokeWidth="3" strokeLinecap="round" />
              </g>

              {/* Luggage Strip */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('luggage_strip')} onMouseEnter={() => onHoverPanel('luggage_strip')} onMouseLeave={() => onHoverPanel(null)}>
                <rect x="220" y="260" width="240" height="14" rx="3" fill={isSelected('luggage_strip') ? '#ff2d4e' : '#1a2230'} stroke="#e61937" strokeWidth="1.5" />
                <text x="340" y="271" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="var(--font-mono)" textAnchor="middle">
                  BANDA UMBRAL DE CARGA
                </text>
              </g>

              {/* Rear Bumper Body */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('rear_bumper')} onMouseEnter={() => onHoverPanel('rear_bumper')} onMouseLeave={() => onHoverPanel(null)}>
                <path
                  d="M 125 258 L 555 258 L 545 350 C 470 375 210 375 135 350 Z"
                  fill={isSelected('rear_bumper') ? 'rgba(230, 25, 55, 0.45)' : '#0d1017'}
                  stroke={isSelected('rear_bumper') ? '#ff2d4e' : '#242b38'}
                  strokeWidth="2.5"
                />
                <text x="340" y="315" fill={isSelected('rear_bumper') ? '#ffffff' : '#94a3b8'} fontSize="12" fontWeight="bold" fontFamily="var(--font-main)" textAnchor="middle">
                  PARAGOLPES TRASERO
                </text>
              </g>

              {/* Diffuser & Exhausts */}
              <g style={{ cursor: 'pointer' }} onClick={() => onTogglePanel('rear_diffuser')} onMouseEnter={() => onHoverPanel('rear_diffuser')} onMouseLeave={() => onHoverPanel(null)}>
                <path d="M 180 350 L 500 350 L 485 390 L 195 390 Z" fill={isSelected('rear_diffuser') ? '#e61937' : '#07090e'} stroke="#334155" strokeWidth="1.5" />
                <circle cx="230" cy="370" r="12" fill="#141822" stroke="#64748b" strokeWidth="2" />
                <circle cx="450" cy="370" r="12" fill="#141822" stroke="#64748b" strokeWidth="2" />
                <text x="340" y="378" fill="#ffffff" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle">
                  DIFUSOR INFERIOR
                </text>
              </g>
            </svg>
          )}
        </div>

        {/* Floating panel hover badge */}
        {hoveredPanel && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(12, 14, 20, 0.95)',
              border: '1px solid var(--accent-red-border)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '11px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
              pointerEvents: 'none',
              zIndex: 30,
              maxWidth: '240px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>{hoveredPanel.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red-hover)', fontWeight: 700 }}>
                {hoveredPanel.cutLength}m
              </span>
            </div>
            <div style={{ color: '#9aa4b2', fontSize: '10px', marginBottom: 6 }}>{hoveredPanel.spanishName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9px', fontFamily: 'var(--font-mono)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
              <div>Área: <span style={{ color: '#ffffff', fontWeight: 600 }}>{hoveredPanel.sqMeters} m²</span></div>
              <div>Labor: <span style={{ color: '#ffffff', fontWeight: 600 }}>{hoveredPanel.laborHours}h</span></div>
              <div>Dif: <span style={{ color: '#f59e0b' }}>{hoveredPanel.difficulty}</span></div>
              <div>Corte: <span style={{ color: isSelected(hoveredPanel.id) ? '#10b981' : '#64748b' }}>{isSelected(hoveredPanel.id) ? 'ACTIVO' : 'INACTIVO'}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
