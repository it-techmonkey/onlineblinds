'use client';

import { useState } from 'react';
import Image from 'next/image';
import HoverImagePreview from './HoverImagePreview';

interface InstallationMethodOption {
    id: string;
    name: string;
    description: string;
    price?: number;
    image?: string;
}

interface InstallationMethodSelectorProps {
    options: InstallationMethodOption[];
    selectedMethod: string | null;
    onMethodChange: (methodId: string) => void;
}

const InstallationMethodSelector = ({ options, selectedMethod, onMethodChange }: InstallationMethodSelectorProps) => {
    const [hoveredOption, setHoveredOption] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1f2a44]">Installation Method</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {options.map((option) => (
                    <div
                        key={option.id}
                        className="relative"
                        onMouseEnter={() => setHoveredOption(option.id)}
                        onMouseLeave={() => setHoveredOption(null)}
                    >
                        <button
                            type="button"
                            onClick={() => onMethodChange(option.id)}
                            className={`relative flex h-full w-full flex-col border rounded-[12px] p-4 transition-all hover:border-[#b8c7df] text-left ${selectedMethod === option.id
                                    ? 'border-[#335c99] bg-[#eef2f8]'
                                    : 'border-[#d9dfeb] bg-white'
                                }`}
                        >
                            {option.image && (
                                <div className="relative h-[120px] w-full mb-3 bg-[#eef2f8] rounded overflow-hidden flex items-center justify-center">
                                    <Image
                                        src={option.image}
                                        alt={option.name}
                                        width={120}
                                        height={120}
                                        className="object-contain"
                                    />
                                </div>
                            )}

                            <p className="text-base font-medium text-[#1f2a44] mb-1">
                                {option.name}
                            </p>

                            {option.description && (
                                <p className="text-sm text-[#67748a]">
                                    {option.description}
                                </p>
                            )}

                            {option.price != null && option.price > 0 && (
                                <span className="absolute top-2 right-2 bg-[#335c99] text-white text-xs px-2 py-1 rounded">
                                    +£{option.price.toFixed(2)}
                                </span>
                            )}

                            {selectedMethod === option.id && (
                                <div className="absolute top-2 left-2 w-5 h-5 bg-[#335c99] rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {hoveredOption === option.id && option.image && (
                            <HoverImagePreview
                                image={option.image}
                                name={option.name}
                                imageClassName="relative w-[260px] aspect-[4/3] rounded-md overflow-hidden bg-[#eef2f8]"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InstallationMethodSelector;
