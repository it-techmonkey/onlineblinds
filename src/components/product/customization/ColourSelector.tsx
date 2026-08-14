'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProductColourVariant } from '@/types';
import HoverImagePreview from './HoverImagePreview';

interface ColourSelectorProps {
    variants: ProductColourVariant[];
    selectedColour: string | null;
    onColourChange: (colour: string) => void;
}

/**
 * Colour picker backed by real Shopify variants. Selecting a colour also moves the
 * product gallery to that variant's image — see the selectedImageIndex wiring in
 * ProductPage.
 */
const ColourSelector = ({ variants, selectedColour, onColourChange }: ColourSelectorProps) => {
    const [hoveredColour, setHoveredColour] = useState<string | null>(null);

    if (variants.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1f2a44]">Colour</h3>
                {selectedColour && (
                    <span className="text-sm text-[#4b5a73]">— {selectedColour}</span>
                )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {variants.map((variant) => (
                    <div
                        key={variant.id}
                        className="relative"
                        onMouseEnter={() => setHoveredColour(variant.colour)}
                        onMouseLeave={() => setHoveredColour(null)}
                    >
                        <button
                            type="button"
                            onClick={() => onColourChange(variant.colour)}
                            disabled={!variant.available}
                            aria-pressed={selectedColour === variant.colour}
                            className={`relative flex h-full w-full flex-col overflow-hidden rounded-[12px] border p-2 text-center transition-all hover:border-[#b8c7df] disabled:cursor-not-allowed disabled:opacity-40 ${selectedColour === variant.colour
                                ? 'border-[#335c99] bg-[#eef2f8]'
                                : 'border-[#cbd6e6] bg-white'
                                }`}
                        >
                            {variant.imageUrl && (
                                <div className="relative mb-2 h-16 w-full overflow-hidden rounded bg-[#e7eef8]">
                                    <Image
                                        src={variant.imageUrl}
                                        alt={variant.colour}
                                        fill
                                        sizes="(max-width: 768px) 33vw, 120px"
                                        className="object-cover"
                                    />
                                </div>
                            )}

                            <p className="text-xs font-medium leading-tight text-[#1f2a44]">
                                {variant.colour}
                            </p>

                            {selectedColour === variant.colour && (
                                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#335c99]">
                                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {hoveredColour === variant.colour && variant.imageUrl && (
                            <HoverImagePreview image={variant.imageUrl} name={variant.colour} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ColourSelector;
