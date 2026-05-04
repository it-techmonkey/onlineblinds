'use client';

import { useEffect, useMemo, useState } from 'react';

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
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  showWidth?: boolean;
}

const fractions = ['0', '1/16', '1/8', '3/16', '1/4', '5/16', '3/8', '7/16', '1/2', '9/16', '5/8', '11/16', '3/4', '13/16', '7/8', '15/16'];
const millimeters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function parseFractionValue(value: string, unit: 'inches' | 'cm') {
  if (!value || value === '0') return 0;

  if (unit === 'cm') {
    return (parseInt(value, 10) || 0) / 10;
  }

  const [numerator, denominator] = value.split('/').map(Number);
  if (!numerator || !denominator) return 0;
  return numerator / denominator;
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

  const widthLimits = useMemo(() => {
    if (unit === 'inches') {
      return {
        min: minWidth ?? 20,
        max: maxWidth ?? 157,
        placeholder: `${minWidth ?? 20}-${maxWidth ?? 157}`,
      };
    }

    const min = minWidth ? Math.round(minWidth * 2.54) : 50;
    const max = maxWidth ? Math.round(maxWidth * 2.54) : 400;
    return { min, max, placeholder: `${min}-${max}` };
  }, [unit, minWidth, maxWidth]);

  const heightLimits = useMemo(() => {
    if (unit === 'inches') {
      return {
        min: minHeight ?? 20,
        max: maxHeight ?? 118,
        placeholder: `${minHeight ?? 20}-${maxHeight ?? 118}`,
      };
    }

    const min = minHeight ? Math.round(minHeight * 2.54) : 50;
    const max = maxHeight ? Math.round(maxHeight * 2.54) : 300;
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-[#1f2a44]">Choose Your Size</h3>

        <div className="flex bg-[#d9dfeb] p-1 rounded-[12px]">
          <button
            onClick={() => onUnitChange('inches')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              unit === 'inches' ? 'bg-white text-[#335c99] shadow-sm' : 'text-[#67748a] hover:text-[#596783]'
            }`}
          >
            Inches
          </button>
          <button
            onClick={() => onUnitChange('cm')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              unit === 'cm' ? 'bg-white text-[#335c99] shadow-sm' : 'text-[#67748a] hover:text-[#596783]'
            }`}
          >
            Centimeters
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
                  <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">
                    {unit === 'inches' ? 'Inches' : 'Centimeters'}
                  </div>
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
              <div className="flex-1">
                <div className="border border-[#c4d0e4] rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(31,42,68,0.06)]">
                  <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">
                    {unit === 'inches' ? 'Sixteenths' : 'Millimeters'}
                  </div>
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
                    {unit === 'inches'
                      ? fractions.map((fraction) => <option key={fraction} value={fraction}>{fraction}</option>)
                      : millimeters.map((millimeter) => <option key={millimeter} value={millimeter}>{millimeter} mm</option>)}
                  </select>
                </div>
              </div>
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
                <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Inches' : 'Centimeters'}
                </div>
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
            <div className="flex-1">
              <div className="border border-[#c4d0e4] rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(31,42,68,0.06)]">
                <div className="text-[10px] text-[#8d9ab1] uppercase tracking-wide mb-0.5">
                  {unit === 'inches' ? 'Sixteenths' : 'Millimeters'}
                </div>
                <select
                  value={heightFraction}
                  onChange={(e) => {
                    const nextFraction = e.target.value;
                    onHeightFractionChange(nextFraction);
                    commitHeightValue(heightInput, nextFraction);
                  }}
                  className="text-base font-medium text-[#1f2a44] bg-transparent border-none p-0 appearance-none cursor-pointer focus:outline-none w-full"
                >
                  {unit === 'inches'
                    ? fractions.map((fraction) => <option key={fraction} value={fraction}>{fraction}</option>)
                    : millimeters.map((millimeter) => <option key={millimeter} value={millimeter}>{millimeter} mm</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#67748a]">
        Allowed range:
        {showWidth ? ` Width ${widthLimits.min}-${widthLimits.max} ${unit === 'inches' ? 'in' : 'cm'} ` : ' '}
        Height {heightLimits.min}-{heightLimits.max} {unit === 'inches' ? 'in' : 'cm'}
      </p>
    </div>
  );
};

export default SizeSelector;
