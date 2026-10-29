'use client';

import React, { useState, useMemo } from 'react';
import { VehicleProfile, VehicleCategory } from '@/types/ppf';
import {
  Search,
  Filter,
  Car,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Check,
  X,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface VehicleCatalogSelectorProps {
  vehicles: VehicleProfile[];
  onSelectVehicle: (vehicleId: string) => void;
}

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  HATCHBACK: 'Hatchback Deportivo',
  SUV: 'SUV / 4x4 Todo Terreno',
  COUPE_SUPERCAR: 'Coupé Supercar',
  SEDAN: 'Sedán',
  PICKUP: 'Pick-up',
};

export const VehicleCatalogSelector: React.FC<VehicleCatalogSelectorProps> = ({
  vehicles,
  onSelectVehicle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  // Extract unique brands and years dynamically
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => v.brand))).sort();
  }, [vehicles]);

  const uniqueYears = useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => v.year))).sort((a, b) => b - a);
  }, [vehicles]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => v.category))).sort();
  }, [vehicles]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Text search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.badge.toLowerCase().includes(q) ||
        v.year.toString().includes(q) ||
        v.features.some((f) => f.toLowerCase().includes(q));

      // Brand filter
      const matchesBrand = selectedBrand === 'ALL' || v.brand === selectedBrand;

      // Category filter
      const matchesCategory = selectedCategory === 'ALL' || v.category === selectedCategory;

      // Year filter
      const matchesYear = selectedYear === 'ALL' || v.year.toString() === selectedYear;

      return matchesSearch && matchesBrand && matchesCategory && matchesYear;
    });
  }, [vehicles, searchQuery, selectedBrand, selectedCategory, selectedYear]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedBrand !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedYear !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('ALL');
    setSelectedCategory('ALL');
    setSelectedYear('ALL');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Supercar Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(13, 16, 23, 0.95) 0%, rgba(18, 22, 33, 0.85) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Subtle accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(225, 29, 72, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--accent-red)',
              background: 'rgba(230, 25, 55, 0.12)',
              border: '1px solid rgba(230, 25, 55, 0.25)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 700,
            }}
          >
            Studio CAD • Catálogo de Vehículos
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            4 Modelos 3D Optimizados Disponibles
          </span>
        </div>

        <div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Selecciona un Vehículo para Configurar PPF
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              margin: 0,
              maxWidth: '720px',
              lineHeight: 1.5,
            }}
          >
            Explora nuestra flota de modelos 3D con despiece de chapa paramétrico, simulación de
            anidado de bobinas en tiempo real y cotización instantánea de protección automotriz.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          background: 'rgba(13, 16, 23, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 280px',
              maxWidth: '460px',
            }}
          >
            <Search
              size={17}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '12px' }}
            />
            <input
              type="text"
              placeholder="Buscar por marca, modelo, versión (ej: Golf, M2, SW4)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: searchQuery ? '36px' : '12px',
                background: 'rgba(7, 9, 14, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                borderRadius: '8px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="Limpiar búsqueda"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Dropdown Filters Group */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {/* Filter by Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Marca:</span>
              <select
                className="form-select"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{
                  background: 'rgba(7, 9, 14, 0.7)',
                  borderColor: selectedBrand !== 'ALL' ? 'var(--accent-red)' : 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                }}
              >
                <option value="ALL">Todas las Marcas</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tipo:</span>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  background: 'rgba(7, 9, 14, 0.7)',
                  borderColor: selectedCategory !== 'ALL' ? 'var(--accent-red)' : 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                }}
              >
                <option value="ALL">Todas las Carrocerías</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c] || c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Year */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Año:</span>
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  background: 'rgba(7, 9, 14, 0.7)',
                  borderColor: selectedYear !== 'ALL' ? 'var(--accent-red)' : 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                }}
              >
                <option value="ALL">Todos los Años</option>
                {uniqueYears.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters button if any active */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  color: '#f87171',
                  borderColor: 'rgba(248, 113, 113, 0.3)',
                }}
                title="Restablecer filtros"
              >
                <RotateCcw size={13} />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Counter feedback */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#64748b',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '10px',
          }}
        >
          <span>
            Mostrando <strong style={{ color: '#ffffff' }}>{filteredVehicles.length}</strong> de{' '}
            {vehicles.length} vehículos con soporte 3D
          </span>
          {hasActiveFilters && (
            <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>Filtros activos</span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 ? (
        <div
          style={{
            background: 'rgba(13, 16, 23, 0.6)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '50px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(230, 25, 55, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-red)',
            }}
          >
            <Car size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', color: '#ffffff', margin: '0 0 6px 0' }}>
              No se encontraron vehículos
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '420px' }}>
              No hay modelos 3D que coincidan con los criterios de búsqueda seleccionados.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '8px' }}
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        /* Grid of Vehicle Cards */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredVehicles.map((v) => (
            <div
              key={v.id}
              onClick={() => onSelectVehicle(v.id)}
              style={{
                background: 'linear-gradient(180deg, rgba(13, 16, 23, 0.95) 0%, rgba(9, 11, 17, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                cursor: 'pointer',
                transition: 'all 0.22s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(225, 29, 72, 0.5)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(225, 29, 72, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Header Badges */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#f8fafc',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {v.brand}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--accent-red)',
                        background: 'rgba(230, 25, 55, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '5px',
                      }}
                    >
                      {v.year}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      background: 'rgba(148, 163, 184, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontWeight: 500,
                    }}
                  >
                    {CATEGORY_LABELS[v.category] || v.category}
                  </span>
                </div>

                {/* Vehicle Name */}
                <h3
                  style={{
                    fontSize: '19px',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: '0 0 6px 0',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {v.name}
                </h3>

                {/* Vehicle Badge Tagline */}
                <div
                  style={{
                    fontSize: '12px',
                    color: '#cbd5e1',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ color: 'var(--accent-red)' }}>✦</span>
                  {v.badge}
                </div>

                {/* Specs Pill Strip */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    background: 'rgba(7, 9, 14, 0.6)',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      Dimensiones
                    </div>
                    <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {v.lengthMeters}m x {v.widthMeters}m
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      Despiece PPF
                    </div>
                    <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      24 Paneles CAD
                    </div>
                  </div>
                </div>

                {/* Key Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {v.features.slice(0, 3).map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#94a3b8',
                        lineHeight: 1.4,
                      }}
                    >
                      <Check
                        size={13}
                        color="var(--accent-red)"
                        style={{ marginTop: '2px', flexShrink: 0 }}
                      />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 6px #10b981',
                    }}
                  />
                  <span>WebGL 3D Listo</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--accent-red)',
                  }}
                >
                  <span>Abrir en Studio</span>
                  <ArrowRight size={15} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
