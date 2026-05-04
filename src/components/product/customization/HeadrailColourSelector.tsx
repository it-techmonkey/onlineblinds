'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PriceOption } from '@/types';
import { PortalDropdownMenu } from './PortalDropdownMenu';
import PortalHoverImagePreview from './PortalHoverImagePreview';

interface HeadrailColourSelectorProps {
    options: PriceOption[];
    selectedColour: string | null;
    onColourChange: (colourId: string) => void;
}

const HeadrailColourSelector = ({ options, selectedColour, onColourChange }: HeadrailColourSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredPreview, setHoveredPreview] = useState<{ name: string; image: string; anchorRect: { top: number; left: number; right: number; bottom: number; width: number; height: number } } | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen || !buttonRef.current) return;

        const updateMenuPosition = () => {
            if (buttonRef.current) {
                const buttonRect = buttonRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: buttonRect.bottom + 8,
                    left: buttonRect.left,
                    width: buttonRect.width,
                });
            }
        };

        updateMenuPosition();
        window.addEventListener('scroll', updateMenuPosition, true);
        window.addEventListener('resize', updateMenuPosition);

        return () => {
            window.removeEventListener('scroll', updateMenuPosition, true);
            window.removeEventListener('resize', updateMenuPosition);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const selectedOption = options.find((opt) => opt.id === selectedColour);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1f2a44]">Headrail Colour</h3>
            </div>

            {/* Custom Dropdown */}
            <div className="relative">
                {/* Dropdown Trigger */}
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    className={`w-full px-4 py-3 pr-10 border rounded-xl text-left cursor-pointer transition-colors bg-white ${isOpen ? 'border-[#335c99]' : 'border-[#cbd6e6]'
                        } hover:border-[#b8c7df] focus:border-[#335c99] focus:outline-none`}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    {selectedOption ? (
                        <div className="flex items-center gap-3">
                            {/* Selected Option Image */}
                            {selectedOption.image && (
                                <div className="relative h-8 w-8 bg-[#e7eef8] rounded border border-[#d9dfeb] shrink-0">
                                    <Image
                                        src={selectedOption.image}
                                        alt={selectedOption.name}
                                        fill
                                        className="object-contain p-0.5"
                                    />
                                </div>
                            )}
                            {/* Selected Option Text */}
                            <span className="text-sm text-[#1f2a44]">
                                {selectedOption.name}
                                {selectedOption.price != null && selectedOption.price > 0 && (
                                    <span className="text-[#335c99] font-medium ml-2">
                                        (+ £{selectedOption.price.toFixed(2)})
                                    </span>
                                )}
                            </span>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-400">Select a headrail colour</span>
                    )}
                </button>

                {/* Dropdown Arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            <PortalDropdownMenu
                isOpen={isOpen}
                menuPosition={menuPosition}
                onClose={() => setIsOpen(false)}
            >
                {options.map((option) => (
                    <div
                        key={option.id}
                        className={`w-full px-4 py-3 flex items-center gap-3 border-b border-[#e3e8f1] last:border-0 transition-colors ${selectedColour === option.id ? 'bg-[#eef2f8]' : 'hover:bg-[#e7eef8]'}`}
                        onMouseEnter={(event) => option.image && setHoveredPreview({ name: option.name, image: option.image, anchorRect: event.currentTarget.getBoundingClientRect() })}
                        onMouseLeave={() => setHoveredPreview(null)}
                    >
                        {option.image && (
                            <div
                                className="relative h-10 w-10 bg-[#e7eef8] rounded border border-[#d9dfeb] shrink-0"
                                aria-hidden="true"
                            >
                                <Image
                                    src={option.image}
                                    alt={option.name}
                                    fill
                                    className="object-contain p-1"
                                />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                onColourChange(option.id);
                                setIsOpen(false);
                            }}
                            className="grow min-w-0 text-left"
                        >
                            <p className="text-sm font-medium text-[#1f2a44]">{option.name}</p>
                            {option.price != null && option.price > 0 && (
                                <p className="text-xs text-[#335c99] font-semibold mt-0.5">
                                    + £{option.price.toFixed(2)}
                                </p>
                            )}
                        </button>

                        {selectedColour === option.id && (
                            <div className="w-5 h-5 bg-[#335c99] rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}

                    </div>
                ))}
            </PortalDropdownMenu>
            <PortalHoverImagePreview preview={hoveredPreview} />
        </div>
    );
};

export default HeadrailColourSelector;
