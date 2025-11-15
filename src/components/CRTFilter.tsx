import React from 'react';

export const CRTFilter: React.FC = () => {
  return (
    <svg className="crt-filter" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="crt">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            seed="1"
          />
          <feDisplacementMap
            in="SourceGraphic"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#crt)" opacity="0.08" />
    </svg>
  );
};
