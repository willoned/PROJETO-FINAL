import React, { useMemo } from 'react';
import { PartyEffect } from '../types';

interface Props {
  effect: PartyEffect;
}

const PartyOverlay: React.FC<Props> = ({ effect }) => {
  
  // Memoize particle generation to avoid re-calculating on every render
  const bubbles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    size: `${10 + Math.random() * 30}px`,
    opacity: 0.3 + Math.random() * 0.5
  })), []);

  const confetti = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${2 + Math.random() * 3}s`,
    animationDelay: `${Math.random() * 5}s`,
    bg: ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981'][Math.floor(Math.random() * 5)],
    size: `${8 + Math.random() * 8}px`
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      
      {/* 1. GLOW EFFECT (Standard) */}
      {effect === 'GLOW' && (
        <>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 mix-blend-overlay" />
            <div className="absolute inset-0 animate-party-glow opacity-30" />
        </>
      )}

      {/* 2. DISCO (Strobe) */}
      {effect === 'DISCO' && (
         <div className="absolute inset-0 animate-disco mix-blend-color-dodge pointer-events-none" />
      )}

      {/* 3. BUBBLES (Brewery Theme) */}
      {effect === 'BUBBLES' && (
        <div className="absolute inset-0">
             {/* Amber Tint for Beer Look */}
            <div className="absolute inset-0 bg-amber-600/10 mix-blend-overlay" />
            {bubbles.map(b => (
                <div 
                    key={b.id}
                    className="absolute bottom-0 rounded-full border border-amber-300/40 bg-amber-200/10 animate-rise"
                    style={{
                        left: b.left,
                        width: b.size,
                        height: b.size,
                        animationDelay: b.animationDelay,
                        opacity: b.opacity
                    }}
                />
            ))}
        </div>
      )}

      {/* 4. CONFETTI */}
      {effect === 'CONFETTI' && (
        <div className="absolute inset-0">
            {confetti.map(c => (
                <div 
                    key={c.id}
                    className="absolute -top-4 rounded-sm animate-fall"
                    style={{
                        left: c.left,
                        width: c.size,
                        height: c.size,
                        backgroundColor: c.bg,
                        animationDuration: c.animationDuration,
                        animationDelay: c.animationDelay
                    }}
                />
            ))}
        </div>
      )}

    </div>
  );
};

export default React.memo(PartyOverlay);