'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface DropdownOption {
  id: string;
  name: string;
  price?: number;
  image?: string;
}

interface SimpleDropdownProps {
  label: string;
  options: DropdownOption[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DropdownPortal = ({
  isOpen,
  menuPosition,
  options,
  selectedValue,
  onChange,
  onClose,
  onImagePreview,
}: {
  isOpen: boolean;
  menuPosition: { top: number; left: number; width: number };
  options: DropdownOption[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  onClose: () => void;
  onImagePreview: (name: string, image: string) => void;
}) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose} aria-hidden="true" />
      <div
        className="fixed bg-white border border-[#d9dfeb] rounded-xl shadow-2xl overflow-hidden"
        style={{
          zIndex: 9999,
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          width: `${menuPosition.width}px`,
          maxHeight: '320px',
          overflowY: 'auto',
        }}
        role="listbox"
      >
        {options.map((option) => (
          <div
            key={option.id}
            className={`px-4 py-3 text-left hover:bg-[#e7eef8] flex items-center gap-3 border-b border-[#e3e8f1] last:border-0 transition-colors ${selectedValue === option.id ? 'bg-[#eef2f8]' : ''}`}
          >
            {option.image && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onImagePreview(option.name, option.image!);
                  onClose();
                }}
                className="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-[#d9dfeb] bg-[#e7eef8] hover:border-[#b8c7df] transition-colors cursor-pointer"
                title={`View ${option.name}`}
                aria-label={`View image for ${option.name}`}
              >
                <Image src={option.image} alt={option.name} width={40} height={40} className="object-cover w-full h-full" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onChange(option.id);
                onClose();
              }}
              className="grow min-w-0 flex items-center gap-3 text-left"
            >
              <p className={`text-sm font-medium ${selectedValue === option.id ? 'text-[#335c99]' : 'text-[#1f2a44]'}`}>
                {option.name}
              </p>
            </button>

            {option.price && option.price > 0 ? (
              <span className="text-xs font-semibold bg-[#335c99] text-white px-2.5 py-1 rounded-md shrink-0 whitespace-nowrap">
                +£{option.price.toFixed(2)}
              </span>
            ) : null}

            {selectedValue === option.id && (
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-[#335c99] rounded-sm flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>,
    document.body
  );
};

const ImagePreviewPortal = ({
  imagePreview,
  onClose,
}: {
  imagePreview: { name: string; image: string } | null;
  onClose: () => void;
}) => {
  if (!imagePreview) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50" style={{ zIndex: 10000 }} onClick={onClose} aria-hidden="true" />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 10001 }}>
        <div className="bg-white rounded-xl shadow-2xl border border-[#d9dfeb] overflow-hidden flex flex-col relative">
          <div className="relative w-70 sm:w-80 aspect-4/3 bg-[#e7eef8] flex items-center justify-center p-4">
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
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-[#d9dfeb] flex items-center justify-center text-[#596783] hover:text-[#1f2a44] shadow-sm transition-colors"
            aria-label="Close image preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

const SimpleDropdown = ({ label, options, selectedValue, onChange, placeholder = 'Select' }: SimpleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const [imagePreview, setImagePreview] = useState<{ name: string; image: string } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateMenuPosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    updateMenuPosition();

    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => option.id === selectedValue);

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-[#1f2a44]">{label}</label>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full border border-[#c4d0e4] rounded-xl p-3 bg-white text-left flex items-center justify-between hover:border-[#b8c7df] active:border-[#335c99] transition-colors shadow-[0_1px_2px_rgba(31,42,68,0.06)] hover:shadow-[0_2px_4px_rgba(31,42,68,0.12)]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select ${label}, currently ${selectedOption?.name || placeholder}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption?.image && (
            <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 border border-[#d9dfeb] bg-[#e7eef8]">
              <Image src={selectedOption.image} alt={selectedOption.name} width={32} height={32} className="object-cover w-full h-full" />
            </div>
          )}
          <span className="text-[#1f2a44] font-medium truncate">
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <svg className={`w-5 h-5 text-[#67748a] transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <DropdownPortal
        isOpen={isOpen}
        menuPosition={menuPosition}
        options={options}
        selectedValue={selectedValue}
        onChange={onChange}
        onClose={() => setIsOpen(false)}
        onImagePreview={(name, image) => setImagePreview({ name, image })}
      />

      <ImagePreviewPortal imagePreview={imagePreview} onClose={() => setImagePreview(null)} />
    </div>
  );
};

export default SimpleDropdown;

