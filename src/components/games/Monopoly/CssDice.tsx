import React from 'react';

interface CssDiceProps {
  value: number | null;
  isRolling: boolean;
}

/**
 * A single premium CSS die with proper pip layout, heavy shadow, and roll animation.
 */
export function CssDice({ value, isRolling }: CssDiceProps) {
  const face = value ?? 1;

  // Pip positions for each face value (3×3 grid: tl, tc, tr, ml, mc, mr, bl, bc, br)
  const pipLayouts: Record<number, boolean[]> = {
    1: [false, false, false, false, true,  false, false, false, false],
    2: [false, false, true,  false, false, false, true,  false, false],
    3: [false, false, true,  false, true,  false, true,  false, false],
    4: [true,  false, true,  false, false, false, true,  false, true ],
    5: [true,  false, true,  false, true,  false, true,  false, true ],
    6: [true,  false, true,  true,  false, true,  true,  false, true ],
  };

  const pips = pipLayouts[face] || pipLayouts[1];

  return (
    <div
      className={`
        w-16 h-16 bg-white rounded-xl border border-gray-200
        grid grid-cols-3 grid-rows-3 p-2 gap-0.5
        select-none
        ${isRolling ? 'animate-spin' : ''}
      `}
      style={{
        boxShadow: '0 6px 20px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
      }}
    >
      {pips.map((show, i) => (
        <div key={i} className="flex items-center justify-center">
          {show && (
            <div
              className="w-2.5 h-2.5 rounded-full bg-gray-900"
              style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
