'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PortalDropdownMenu } from './PortalDropdownMenu';
import PortalHoverImagePreview from './PortalHoverImagePreview';

interface BracketTypeOption {
    id: string;
    name: string;
    description?: string;
    price?: number;
    image?: string;
}

interface BracketTypeSelectorProps {
    options: BracketTypeOption[];
    selectedBracket: string | null;
    onBracketChange: (bracketId: string) => void;
}

const BracketTypeSelector = ({ options, selectedBracket, onBracketChange }: BracketTypeSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredPreview, setHoveredPreview] = useState<{ name: string; image: string; anchorRect: { top: number; left: number; right: number; bottom: number; width: number; height: number } } | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Update menu position
    useEffect(() => {
        if (!isOpen || !buttonRef.current) return;

        const updateMenuPosition = () => {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
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

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.id === selectedBracket);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1f2a44]">Bracket Type</h3>
            </div>

            {/* Dropdown Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full border-2 border-[#cbd6e6] p-3 bg-white text-left flex items-center justify-between hover:border-[#b8c7df] active:border-[#335c99] transition-colors"
                style={{ borderRadius: 12 }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Select bracket type, currently ${selectedOption?.name || 'not selected'}`}
            >
                <span className="text-[#1f2a44] font-medium">
                    {selectedOption ? selectedOption.name : 'Select option'}
                </span>
                <svg
                    className={`w-5 h-5 text-[#67748a] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Portal Dropdown Menu */}
            <PortalDropdownMenu
                isOpen={isOpen}
                menuPosition={menuPosition}
                onClose={() => setIsOpen(false)}
            >
                {options.map((option) => (
                    <div
                        key={option.id}
                        className={`w-full px-4 py-3 text-left hover:bg-[#e7eef8] flex items-center gap-3 border-b border-[#e3e8f1] last:border-0 transition-colors ${
                            selectedBracket === option.id ? 'bg-[#eef2f8]' : ''
                        }`}
                        onMouseEnter={(event) => option.image && setHoveredPreview({ name: option.name, image: option.image, anchorRect: event.currentTarget.getBoundingClientRect() })}
                        onMouseLeave={() => setHoveredPreview(null)}
                    >
                        {option.image && (
                            <div
                                className="w-10 h-10 bg-[#d9dfeb] rounded-md overflow-hidden border border-[#d9dfeb]"
                                style={{ flexShrink: 0 }}
                                aria-hidden="true"
                            >
                                <Image
                                    src={option.image}
                                    alt={option.name}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                onBracketChange(option.id);
                                setIsOpen(false);
                            }}
                            className="grow min-w-0 text-left"
                        >
                            <p className={`text-sm font-medium ${selectedBracket === option.id ? 'text-[#335c99]' : 'text-[#1f2a44]'}`}>
                                {option.name}
                            </p>
                            {option.description && (
                                <p className="text-xs text-[#67748a]">{option.description}</p>
                            )}
                        </button>

                        {option.price && option.price > 0 && (
                            <span className="text-xs font-semibold bg-[#335c99] text-white px-2 py-1 rounded whitespace-nowrap">
                                +£{option.price.toFixed(2)}
                            </span>
                        )}

                    </div>
                ))}
            </PortalDropdownMenu>
            <PortalHoverImagePreview preview={hoveredPreview} />
        </div>
    );
};

export default BracketTypeSelector;
