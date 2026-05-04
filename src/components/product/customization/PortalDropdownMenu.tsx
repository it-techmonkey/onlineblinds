'use client';

import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalDropdownMenuProps {
  isOpen: boolean;
  menuPosition: { top: number; left: number; width: number };
  onClose: () => void;
  children: ReactNode;
}

/**
 * Portal-based dropdown menu component that renders outside the DOM tree
 * to escape overflow constraints from parent containers.
 */
export const PortalDropdownMenu = ({
  isOpen,
  menuPosition,
  onClose,
  children,
}: PortalDropdownMenuProps): ReactNode => {
  if (!isOpen) return null;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : menuPosition.width;
  const desiredWidth = Math.max(menuPosition.width, 340);
  const width = Math.min(desiredWidth, Math.max(280, viewportWidth - 24));
  const left = Math.max(12, Math.min(menuPosition.left, viewportWidth - width - 12));

  return createPortal(
    <>
      {/* Backdrop to close on outside click */}
        <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose} aria-hidden="true" />
      {/* Menu */}
      <div
          className="fixed bg-white border border-[#d9dfeb] shadow-2xl"
        style={{
            zIndex: 9999,
          top: `${menuPosition.top}px`,
          left: `${left}px`,
          width: `${width}px`,
          maxHeight: '320px',
          overflowY: 'auto',
          overflowX: 'visible',
            borderRadius: 12,
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
};

export default PortalDropdownMenu;
