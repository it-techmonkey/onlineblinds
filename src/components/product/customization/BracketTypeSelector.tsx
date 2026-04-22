'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PortalDropdownMenu } from './PortalDropdownMenu';
import { PortalImageModal } from './PortalImageModal';

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
    const [imagePreview, setImagePreview] = useState<{ name: string; image: string } | null>(null);
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
                    >
                        {/* Thumbnail Image */}
                        {option.image && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    setImagePreview({ name: option.name, image: option.image! });
                                }}
                                className="w-10 h-10 bg-[#d9dfeb] rounded-md overflow-hidden border border-[#d9dfeb] hover:border-[#b8c7df] transition-colors cursor-pointer"
                                style={{ flexShrink: 0 }}
                                title={`View ${option.name}`}
                                aria-label={`View image for ${option.name}`}
                            >
                                <Image
                                    src={option.image}
                                    alt={option.name}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                />
                            </button>
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

            {/* Portal Image Preview Modal */}
            <PortalImageModal isOpen={!!imagePreview} onClose={() => setImagePreview(null)}>
                {imagePreview && (
                    <div className="bg-white rounded-xl shadow-2xl border border-[#d9dfeb] overflow-hidden flex flex-col">
                        <div className="relative bg-[#e7eef8] flex items-center justify-center p-4" style={{ width: 280, maxWidth: '100%', aspectRatio: '4 / 3' }}>
                            <Image
                                src={imagePreview.image}
                                alt={imagePreview.name}
                                width={320}
                                height={240}
                                className="object-contain max-w-full max-h-full"
                                priority
                            />
                        </div>
                        <p className="text-center text-sm font-medium text-[#1f2a44] px-4 py-3 border-t border-[#e3e8f1]">
                            {imagePreview.name}
                        </p>
                        <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-[#d9dfeb] flex items-center justify-center text-[#596783] hover:text-[#1f2a44] shadow-sm transition-colors"
                            aria-label="Close image preview"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </PortalImageModal>
        </div>
    );
};

export default BracketTypeSelector;

