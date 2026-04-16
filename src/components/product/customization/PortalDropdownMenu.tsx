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

  return createPortal(
    <>
      {/* Backdrop to close on outside click */}
        <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose} aria-hidden="true" />
      {/* Menu */}
      <div
          className="fixed bg-white border border-[#d9dfeb] shadow-2xl overflow-hidden"
        style={{
            zIndex: 9999,
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          width: `${menuPosition.width}px`,
          maxHeight: '320px',
          overflowY: 'auto',
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
