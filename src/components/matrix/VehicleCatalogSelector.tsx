'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { VehicleProfile, VehicleCategory } from '@/types/ppf';
import {
  Search,
  ArrowUpRight,
  ArrowLeft,
  X,
  RotateCcw,
} from 'lucide-react';

interface VehicleCatalogSelectorProps {
  vehicles: VehicleProfile[];
  initialBrand?: string | null;
  onSelectVehicle: (vehicleId: string) => void;
}

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  HATCHBACK: 'Hatchback',
  SUV: 'SUV',
  COUPE_SUPERCAR: 'Coupé',
  SEDAN: 'Sedán',
  PICKUP: 'Pick-up',
};

export const BRAND_LOGOS: Record<string, string> = {
  Audi: '/brands/audi.png',
  BMW: '/brands/bmw.png',
  Chevrolet: '/brands/chevrolet.png',
  Ford: '/brands/ford.png',
  Jeep: '/brands/jeep.png',
  'Mercedes-Benz': '/brands/mercedes-benz.png',
  Peugeot: '/brands/peugeot.png',
  Renault: '/brands/renault.png',
  Toyota: '/brands/toyota.png',
  Volkswagen: '/brands/volkswagen.png',
};

export const VehicleCatalogSelector: React.FC<VehicleCatalogSelectorProps> = ({
  vehicles,
  initialBrand = null,
  onSelectVehicle,
}) => {
  const [activeBrand, setActiveBrand] = useState<string | null>(initialBrand);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  useEffect(() => {
    setActiveBrand(initialBrand);
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedYear('ALL');
  }, [initialBrand]);

  // Group vehicles by brand, including all registered brands in BRAND_LOGOS
  const brandsSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        brand: string;
        logo: string;
        models: VehicleProfile[];
      }
    >();

    Object.entries(BRAND_LOGOS).forEach(([brand, logo]) => {
      map.set(brand, {
        brand,
        logo,
        models: [],
      });
    });

    vehicles.forEach((v) => {
      if (!map.has(v.brand)) {
        map.set(v.brand, {
          brand: v.brand,
          logo: BRAND_LOGOS[v.brand] || '',
          models: [],
        });
      }
      map.get(v.brand)!.models.push(v);
    });

    return Array.from(map.values()).sort((a, b) => a.brand.localeCompare(b.brand));
  }, [vehicles]);

  // Filtered brands when on the Brand Catalog view
  const filteredBrands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return brandsSummary;
    return brandsSummary.filter(
      (b) =>
        b.brand.toLowerCase().includes(q) ||
        b.models.some(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.year.toString().includes(q)
        )
    );
  }, [brandsSummary, searchQuery]);

  // Vehicles for the currently selected brand
  const brandVehicles = useMemo(() => {
    if (!activeBrand) return [];
    return vehicles.filter((v) => v.brand === activeBrand);
  }, [vehicles, activeBrand]);

  const uniqueYearsForBrand = useMemo(() => {
    return Array.from(new Set(brandVehicles.map((v) => v.year))).sort((a, b) => b - a);
  }, [brandVehicles]);

  const uniqueCategoriesForBrand = useMemo(() => {
    return Array.from(new Set(brandVehicles.map((v) => v.category))).sort();
  }, [brandVehicles]);

  const filteredBrandVehicles = useMemo(() => {
    return brandVehicles.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.year.toString().includes(q);

      const matchesCategory = selectedCategory === 'ALL' || v.category === selectedCategory;
      const matchesYear = selectedYear === 'ALL' || v.year.toString() === selectedYear;

      return matchesSearch && matchesCategory && matchesYear;
    });
  }, [brandVehicles, searchQuery, selectedCategory, selectedYear]);

  const handleOpenBrand = (brand: string) => {
    setActiveBrand(brand);
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedYear('ALL');
  };

  const handleBackToBrands = () => {
    setActiveBrand(null);
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedYear('ALL');
  };

  /* ============================================================================
     VIEW 1: BRAND CATALOG (CATÁLOGO DE MARCAS)
     ============================================================================ */
  if (!activeBrand) {
    return (
      <div>
        {/* Header Bar */}
        <div className="section-header">
          <div>
            <div
              className="mono"
              style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}
            >
              STUDIO / SELECCIÓN DE MARCA
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>
              Catálogo de Marcas
            </h1>
          </div>

          {/* Search Input */}
          <div className="filter-search-box" style={{ position: 'relative', width: '280px' }}>
            <Search
              size={14}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '11px' }}
            />
            <input
              type="text"
              aria-label="Buscar marca"
              placeholder="Buscar marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '34px',
                paddingRight: searchQuery ? '30px' : '12px',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '9px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Brands Grid */}
        {filteredBrands.length === 0 ? (
          <div className="state-box">
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Sin marcas que coincidan con &ldquo;{searchQuery}&rdquo;
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="btn btn-secondary btn-sm"
            >
              Ver todas las marcas
            </button>
          </div>
        ) : (
          <div className="brand-cards-grid">
            {filteredBrands.map((b) => (
              <div
                key={b.brand}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenBrand(b.brand)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenBrand(b.brand);
                  }
                }}
                className="interactive-card"
                style={{
                  padding: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
              >
                {/* Logo Pedestal Stage */}
                <div
                  style={{
                    height: '164px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--space-6)',
                  }}
                >
                  {b.logo ? (
                    <img
                      src={b.logo}
                      alt={`Logo de ${b.brand}`}
                      style={{
                        maxHeight: '96px',
                        maxWidth: '160px',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 'var(--text-xl)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {b.brand}
                    </span>
                  )}
                </div>

                {/* Clean Brand Name + Model Count Only */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>
                    {b.brand}
                  </h2>

                  <span
                    className="mono"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {b.models.length} {b.models.length === 1 ? 'modelo' : 'modelos'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ============================================================================
     VIEW 2: SPECIFIC BRAND VEHICLE LIST (MODELOS DE LA MARCA)
     ============================================================================ */
  const hasBrandFilters =
    searchQuery.trim() !== '' || selectedCategory !== 'ALL' || selectedYear !== 'ALL';

  return (
    <div>
      {/* Brand Header Bar with Back Navigation */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleBackToBrands}
            className="btn btn-secondary btn-sm"
          >
            <ArrowLeft size={13} />
            <span>Marcas</span>
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-card)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {BRAND_LOGOS[activeBrand] && (
              <img
                src={BRAND_LOGOS[activeBrand]}
                alt={activeBrand}
                style={{
                  height: '32px',
                  width: '32px',
                  objectFit: 'contain',
                }}
              />
            )}
            <div>
              <div
                className="mono"
                style={{
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}
              >
                {brandVehicles.length} {brandVehicles.length === 1 ? 'MODELO' : 'MODELOS'}
              </div>
              <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>
                {activeBrand}
              </h1>
            </div>
          </div>
        </div>

        {/* Inline Filters for Selected Brand */}
        <div
          className="filter-controls-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          <div className="filter-search-box" style={{ position: 'relative', width: '240px' }}>
            <Search
              size={14}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '11px' }}
            />
            <input
              type="text"
              aria-label={`Buscar modelo en ${activeBrand}`}
              placeholder={`Buscar en ${activeBrand}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '34px',
                paddingRight: searchQuery ? '30px' : '12px',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '9px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            aria-label="Filtrar por carrocería"
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="ALL">Carrocería: Todas</option>
            {uniqueCategoriesForBrand.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] || c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por año"
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="ALL">Año: Todos</option>
            {uniqueYearsForBrand.map((y) => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>

          {hasBrandFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedYear('ALL');
              }}
              className="btn btn-secondary btn-sm"
            >
              <RotateCcw size={12} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Vehicle List for Brand */}
      {filteredBrandVehicles.length === 0 ? (
        <div className="state-box">
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {brandVehicles.length === 0
              ? `Sin modelos cargados para ${activeBrand} todavía`
              : `Sin modelos de ${activeBrand} para este filtro`}
          </div>
          <button
            type="button"
            onClick={() => {
              if (brandVehicles.length === 0) {
                handleBackToBrands();
              } else {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedYear('ALL');
              }
            }}
            className="btn btn-secondary btn-sm"
          >
            {brandVehicles.length === 0 ? 'Volver a Marcas' : 'Restablecer filtros'}
          </button>
        </div>
      ) : (
        <div className="vehicle-cards-grid">
          {filteredBrandVehicles.map((v) => {
            const shortModelName = v.name.startsWith(v.brand)
              ? v.name.slice(v.brand.length).trim()
              : v.name;

            return (
              <div
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectVehicle(v.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectVehicle(v.id);
                  }
                }}
                className="interactive-card"
                style={{
                  padding: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-5)',
                }}
              >
                {/* Top Metadata & Model Title */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {BRAND_LOGOS[v.brand] && (
                        <img
                          src={BRAND_LOGOS[v.brand]}
                          alt={v.brand}
                          style={{ height: '18px', width: '18px', objectFit: 'contain' }}
                        />
                      )}
                      <span
                        className="mono"
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {v.brand} · {v.year}
                      </span>
                    </div>

                    <span
                      className="mono"
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-card)',
                        background: 'var(--bg-surface)',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-sm)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {CATEGORY_LABELS[v.category] || v.category}
                    </span>
                  </div>

                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>
                    {shortModelName}
                  </h2>
                </div>

                {/* Technical Specs Table */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-3)',
                    paddingTop: 'var(--space-3)',
                    paddingBottom: 'var(--space-3)',
                    borderTop: '1px solid var(--border-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '2px',
                      }}
                    >
                      Dimensiones
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 500 }}
                    >
                      {v.lengthMeters.toFixed(2)} × {v.widthMeters.toFixed(2)}m
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '2px',
                      }}
                    >
                      Factor Escala
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 500 }}
                    >
                      {v.scaleFactor.toFixed(2)}×
                    </div>
                  </div>
                </div>

                {/* Footer Action Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span className="mono" style={{ color: 'var(--text-muted)' }}>
                    Showroom 3D
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>Configurar</span>
                    <ArrowUpRight size={14} color="var(--accent-red)" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
