'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PortalImageModal } from './customization';

interface ProductGalleryProps {
  images: string[];
  videos?: string[];
  productName: string;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

const MAX_VISIBLE_THUMBNAILS = 5;
const FALLBACK_MEDIA: MediaItem = {
  type: 'image',
  url: '/home/products/vertical-blinds-1.jpg',
};

const ProductGallery = ({ images, videos = [], productName }: ProductGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  const normalizedMedia: MediaItem[] = [
    ...images,
    ...videos.map((videoUrl) => ({ type: 'video' as const, url: videoUrl })),
  ].map((item) => (typeof item === 'string' ? { type: 'image', url: item } : item));

  const safeMedia = normalizedMedia.length > 0 ? normalizedMedia : [FALLBACK_MEDIA];
  const hasMoreImages = safeMedia.length > MAX_VISIBLE_THUMBNAILS;
  const visibleThumbnails = safeMedia.slice(0, MAX_VISIBLE_THUMBNAILS);
  const remainingCount = safeMedia.length - MAX_VISIBLE_THUMBNAILS;

  const isVideo = (url: string) =>
    Boolean(url.match(/\.(mp4|webm|ogg)$/i) || url.includes('youtube') || url.includes('vimeo'));

  const handleMoreClick = () => {
    setShowAllImages(true);
  };

  const handleImageSelectFromModal = (index: number) => {
    setSelectedImage(index);
    setShowAllImages(false);
  };

  const showPreviousImage = () => {
    setSelectedImage((prev) => (prev === 0 ? safeMedia.length - 1 : prev - 1));
  };

  const showNextImage = () => {
    setSelectedImage((prev) => (prev === safeMedia.length - 1 ? 0 : prev + 1));
  };

  const renderMediaItem = (item: MediaItem, fill = false, className = '') => {
    if (item.type === 'video' || isVideo(item.url)) {
      if (item.url.includes('youtube') || item.url.includes('vimeo')) {
        return (
          <iframe
            src={item.url}
            className={`h-full w-full object-cover ${className}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }

      return (
        <video
          src={item.url}
          className={`h-full w-full object-cover ${className}`}
          controls={!fill}
          autoPlay={false}
          muted={fill}
        />
      );
    }

    return (
      <Image
        src={item.url}
        alt={productName}
        fill
        className={`object-cover ${className}`}
        priority={!fill}
        unoptimized
      />
    );
  };

  const renderThumbnail = (item: MediaItem, index: number) => (
    <button
      key={index}
      onClick={() => setSelectedImage(index)}
      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border transition-all md:h-20 md:w-20 ${
        selectedImage === index
          ? 'border-primary shadow-[0_4px_12px_rgba(68,87,102,0.2)]'
          : 'border-border hover:border-border-strong'
      }`}
    >
      {item.type === 'video' || isVideo(item.url) ? (
        <div className="relative flex h-full w-full items-center justify-center bg-black">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
          {!item.url.includes('youtube') && !item.url.includes('vimeo') && (
            <video
              src={item.url}
              className="absolute inset-0 -z-10 h-full w-full object-cover bg-gray-800"
              muted
              preload="metadata"
            />
          )}
        </div>
      ) : (
        <Image
          src={item.url}
          alt={`${productName} view ${index + 1}`}
          fill
          className="object-cover"
          unoptimized
        />
      )}
    </button>
  );

  return (
    <>
      <div className="flex h-fit flex-col gap-3 md:flex-row md:gap-4">
        {safeMedia.length > 1 && (
          <>
            <div className="order-2 flex gap-2 overflow-x-auto scrollbar-hide md:hidden">
              {visibleThumbnails.map((item, index) => renderThumbnail(item, index))}

              {hasMoreImages && (
                <button
                  onClick={handleMoreClick}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border transition-all ${
                    selectedImage >= MAX_VISIBLE_THUMBNAILS
                      ? 'border-primary shadow-[0_4px_12px_rgba(68,87,102,0.2)]'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  <div className="relative h-full w-full">
                    {renderMediaItem(safeMedia[MAX_VISIBLE_THUMBNAILS], true)}
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                      <span className="text-xs font-medium text-white">+{remainingCount}</span>
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="order-1 hidden w-20 shrink-0 flex-col gap-2 md:flex">
              {visibleThumbnails.map((item, index) => renderThumbnail(item, index))}

              {hasMoreImages && (
                <button
                  onClick={handleMoreClick}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border transition-all ${
                    selectedImage >= MAX_VISIBLE_THUMBNAILS
                      ? 'border-primary shadow-[0_4px_12px_rgba(68,87,102,0.2)]'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  <div className="relative h-full w-full">
                    {renderMediaItem(safeMedia[MAX_VISIBLE_THUMBNAILS], true)}
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                      <span className="text-sm font-medium text-white">+{remainingCount}</span>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </>
        )}

        <div
          className="relative order-1 flex-1 overflow-hidden rounded-[14px] border border-border bg-surface-soft md:order-2"
          style={{ aspectRatio: '4/5' }}
        >
          <div className="absolute inset-0 h-full w-full">{renderMediaItem(safeMedia[selectedImage], false)}</div>

          {safeMedia.length > 1 && (
            <>
              <button
                onClick={showPreviousImage}
                className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 shadow-md transition-all hover:bg-white md:h-10 md:w-10"
                aria-label="Previous image"
              >
                <svg className="h-4 w-4 text-gray-800 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={showNextImage}
                className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 shadow-md transition-all hover:bg-white md:h-10 md:w-10"
                aria-label="Next image"
              >
                <svg className="h-4 w-4 text-gray-800 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <PortalImageModal isOpen={showAllImages} onClose={() => setShowAllImages(false)}>
        <div className="mx-auto flex max-h-[min(90vh,820px)] w-full max-w-5xl flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-[0_28px_80px_rgba(15,23,42,0.28)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-5">
            <h3 className="text-lg font-medium text-foreground">All Media ({safeMedia.length})</h3>
            <button
              onClick={() => setShowAllImages(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-gray-800 shadow-sm hover:bg-surface-muted"
              aria-label="Close gallery"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto p-4 md:p-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {safeMedia.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelectFromModal(index)}
                  className={`relative aspect-square overflow-hidden rounded-[12px] border transition-all hover:opacity-90 ${
                    selectedImage === index
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  {item.type === 'video' || isVideo(item.url) ? (
                    <div className="relative h-full w-full bg-black">
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30">
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                      <video src={item.url} className="h-full w-full object-cover opacity-60" />
                    </div>
                  ) : (
                    <Image
                      src={item.url}
                      alt={`${productName} view ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                  <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </PortalImageModal>
    </>
  );
};

export default ProductGallery;
