'use client';

import { useMemo } from 'react';

interface SizeSelectorProps {
  width: number;
  widthFraction: string;
  height: number;
  heightFraction: string;
  unit: 'inches' | 'cm';
  onWidthChange: (value: number) => void;
  onWidthFractionChange: (value: string) => void;
  onHeightChange: (value: number) => void;
  onHeightFractionChange: (value: string) => void;
  onUnitChange: (unit: 'inches' | 'cm') => void;
  // Optional: Dynamic size ranges from price band
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

const fractions = ['0', '1/16', '1/8', '3/16', '1/4', '5/16', '3/8', '7/16', '1/2', '9/16', '5/8', '11/16', '3/4', '13/16', '7/8', '15/16'];
const millimeters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const SizeSelector = ({
  width,
  widthFraction,
  height,
  heightFraction,
  unit,
  onWidthChange,
  onWidthFractionChange,
  onHeightChange,
  onHeightFractionChange,
  onUnitChange,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
}: SizeSelectorProps) => {
  const handleWidthChange = (value: string) => {
    if (value === '') {
      onWidthChange(0);
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) onWidthChange(numValue);
  };

  const handleHeightChange = (value: string) => {
    if (value === '') {
      onHeightChange(0);
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) onHeightChange(numValue);
  };

  // Calculate limits with useMemo to ensure they update when props change
  const widthLimits = useMemo(() => {
    if (unit === 'inches') {
      const min = minWidth ?? 20;
      const max = maxWidth ?? 157;
      const placeholder = `${min}-${max}`;
      // Debug log (remove in production)
      if (process.env.NODE_ENV === 'development' && (minWidth !== undefined || maxWidth !== undefined)) {
        console.log('SizeSelector - Width limits (inches):', { min, max, placeholder, minWidth, maxWidth });
      }
      return { min, max, placeholder };
    } else {
      // cm - convert from inches if provided, otherwise use defaults
      const min = minWidth ? Math.round(minWidth * 2.54) : 50;
      const max = maxWidth ? Math.round(maxWidth * 2.54) : 400;
      return { min, max, placeholder: `${min}-${max}` };
    }
  }, [unit, minWidth, maxWidth]);

  const heightLimits = useMemo(() => {
    if (unit === 'inches') {
      const min = minHeight ?? 20;
      const max = maxHeight ?? 118;
      const placeholder = `${min}-${max}`;
      // Debug log (remove in production)
      if (process.env.NODE_ENV === 'development' && (minHeight !== undefined || maxHeight !== undefined)) {
        console.log('SizeSelector - Height limits (inches):', { min, max, placeholder, minHeight, maxHeight });
      }
      return { min, max, placeholder };
    } else {
      // cm - convert from inches if provided, otherwise use defaults
      const min = minHeight ? Math.round(minHeight * 2.54) : 50;
      const max = maxHeight ? Math.round(maxHeight * 2.54) : 300;
      return { min, max, placeholder: `${min}-${max}` };
    }
  }, [unit, minHeight, maxHeight]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-[#1f2a44]">Choose Your Size</h3>

        {/* Unit Toggle */}
        <div className="flex bg-[#d9dfeb] p-1 rounded-[12px]">
          <button
            onClick={() => onUnitChange('inches')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${unit === 'inches' ? 'bg-white text-[#335c99] shadow-sm' : 'text-[#67748a] hover:text-[#596783]'
              }`}
          >
            Inches
          </button>
          <button
            onClick={() => onUnitChange('cm')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${unit === 'cm' ? 'bg-white text-[#335c99] shadow-sm' : 'text-[#67748a] hover:text-[#596783]'
              }`}
          >
            Centimeters
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Width */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 w-24">
            <span className="text-sm font-medium text-[#1f2a44]">Width</span>
            <svg className="w-5 h-5 text-[#9aaea7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <div className="border border-[#c4d0e4] rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(31,42,68,0.06)]">
                <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Inches' : 'Centimeters'}
                </div>
                <input
                  type="number"
                  step="1"
                  min={widthLimits.min}
                  max={widthLimits.max}
                  value={width > 0 ? width : ''}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="text-base font-medium text-[#1f2a44] bg-transparent border-none p-0 w-full focus:outline-none"
                  placeholder={widthLimits.placeholder}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="border border-[#c4d0e4] rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(31,42,68,0.06)]">
                <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Sixteenths' : 'Millimeters'}
                </div>
                <select
                  value={widthFraction}
                  onChange={(e) => onWidthFractionChange(e.target.value)}
                  className="text-base font-medium text-[#1f2a44] bg-transparent border-none p-0 appearance-none cursor-pointer focus:outline-none w-full"
                >
                  {unit === 'inches'
                    ? fractions.map((f) => <option key={f} value={f}>{f}</option>)
                    : millimeters.map((m) => <option key={m} value={m}>{m} mm</option>)
                  }
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Height */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 w-24">
            <span className="text-sm font-medium text-[#1f2a44]">Height</span>
            <svg className="w-5 h-5 text-[#9aaea7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <div className="border border-[#c4d0e4] rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(31,42,68,0.06)]">
                <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Inches' : 'Centimeters'}
                </div>
                <input
                  type="number"
                  step="1"
                  min={heightLimits.min}
                  max={heightLimits.max}
                  value={height > 0 ? height : ''}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="text-base font-medium text-[#1f2a44] bg-transparent border-none p-0 w-full focus:outline-none"
                  placeholder={heightLimits.placeholder}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="border border-[#c4d0e4] rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(31,42,68,0.06)]">
                <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Sixteenths' : 'Millimeters'}
                </div>
                <select
                  value={heightFraction}
                  onChange={(e) => onHeightFractionChange(e.target.value)}
                  className="text-base font-medium text-[#1f2a44] bg-transparent border-none p-0 appearance-none cursor-pointer focus:outline-none w-full"
                >
                  {unit === 'inches'
                    ? fractions.map((f) => <option key={f} value={f}>{f}</option>)
                    : millimeters.map((m) => <option key={m} value={m}>{m} mm</option>)
                  }
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeSelector;

