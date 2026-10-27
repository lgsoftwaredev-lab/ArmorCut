/* eslint-disable @next/next/no-img-element */
import React from 'react';

interface BrandProps {
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const PlusCarsLogo: React.FC<BrandProps> = ({
  height = 20,
  className = '',
  style = {},
}) => {
  return (
    <img
      src="/brand/pluscars-logo.png"
      alt="PlusCars Detailing"
      className={className}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: 'auto',
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 0 10px rgba(255, 26, 60, 0.25))',
        ...style,
      }}
    />
  );
};

export const PlusCarsMonogram: React.FC<BrandProps> = ({
  height = 24,
  className = '',
  style = {},
}) => {
  return (
    <img
      src="/brand/pluscars-monogram.png"
      alt="PlusCars Emblem"
      className={className}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: 'auto',
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 0 8px rgba(255, 26, 60, 0.3))',
        ...style,
      }}
    />
  );
};
