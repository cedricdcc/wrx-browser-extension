import React from 'react';

interface StitchLogoProps {
  size?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

export const StitchLogo = ({ size = 36, style, className }: StitchLogoProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      className={className}
    >
      {/* Dark circular emblem background with soft silver rim */}
      <circle cx="50" cy="50" r="46" fill="#090d16" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2.5" />
      
      {/* Left Network Mesh (Cyan) - represent Web Topology */}
      <g stroke="var(--accent-cyan)" strokeWidth="0.65" strokeOpacity="0.8">
        <line x1="28" y1="21" x2="35" y2="31" />
        <line x1="35" y1="31" x2="25" y2="41" />
        <line x1="25" y1="41" x2="18" y2="31" />
        <line x1="18" y1="31" x2="28" y2="21" />
        <line x1="28" y1="21" x2="25" y2="41" />
        
        <line x1="25" y1="41" x2="33" y2="51" />
        <line x1="33" y1="51" x2="20" y2="61" />
        <line x1="20" y1="61" x2="12" y2="49" />
        <line x1="12" y1="49" x2="25" y2="41" />
        <line x1="18" y1="31" x2="12" y2="49" />
        
        <line x1="20" y1="61" x2="29" y2="71" />
        <line x1="29" y1="71" x2="16" y2="81" />
        <line x1="16" y1="81" x2="11" y2="69" />
        <line x1="11" y1="69" x2="20" y2="61" />
        <line x1="12" y1="49" x2="11" y2="69" />
      </g>
      
      {/* Cyan Node Dots */}
      <g fill="var(--accent-cyan)">
        <circle cx="28" cy="21" r="1.5" />
        <circle cx="35" cy="31" r="2.2" fill="#22d3ee" style={{ filter: 'drop-shadow(0 0 2px var(--accent-cyan))' }} />
        <circle cx="25" cy="41" r="2.2" fill="#22d3ee" style={{ filter: 'drop-shadow(0 0 2px var(--accent-cyan))' }} />
        <circle cx="18" cy="31" r="1.5" />
        <circle cx="33" cy="51" r="1.5" />
        <circle cx="20" cy="61" r="2.2" fill="#22d3ee" style={{ filter: 'drop-shadow(0 0 2px var(--accent-cyan))' }} />
        <circle cx="12" cy="49" r="1.5" />
        <circle cx="29" cy="71" r="1.5" />
        <circle cx="16" cy="81" r="1.5" />
        <circle cx="11" cy="69" r="1.5" />
      </g>

      {/* Right Network Mesh (Teal/Green) - represent Semantic Linked Pieces */}
      <g stroke="#10b981" strokeWidth="0.65" strokeOpacity="0.8">
        <line x1="72" y1="21" x2="65" y2="31" />
        <line x1="65" y1="31" x2="75" y2="41" />
        <line x1="75" y1="41" x2="82" y2="31" />
        <line x1="82" y1="31" x2="72" y2="21" />
        <line x1="72" y1="21" x2="75" y2="41" />
        
        <line x1="75" y1="41" x2="67" y2="51" />
        <line x1="67" y1="51" x2="80" y2="61" />
        <line x1="80" y1="61" x2="88" y2="49" />
        <line x1="88" y1="49" x2="75" y2="41" />
        <line x1="82" y1="31" x2="88" y2="49" />
        
        <line x1="80" y1="61" x2="71" y2="71" />
        <line x1="71" y1="71" x2="84" y2="81" />
        <line x1="84" y1="81" x2="89" y2="69" />
        <line x1="89" y1="69" x2="80" y2="61" />
        <line x1="88" y1="49" x2="89" y2="69" />
      </g>
      
      {/* Teal/Green Node Dots */}
      <g fill="#10b981">
        <circle cx="72" cy="21" r="1.5" />
        <circle cx="65" cy="31" r="2.2" fill="#34d399" style={{ filter: 'drop-shadow(0 0 2px #10b981)' }} />
        <circle cx="75" cy="41" r="2.2" fill="#34d399" style={{ filter: 'drop-shadow(0 0 2px #10b981)' }} />
        <circle cx="82" cy="31" r="1.5" />
        <circle cx="67" cy="51" r="1.5" />
        <circle cx="80" cy="61" r="2.2" fill="#34d399" style={{ filter: 'drop-shadow(0 0 2px #10b981)' }} />
        <circle cx="88" cy="49" r="1.5" />
        <circle cx="71" cy="71" r="1.5" />
        <circle cx="84" cy="81" r="1.5" />
        <circle cx="89" cy="69" r="1.5" />
      </g>

      {/* Grommets / Eyelets placed sequentially along the perfect S-curve path */}
      <g fill="#020617" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.8">
        <circle cx="60" cy="18" r="3.2" />
        <circle cx="52" cy="17" r="3.2" />
        <circle cx="44" cy="21" r="3.2" />
        <circle cx="39" cy="27" r="3.2" />
        <circle cx="38" cy="33" r="3.2" />
        <circle cx="40" cy="41" r="3.2" />
        <circle cx="46" cy="47" r="3.2" />
        <circle cx="55" cy="49" r="3.2" />
        <circle cx="61" cy="55" r="3.2" />
        <circle cx="62" cy="63" r="3.2" />
        <circle cx="57" cy="71" r="3.2" />
        <circle cx="49" cy="76" r="3.2" />
        <circle cx="45" cy="78" r="3.2" />
      </g>

      {/* Continuous S-shaped Braided Rope Thread sewing the grommets together */}
      <g strokeLinecap="round" fill="none">
        {/* Thick continuous S shadow under-layer for 3D depth */}
        <path
          d="M 60 18 C 50 16, 38 22, 38 33 C 38 48, 62 48, 62 63 C 62 74, 50 80, 45 78"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="6.5"
        />
        {/* Pure white continuous rope base */}
        <path
          d="M 60 18 C 50 16, 38 22, 38 33 C 38 48, 62 48, 62 63 C 62 74, 50 80, 45 78"
          stroke="#ffffff"
          strokeWidth="4.5"
        />
        {/* Braided/twisted rope silver cord texture lines */}
        <path
          d="M 60 18 C 50 16, 38 22, 38 33 C 38 48, 62 48, 62 63 C 62 74, 50 80, 45 78"
          stroke="#e2e8f0"
          strokeWidth="2.5"
          strokeDasharray="2 3"
        />
      </g>

      {/* Terminals / Glowing Endpoint Nodes (Top-Right & Bottom-Left S-extremes) */}
      <g>
        {/* Glow backdrop circles */}
        <circle cx="60" cy="18" r="6.5" fill="#60a5fa" opacity="0.45" style={{ filter: 'blur(2px)' }} />
        <circle cx="60" cy="18" r="3.5" fill="#ffffff" />
        <circle cx="60" cy="18" r="2.5" fill="none" stroke="#3b82f6" strokeWidth="1.2" />

        <circle cx="45" cy="78" r="6.5" fill="#60a5fa" opacity="0.45" style={{ filter: 'blur(2px)' }} />
        <circle cx="45" cy="78" r="3.5" fill="#ffffff" />
        <circle cx="45" cy="78" r="2.5" fill="none" stroke="#3b82f6" strokeWidth="1.2" />
      </g>
    </svg>
  );
};
