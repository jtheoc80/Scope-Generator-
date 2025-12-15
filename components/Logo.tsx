import React from 'react';

interface LogoProps {
  variant?: 'default' | 'icon-only' | 'horizontal' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

// Brand colors
const COLORS = {
  primary: '#3d5a80',    // Navy blue
  secondary: '#f5a623', // Safety orange
  white: '#ffffff',
  dark: '#1e3a5f',
};

/**
 * ScopeGen Logo - Option 1: Scope/Target Design
 * Represents precision and scope of work with a stylized crosshair
 */
export function LogoScopeTarget({ 
  size = 'md', 
  className = '',
  showText = true 
}: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 32, text: 'text-xl', gap: 'gap-2' },
    lg: { icon: 40, text: 'text-2xl', gap: 'gap-2.5' },
    xl: { icon: 56, text: 'text-3xl', gap: 'gap-3' },
  };
  
  const { icon, text, gap } = sizes[size];
  
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer rounded square */}
        <rect x="4" y="4" width="40" height="40" rx="8" fill={COLORS.primary} />
        
        {/* Inner scope circle */}
        <circle cx="24" cy="24" r="12" stroke={COLORS.secondary} strokeWidth="3" fill="none" />
        
        {/* Crosshair lines */}
        <line x1="24" y1="8" x2="24" y2="16" stroke={COLORS.secondary} strokeWidth="3" strokeLinecap="round" />
        <line x1="24" y1="32" x2="24" y2="40" stroke={COLORS.secondary} strokeWidth="3" strokeLinecap="round" />
        <line x1="8" y1="24" x2="16" y2="24" stroke={COLORS.secondary} strokeWidth="3" strokeLinecap="round" />
        <line x1="32" y1="24" x2="40" y2="24" stroke={COLORS.secondary} strokeWidth="3" strokeLinecap="round" />
        
        {/* Center dot */}
        <circle cx="24" cy="24" r="3" fill={COLORS.secondary} />
      </svg>
      
      {showText && (
        <span className={`font-bold ${text} text-slate-900 tracking-tight`}>
          <span className="text-[#3d5a80]">Scope</span>
          <span className="text-[#f5a623]">Gen</span>
        </span>
      )}
    </div>
  );
}

/**
 * ScopeGen Logo - Option 2: Document/Checklist Design
 * Represents proposals and scope documents with checkmarks
 */
export function LogoDocument({ 
  size = 'md', 
  className = '',
  showText = true 
}: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 32, text: 'text-xl', gap: 'gap-2' },
    lg: { icon: 40, text: 'text-2xl', gap: 'gap-2.5' },
    xl: { icon: 56, text: 'text-3xl', gap: 'gap-3' },
  };
  
  const { icon, text, gap } = sizes[size];
  
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Document background */}
        <path 
          d="M8 8C8 5.79086 9.79086 4 12 4H28L40 16V40C40 42.2091 38.2091 44 36 44H12C9.79086 44 8 42.2091 8 40V8Z" 
          fill={COLORS.primary} 
        />
        
        {/* Folded corner */}
        <path 
          d="M28 4V12C28 14.2091 29.7909 16 32 16H40L28 4Z" 
          fill={COLORS.dark} 
        />
        
        {/* Checklist lines */}
        <rect x="14" y="22" width="20" height="3" rx="1.5" fill={COLORS.secondary} />
        <rect x="14" y="28" width="16" height="3" rx="1.5" fill={COLORS.secondary} opacity="0.7" />
        <rect x="14" y="34" width="12" height="3" rx="1.5" fill={COLORS.secondary} opacity="0.5" />
      </svg>
      
      {showText && (
        <span className={`font-bold ${text} text-slate-900 tracking-tight`}>
          <span className="text-[#3d5a80]">Scope</span>
          <span className="text-[#f5a623]">Gen</span>
        </span>
      )}
    </div>
  );
}

/**
 * ScopeGen Logo - Option 3: Building Blocks Design
 * Represents construction and building with geometric blocks
 */
export function LogoBlocks({ 
  size = 'md', 
  className = '',
  showText = true 
}: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 32, text: 'text-xl', gap: 'gap-2' },
    lg: { icon: 40, text: 'text-2xl', gap: 'gap-2.5' },
    xl: { icon: 56, text: 'text-3xl', gap: 'gap-3' },
  };
  
  const { icon, text, gap } = sizes[size];
  
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* S-shaped blocks pattern */}
        <rect x="4" y="4" width="18" height="18" rx="4" fill={COLORS.secondary} />
        <rect x="26" y="4" width="18" height="18" rx="4" fill={COLORS.primary} />
        <rect x="4" y="26" width="18" height="18" rx="4" fill={COLORS.primary} />
        <rect x="26" y="26" width="18" height="18" rx="4" fill={COLORS.secondary} />
      </svg>
      
      {showText && (
        <span className={`font-bold ${text} text-slate-900 tracking-tight`}>
          <span className="text-[#3d5a80]">Scope</span>
          <span className="text-[#f5a623]">Gen</span>
        </span>
      )}
    </div>
  );
}

/**
 * ScopeGen Logo - Option 4: Modern SG Monogram
 * Clean, professional monogram design
 */
export function LogoMonogram({ 
  size = 'md', 
  className = '',
  showText = true 
}: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 32, text: 'text-xl', gap: 'gap-2' },
    lg: { icon: 40, text: 'text-2xl', gap: 'gap-2.5' },
    xl: { icon: 56, text: 'text-3xl', gap: 'gap-3' },
  };
  
  const { icon, text, gap } = sizes[size];
  
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect x="2" y="2" width="44" height="44" rx="10" fill={COLORS.primary} />
        
        {/* S letter */}
        <path 
          d="M16 16C16 14 18 12 22 12C26 12 28 14 28 16C28 19 25 20 22 21C19 22 16 23 16 26C16 29 18 32 22 32"
          stroke={COLORS.secondary}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* G letter */}
        <path 
          d="M38 20C36 14 32 12 28 14C24 16 24 20 24 24C24 28 26 32 30 32C34 32 36 30 38 28V24H32"
          stroke={COLORS.white}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      
      {showText && (
        <span className={`font-bold ${text} text-slate-900 tracking-tight`}>
          <span className="text-[#3d5a80]">Scope</span>
          <span className="text-[#f5a623]">Gen</span>
        </span>
      )}
    </div>
  );
}

/**
 * ScopeGen Logo - Option 5: Lightning/Speed Design
 * Represents fast proposal generation with a lightning bolt
 */
export function LogoLightning({ 
  size = 'md', 
  className = '',
  showText = true 
}: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 32, text: 'text-xl', gap: 'gap-2' },
    lg: { icon: 40, text: 'text-2xl', gap: 'gap-2.5' },
    xl: { icon: 56, text: 'text-3xl', gap: 'gap-3' },
  };
  
  const { icon, text, gap } = sizes[size];
  
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rounded square background */}
        <rect x="4" y="4" width="40" height="40" rx="8" fill={COLORS.primary} />
        
        {/* Lightning bolt */}
        <path 
          d="M26 6L14 26H22L18 42L34 20H26L26 6Z" 
          fill={COLORS.secondary}
        />
      </svg>
      
      {showText && (
        <span className={`font-bold ${text} text-slate-900 tracking-tight`}>
          <span className="text-[#3d5a80]">Scope</span>
          <span className="text-[#f5a623]">Gen</span>
        </span>
      )}
    </div>
  );
}

/**
 * ScopeGen Logo - Option 6: Hammer & Document Combo
 * Combines construction tool with document (current theme evolution)
 */
export function LogoHammerDoc({ 
  size = 'md', 
  className = '',
  showText = true 
}: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 32, text: 'text-xl', gap: 'gap-2' },
    lg: { icon: 40, text: 'text-2xl', gap: 'gap-2.5' },
    xl: { icon: 56, text: 'text-3xl', gap: 'gap-3' },
  };
  
  const { icon, text, gap } = sizes[size];
  
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect x="4" y="4" width="40" height="40" rx="8" fill={COLORS.primary} />
        
        {/* Document shape */}
        <rect x="12" y="10" width="18" height="28" rx="2" fill={COLORS.white} opacity="0.9" />
        
        {/* Hammer overlay */}
        <path 
          d="M32 14L40 22L36 26L28 18L32 14Z" 
          fill={COLORS.secondary}
        />
        <rect 
          x="24" y="22" 
          width="4" height="16" 
          rx="1" 
          fill={COLORS.secondary}
          transform="rotate(-45 24 22)"
        />
        
        {/* Document lines */}
        <rect x="15" y="16" width="12" height="2" rx="1" fill={COLORS.primary} opacity="0.3" />
        <rect x="15" y="21" width="10" height="2" rx="1" fill={COLORS.primary} opacity="0.3" />
        <rect x="15" y="26" width="8" height="2" rx="1" fill={COLORS.primary} opacity="0.3" />
      </svg>
      
      {showText && (
        <span className={`font-bold ${text} text-slate-900 tracking-tight`}>
          <span className="text-[#3d5a80]">Scope</span>
          <span className="text-[#f5a623]">Gen</span>
        </span>
      )}
    </div>
  );
}

/**
 * Default export - The recommended logo
 */
export default function Logo(props: LogoProps) {
  return <LogoScopeTarget {...props} />;
}

/**
 * Icon-only versions for favicons
 */
export function LogoIcon({ variant = 'scope' }: { variant?: 'scope' | 'blocks' | 'lightning' }) {
  if (variant === 'blocks') {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="18" height="18" rx="4" fill={COLORS.secondary} />
        <rect x="26" y="4" width="18" height="18" rx="4" fill={COLORS.primary} />
        <rect x="4" y="26" width="18" height="18" rx="4" fill={COLORS.primary} />
        <rect x="26" y="26" width="18" height="18" rx="4" fill={COLORS.secondary} />
      </svg>
    );
  }
  
  if (variant === 'lightning') {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="40" height="40" rx="8" fill={COLORS.primary} />
        <path d="M26 6L14 26H22L18 42L34 20H26L26 6Z" fill={COLORS.secondary} />
      </svg>
    );
  }
  
  // Default: scope target
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="40" height="40" rx="8" fill={COLORS.primary} />
      <circle cx="24" cy="24" r="12" stroke={COLORS.secondary} strokeWidth="3" fill="none" />
      <line x1="24" y1="8" x2="24" y2="16" stroke={COLORS.secondary} strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="32" x2="24" y2="40" stroke={COLORS.secondary} strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="24" x2="16" y2="24" stroke={COLORS.secondary} strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="24" x2="40" y2="24" stroke={COLORS.secondary} strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill={COLORS.secondary} />
    </svg>
  );
}
