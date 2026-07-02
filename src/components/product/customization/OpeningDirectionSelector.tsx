'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PortalImageModal } from './PortalImageModal';

interface OpeningDirectionOption {
    id: string;
    name: string;
    description?: string;
    price?: number;
    image?: string;
}

interface OpeningDirectionSelectorProps {
    options: OpeningDirectionOption[];
    selectedDirection: string | null;
    onDirectionChange: (directionId: string) => void;
}

const DIRECTION_ARROWS: Record<string, 'left' | 'right' | 'down' | 'split'> = {
    'left-to-right': 'right',
    'right-to-left': 'left',
    'top-down': 'down',
    split: 'split',
};

const DirectionGraphic = ({ directionId }: { directionId: string }) => {
    const arrow = DIRECTION_ARROWS[directionId];

    const Arrow = ({ dir }: { dir: 'left' | 'right' | 'down' }) => (
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#1f2a44]" fill="none" stroke="currentColor" strokeWidth={2}>
            {dir === 'right' && <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />}
            {dir === 'left' && <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l6-6m-6 6l6 6" />}
            {dir === 'down' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-6-6m6 6l6-6" />}
        </svg>
    );

    if (arrow === 'split') {
        return (
            <div className="relative flex h-full w-full items-stretch overflow-hidden rounded border border-[#cbd6e6] bg-white">
                <div className="flex flex-1 items-center justify-center bg-[#1f2a44]/90">
                    <Arrow dir="left" />
                </div>
                <div className="w-2 bg-[#f4f1e8]" />
                <div className="flex flex-1 items-center justify-center bg-[#1f2a44]/90">
                    <Arrow dir="right" />
                </div>
            </div>
        );
    }

    if (arrow === 'down') {
        return (
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded border border-[#cbd6e6] bg-white">
                <div className="flex-2 bg-[#1f2a44]/90" />
                <div className="flex flex-1 items-center justify-center bg-[#f4f1e8]">
                    <Arrow dir="down" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full w-full overflow-hidden rounded border border-[#cbd6e6] bg-white">
            <div className={`flex-1 ${arrow === 'right' ? 'bg-[#1f2a44]/90' : 'bg-[#f4f1e8]'}`} />
            <div className={`flex flex-1 items-center justify-center ${arrow === 'right' ? 'bg-[#f4f1e8]' : 'bg-[#1f2a44]/90'}`}>
                <Arrow dir={arrow === 'right' ? 'right' : 'left'} />
            </div>
        </div>
    );
};

const OpeningDirectionSelector = ({ options, selectedDirection, onDirectionChange }: OpeningDirectionSelectorProps) => {
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1f2a44]">Opening Direction</h3>
                <button
                    type="button"
                    onClick={() => setIsGuideOpen(true)}
                    aria-label="What is opening direction?"
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-[#8a97ad] text-[11px] font-semibold text-[#5c6b85] transition-colors hover:border-[#335c99] hover:text-[#335c99]"
                >
                    ?
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {options.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onDirectionChange(option.id)}
                        className={`relative flex h-full w-full flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all hover:border-[#b8c7df] ${selectedDirection === option.id
                                ? 'border-[#335c99] bg-[#eef2f8]'
                                : 'border-[#cbd6e6] bg-white'
                            }`}
                    >
                        {option.price != null && option.price > 0 && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2f7a4f] px-3 py-1 text-xs font-medium text-white">
                                {option.name} (+£{option.price.toFixed(2)})
                            </span>
                        )}
                        {(option.price == null || option.price === 0) && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2f7a4f] px-3 py-1 text-xs font-medium text-white">
                                {option.name}
                            </span>
                        )}

                        <div className="mt-2 h-20 w-full">
                            <DirectionGraphic directionId={option.id} />
                        </div>

                        {option.description && (
                            <p className="text-xs text-[#5c6b85]">{option.description}</p>
                        )}

                        {selectedDirection === option.id && (
                            <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#335c99]">
                                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <PortalImageModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)}>
                <div className="mx-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#e5e9f0] px-6 py-4">
                        <h2 className="text-xl font-semibold text-[#1f2a44]">Opening Direction Options</h2>
                        <button
                            type="button"
                            onClick={() => setIsGuideOpen(false)}
                            aria-label="Close"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cbd6e6] text-[#1f2a44] transition-colors hover:bg-[#eef2f8]"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="relative w-full overflow-hidden rounded-xl bg-[#f7f8fb]">
                            <Image
                                src="/products/openingDirGuide.webp"
                                alt="Opening Direction Options guide"
                                width={1200}
                                height={800}
                                className="h-auto w-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            </PortalImageModal>
        </div>
    );
};

export default OpeningDirectionSelector;
