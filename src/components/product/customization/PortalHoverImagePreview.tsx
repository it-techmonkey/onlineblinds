'use client';

import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import HoverImagePreview from './HoverImagePreview';

interface HoverAnchorRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface PortalHoverImagePreviewProps {
  preview: {
    name: string;
    image: string;
    anchorRect: HoverAnchorRect;
  } | null;
}

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 235;
const GUTTER = 12;

const PortalHoverImagePreview = ({ preview }: PortalHoverImagePreviewProps): ReactNode => {
  if (!preview || typeof window === 'undefined') return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const fitsRight = preview.anchorRect.right + GUTTER + PREVIEW_WIDTH <= viewportWidth - GUTTER;
  const left = fitsRight
    ? preview.anchorRect.right + GUTTER
    : Math.max(GUTTER, preview.anchorRect.left - PREVIEW_WIDTH - GUTTER);

  const top = Math.min(
    Math.max(GUTTER, preview.anchorRect.top + preview.anchorRect.height / 2 - PREVIEW_HEIGHT / 2),
    viewportHeight - PREVIEW_HEIGHT - GUTTER
  );

  return createPortal(
    <div
      className="fixed pointer-events-none"
      style={{
        zIndex: 10020,
        left,
        top,
      }}
    >
      <HoverImagePreview
        image={preview.image}
        name={preview.name}
        className="relative pointer-events-none"
      />
    </div>,
    document.body
  );
};

export default PortalHoverImagePreview;
