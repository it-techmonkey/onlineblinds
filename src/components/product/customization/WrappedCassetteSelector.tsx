'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import PortalHoverImagePreview from './PortalHoverImagePreview';

interface WrappedCassetteOption {
    id: string;
    name: string;
    price?: number;
    image?: string;
}

interface WrappedCassetteSelectorProps {
    options: WrappedCassetteOption[];
    selectedOption: string | null;
    onOptionChange: (optionId: string) => void;
}

const WrappedCassetteSelector = ({ options, selectedOption, onOptionChange }: WrappedCassetteSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredPreview, setHoveredPreview] = useState<{ name: string; image: string; anchorRect: { top: number; left: number; right: number; bottom: number; width: number; height: number } } | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const updateMenuPosition = () => {
                if (buttonRef.current) {
                    const buttonRect = buttonRef.current.getBoundingClientRect();
                    setMenuPosition({
                        top: buttonRect.bottom + 4,
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
        }
    }, [isOpen]);

    const selected = options.find(opt => opt.id === selectedOption);
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : menuPosition.width;
    const desiredWidth = Math.max(menuPosition.width, 340);
    const dropdownWidth = Math.min(desiredWidth, Math.max(280, viewportWidth - 24));
    const dropdownLeft = Math.max(12, Math.min(menuPosition.left, viewportWidth - dropdownWidth - 12));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1f2a44]">Wrapped Cassette and Bottom Bar</h3>
            </div>

            {/* Custom Dropdown */}
            <div className="relative">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full border-2 border-[#cbd6e6] rounded-[12px] p-3 bg-white text-left flex items-center justify-between hover:border-[#b8c7df] transition-colors"
                >
                    <span className="text-[#1f2a44] font-medium">
                        {selected ? selected.name : 'Select option'}
                    </span>
                    <svg
                        className={`w-5 h-5 text-[#67748a] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[99998]"
                            onClick={() => setIsOpen(false)}
                        />
                        <div
                            className="fixed z-[99999] bg-white border border-[#d9dfeb] rounded-[12px] shadow-xl max-h-80 overflow-y-auto"
                            style={{
                                top: `${menuPosition.top}px`,
                                left: `${dropdownLeft}px`,
                                width: `${dropdownWidth}px`,
                                maxHeight: '320px',
                                overflowX: 'visible',
                            }}
                        >
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onOptionChange(option.id);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={(event) => option.image && setHoveredPreview({ name: option.name, image: option.image, anchorRect: event.currentTarget.getBoundingClientRect() })}
                                onMouseLeave={() => setHoveredPreview(null)}
                                className={`w-full px-4 py-3 text-left hover:bg-[#e7eef8] flex items-center gap-3 border-b border-[#e3e8f1] last:border-0 ${selectedOption === option.id ? 'bg-[#eef2f8]' : ''
                                    }`}
                            >
                                {/* Thumbnail Image */}
                                {option.image && (
                                    <div className="w-10 h-10 bg-[#d9dfeb] rounded-md overflow-hidden flex-shrink-0 border border-[#d9dfeb]">
                                        <Image
                                            src={option.image}
                                            alt={option.name}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                )}

                                <div className="min-w-0 flex-grow">
                                    <p className={`break-words text-sm font-medium ${selectedOption === option.id ? 'text-[#335c99]' : 'text-[#1f2a44]'}`}>
                                        {option.name}
                                    </p>
                                </div>

                                {option.price && option.price > 0 ? (
                                    <span className="ml-auto shrink-0 text-xs font-semibold bg-[#335c99] text-white px-2 py-1 rounded">
                                        +£{option.price.toFixed(2)}
                                    </span>
                                ) : null}

                            </button>
                        ))}
                        </div>
                    </>
                )}
            </div>
            <PortalHoverImagePreview preview={hoveredPreview} />
        </div>
    );
};

export default WrappedCassetteSelector;
