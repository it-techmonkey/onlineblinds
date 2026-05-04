'use client';

import { useState } from 'react';
import Image from 'next/image';
import HoverImagePreview from './HoverImagePreview';

interface ControlOption {
    id: string;
    name: string;
    description?: string;
    price?: number;
    image?: string;
}

interface ControlOptionSelectorProps {
    options: ControlOption[];
    selectedOption: string | null;
    onOptionChange: (optionId: string) => void;
    title?: string;
}

const ControlOptionSelector = ({
    options,
    selectedOption,
    onOptionChange,
    title = 'Control Option',
}: ControlOptionSelectorProps) => {
    const [hoveredOption, setHoveredOption] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1f2a44]">{title}</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
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
                            className={`relative h-full w-full border rounded-[12px] p-3 transition-all hover:border-[#b8c7df] text-center ${selectedOption === option.id
                                    ? 'border-[#335c99] bg-[#eef2f8]'
                                    : 'border-[#cbd6e6] bg-white'
                                }`}
                        >
                            {option.image && (
                                <div className="relative h-[70px] w-full mb-2 bg-[#e7eef8] rounded overflow-hidden flex items-center justify-center">
                                    <Image
                                        src={option.image}
                                        alt={option.name}
                                        width={70}
                                        height={70}
                                        className="object-contain"
                                    />
                                </div>
                            )}

                            <p className="text-sm font-medium text-[#1f2a44]">
                                {option.name}
                            </p>

                            {option.price != null && option.price > 0 && (
                                <span className="absolute top-2 right-2 bg-[#335c99] text-white text-xs px-2 py-1 rounded">
                                    +£{option.price.toFixed(2)}
                                </span>
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

export default ControlOptionSelector;
