'use client';

import { useState } from 'react';
import Image from 'next/image';
import HoverImagePreview from './HoverImagePreview';

interface MotorizationOption {
    id: string;
    name: string;
    description?: string;
    price?: number;
    image?: string;
}

interface MotorizationSelectorProps {
    options: MotorizationOption[];
    selectedOption: string | null;
    onOptionChange: (optionId: string) => void;
    heading?: string;
    basePriceLabel?: string | null;
}

const MotorizationSelector = ({
    options,
    selectedOption,
    onOptionChange,
    heading = 'Motorization',
    basePriceLabel = '+£95.00 (Motor)',
}: MotorizationSelectorProps) => {
    const [hoveredOption, setHoveredOption] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1f2a44]">{heading}</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {options.map((option) => (
                    <div
                        key={option.id}
                        className="relative"
                        onMouseEnter={() => setHoveredOption(option.id)}
                        onMouseLeave={() => setHoveredOption(null)}
                    >
                        <button
                            type="button"
                            onClick={() => onOptionChange(option.id)}
                            className={`relative h-full w-full border rounded-[12px] p-4 transition-all hover:border-[#b8c7df] text-center ${selectedOption === option.id
                                ? 'border-[#335c99] bg-[#eef2f8]'
                                : 'border-[#cbd6e6] bg-white'
                                }`}
                        >
                            {option.image && (
                                <div className="relative h-[100px] w-full mb-3 bg-[#e7eef8] rounded overflow-hidden flex items-center justify-center">
                                    <Image
                                        src={option.image}
                                        alt={option.name}
                                        width={100}
                                        height={100}
                                        className="object-contain"
                                    />
                                </div>
                            )}

                            <p className="text-sm font-medium text-[#1f2a44] mb-1">
                                {option.name}
                            </p>

                            {option.description && (
                                <p className="text-xs text-[#67748a] mb-2">
                                    {option.description}
                                </p>
                            )}

                            {option.id !== 'none' ? (
                                <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1 pointer-events-none">
                                    {basePriceLabel && (
                                        <span className="bg-[#335c99] text-white text-[10px] md:text-xs px-2 py-1 rounded font-medium shadow-sm whitespace-nowrap">
                                            {basePriceLabel}
                                        </span>
                                    )}
                                    {option.price != null && option.price > 0 && (
                                        <span className="bg-[#335c99]/90 text-white text-[10px] md:text-xs px-2 py-1 rounded font-medium shadow-sm whitespace-nowrap">
                                            +£{option.price.toFixed(2)} (Remote)
                                        </span>
                                    )}
                                </div>
                            ) : (
                                option.price != null && option.price > 0 && (
                                    <span className="absolute top-2 right-2 z-20 bg-[#335c99] text-white text-xs px-2 py-1 rounded font-medium shadow-sm pointer-events-none">
                                        +£{option.price.toFixed(2)}
                                    </span>
                                )
                            )}

                            {selectedOption === option.id && (
                                <div className="absolute top-2 left-2 w-5 h-5 bg-[#335c99] rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {hoveredOption === option.id && option.image && (
                            <HoverImagePreview image={option.image} name={option.name} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MotorizationSelector;
