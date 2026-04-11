'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

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
    const [imagePreview, setImagePreview] = useState<{ name: string; image: string } | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1f2a44]">Wrapped Cassette and Bottom Bar</h3>
            </div>

            {/* Custom Dropdown */}
            <div className="relative" ref={dropdownRef}>
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
                            ref={menuRef}
                            className="fixed z-[99999] bg-white border border-[#d9dfeb] rounded-[12px] shadow-xl max-h-80 overflow-y-auto"
                            style={{
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                                width: `${menuPosition.width}px`,
                                maxHeight: '320px',
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
                                className={`w-full px-4 py-3 text-left hover:bg-[#e7eef8] flex items-center gap-3 border-b border-[#e3e8f1] last:border-0 ${selectedOption === option.id ? 'bg-[#eef2f8]' : ''
                                    }`}
                            >
                                {/* Thumbnail Image */}
                                {option.image && (
                                    <div
                                        className="w-10 h-10 bg-[#d9dfeb] rounded-md overflow-hidden flex-shrink-0 border border-[#d9dfeb] cursor-zoom-in"
                                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); setImagePreview({ name: option.name, image: option.image! }); }}
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

                                <div className="flex-grow">
                                    <p className={`text-sm font-medium ${selectedOption === option.id ? 'text-[#335c99]' : 'text-[#1f2a44]'}`}>
                                        {option.name}
                                    </p>
                                </div>

                                {option.price && option.price > 0 ? (
                                    <span className="text-xs font-semibold bg-[#335c99] text-white px-2 py-1 rounded">
                                        +${option.price.toFixed(2)}
                                    </span>
                                ) : null}
                            </button>
                        ))}
                        </div>
                    </>
                )}
            </div>

            {imagePreview && (
                <>
                    <div
                        className="fixed inset-0 z-[100000] bg-black/50"
                        onClick={() => setImagePreview(null)}
                        aria-hidden="true"
                    />
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100001] bg-white rounded-xl shadow-2xl border border-[#d9dfeb] overflow-hidden max-w-[90vw] max-h-[90vh] flex flex-col">
                        <div className="relative w-[280px] sm:w-[320px] aspect-[4/3] bg-[#e7eef8] flex items-center justify-center p-4">
                            <Image src={imagePreview.image} alt={imagePreview.name} width={320} height={240} className="object-contain max-w-full max-h-full" />
                        </div>
                        <p className="text-center text-sm font-medium text-[#1f2a44] px-4 py-3 border-t border-gray-100">
                            {imagePreview.name}
                        </p>
                        <button type="button" onClick={() => setImagePreview(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-[#d9dfeb] flex items-center justify-center text-[#596783] hover:text-[#1f2a44] shadow-sm" aria-label="Close">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default WrappedCassetteSelector;

