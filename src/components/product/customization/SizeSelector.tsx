'use client';

import { useEffect, useMemo, useState } from 'react';

type SizeUnit = 'cm' | 'mm';

interface SizeSelectorProps {
  width: number;
  widthFraction: string;
  height: number;
  heightFraction: string;
  unit: SizeUnit;
  onWidthChange: (value: number) => void;
  onWidthFractionChange: (value: string) => void;
  onHeightChange: (value: number) => void;
  onHeightFractionChange: (value: string) => void;
  onUnitChange: (unit: SizeUnit) => void;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  showWidth?: boolean;
}

// Sub-unit precision under Centimeters — millimeters, 0-9. Millimeters mode has no
// sub-unit of its own; the whole size is entered directly in mm.
const millimeters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function parseFractionValue(value: string, unit: SizeUnit) {
  if (unit !== 'cm' || !value || value === '0') return 0;
  return (parseInt(value, 10) || 0) / 10;
}

function parseWholeInput(inputValue: string, fallbackValue: number) {
  const parsed = Number.parseFloat(inputValue);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

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
  showWidth = true,
}: SizeSelectorProps) => {
  const [widthInput, setWidthInput] = useState(width > 0 ? String(width) : '');
  const [heightInput, setHeightInput] = useState(height > 0 ? String(height) : '');

  // minWidth/maxWidth/minHeight/maxHeight arrive in inches from the price band
  // matrix regardless of the selected display unit.
  const widthLimits = useMemo(() => {
    const factor = unit === 'mm' ? 25.4 : 2.54;
    const fallbackMin = unit === 'mm' ? 500 : 50;
    const fallbackMax = unit === 'mm' ? 4000 : 400;
    const min = minWidth ? Math.round(minWidth * factor) : fallbackMin;
    const max = maxWidth ? Math.round(maxWidth * factor) : fallbackMax;
    return { min, max, placeholder: `${min}-${max}` };
  }, [unit, minWidth, maxWidth]);

  const heightLimits = useMemo(() => {
    const factor = unit === 'mm' ? 25.4 : 2.54;
    const fallbackMin = unit === 'mm' ? 500 : 50;
    const fallbackMax = unit === 'mm' ? 3000 : 300;
    const min = minHeight ? Math.round(minHeight * factor) : fallbackMin;
    const max = maxHeight ? Math.round(maxHeight * factor) : fallbackMax;
    return { min, max, placeholder: `${min}-${max}` };
  }, [unit, minHeight, maxHeight]);

  const clampWholeValue = (value: number, min: number, max: number) => {
    if (!Number.isFinite(value) || value <= 0) return value;
    return Math.min(Math.max(value, min), max);
  };

  useEffect(() => {
    setWidthInput(width > 0 ? String(width) : '');
  }, [width]);

  useEffect(() => {
    setHeightInput(height > 0 ? String(height) : '');
  }, [height]);

  const normalizeMeasurement = (
    wholeValue: number,
    fractionValue: string,
    min: number,
    max: number
  ) => {
    if (!Number.isFinite(wholeValue) || wholeValue <= 0) {
      return {
        whole: wholeValue,
        fraction: fractionValue,
      };
    }

    let normalizedWhole = clampWholeValue(wholeValue, min, max);
    let normalizedFraction = fractionValue;
    const totalValue = normalizedWhole + parseFractionValue(normalizedFraction, unit);

    if (totalValue > max) {
      normalizedWhole = clampWholeValue(normalizedWhole, min, max);
      normalizedFraction = '0';
    } else if (totalValue < min) {
      normalizedWhole = min;
      normalizedFraction = '0';
    }

    return {
      whole: normalizedWhole,
      fraction: normalizedFraction,
    };
  };

  const commitWidthValue = (rawValue: string, fractionValue: string = widthFraction) => {
    if (rawValue === '') {
      onWidthChange(0);
      setWidthInput('');
      return;
    }

    const wholeValue = parseWholeInput(rawValue, width);
    const normalized = normalizeMeasurement(wholeValue, fractionValue, widthLimits.min, widthLimits.max);

    onWidthChange(normalized.whole);
    if (normalized.fraction !== widthFraction) {
      onWidthFractionChange(normalized.fraction);
    }
    setWidthInput(normalized.whole > 0 ? String(normalized.whole) : '');
  };

  const commitHeightValue = (rawValue: string, fractionValue: string = heightFraction) => {
    if (rawValue === '') {
      onHeightChange(0);
      setHeightInput('');
      return;
    }

    const wholeValue = parseWholeInput(rawValue, height);
    const normalized = normalizeMeasurement(wholeValue, fractionValue, heightLimits.min, heightLimits.max);

    onHeightChange(normalized.whole);
    if (normalized.fraction !== heightFraction) {
      onHeightFractionChange(normalized.fraction);
    }
    setHeightInput(normalized.whole > 0 ? String(normalized.whole) : '');
  };

  const unitLabel = unit === 'mm' ? 'Millimeters' : 'Centimeters';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-[#1f2a44]">Choose Your Size</h3>

        <div className="flex bg-[#d9dfeb] p-1 rounded-[12px]">
          <button
            onClick={() => onUnitChange('cm')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              unit === 'cm' ? 'bg-white text-[#335c99] shadow-sm' : 'text-[#67748a] hover:text-[#596783]'
            }`}
          >
            Centimeters
          </button>
          <button
            onClick={() => onUnitChange('mm')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              unit === 'mm' ? 'bg-white text-[#335c99] shadow-sm' : 'text-[#67748a] hover:text-[#596783]'
            }`}
          >
            Millimeters
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {showWidth && (
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
                  <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">{unitLabel}</div>
                  <input
                    type="number"
                    step="1"
                    min={widthLimits.min}
                    max={widthLimits.max}
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                    onBlur={(e) => commitWidthValue(e.target.value)}
                    className="text-base font-medium text-[#1f2a44] bg-transparent border-none p-0 w-full focus:outline-none"
                    placeholder={widthLimits.placeholder}
                  />
                </div>
              </div>
              {unit === 'cm' && (
                <div className="flex-1">
                  <div className="border border-[#c4d0e4] rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(31,42,68,0.06)]">
                    <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">Millimeters</div>
                    <select
                      value={widthFraction}
                      onChange={(e) => {
                        const nextFraction = e.target.value;
                        onWidthFractionChange(nextFraction);
                        if (showWidth) {
                          commitWidthValue(widthInput, nextFraction);
                        }
                      }}
                      className="text-base font-medium text-[#1f2a44] bg-transparent border-none p-0 appearance-none cursor-pointer focus:outline-none w-full"
                    >
                      {millimeters.map((millimeter) => (
                        <option key={millimeter} value={millimeter}>{millimeter} mm</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">{unitLabel}</div>
                <input
                  type="number"
                  step="1"
                  min={heightLimits.min}
                  max={heightLimits.max}
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  onBlur={(e) => commitHeightValue(e.target.value)}
                  className="text-base font-medium text-[#1f2a44] bg-transparent border-none p-0 w-full focus:outline-none"
                  placeholder={heightLimits.placeholder}
                />
              </div>
            </div>
            {unit === 'cm' && (
              <div className="flex-1">
                <div className="border border-[#c4d0e4] rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(31,42,68,0.06)]">
                  <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">Millimeters</div>
                  <select
                    value={heightFraction}
                    onChange={(e) => {
                      const nextFraction = e.target.value;
                      onHeightFractionChange(nextFraction);
                      commitHeightValue(heightInput, nextFraction);
                    }}
                    className="text-base font-medium text-[#1f2a44] bg-transparent border-none p-0 appearance-none cursor-pointer focus:outline-none w-full"
                  >
                    {millimeters.map((millimeter) => (
                      <option key={millimeter} value={millimeter}>{millimeter} mm</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-[#67748a]">
        Allowed range:
        {showWidth ? ` Width ${widthLimits.min}-${widthLimits.max} ${unit} ` : ' '}
        Height {heightLimits.min}-{heightLimits.max} {unit}
      </p>
    </div>
  );
};

export default SizeSelector;
