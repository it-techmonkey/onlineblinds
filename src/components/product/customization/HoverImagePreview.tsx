'use client';

import Image from 'next/image';

interface HoverImagePreviewProps {
  image: string;
  name: string;
  className?: string;
  imageClassName?: string;
  imageSizes?: string;
}

const HoverImagePreview = ({
  image,
  name,
  className = 'absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 pointer-events-none',
  imageClassName = 'relative w-[260px] aspect-[4/3] rounded-md overflow-hidden bg-[#e7eef8]',
  imageSizes = '260px',
}: HoverImagePreviewProps) => {
  return (
    <div className={className}>
      <div className="max-w-[280px] rounded-[12px] border border-[#d9dfeb] bg-white p-2 shadow-xl">
        <div className={imageClassName}>
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain"
            sizes={imageSizes}
          />
        </div>
        <p className="mt-2 text-center text-sm font-medium text-[#1f2a44]">
          {name}
        </p>
      </div>
    </div>
  );
};

export default HoverImagePreview;
