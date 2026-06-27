import { type FC, useState } from 'react';
import { type GalleryData } from '../../../types/editor';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface GalleryProps {
  data: GalleryData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const Gallery: FC<GalleryProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    if (data.lightbox) {
      setCurrentImageIndex(index);
      setLightboxOpen(true);
    }
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % data.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + data.images.length) % data.images.length);
  };

  return (
    <>
      <div
        className={`
          bg-white rounded-lg p-${data.spacing} border-2 transition-all
          ${isSelected ? 'border-primary-500 shadow-xl ring-4 ring-primary-200' : 'border-gray-200 shadow-md'}
        `}
        onClick={onSelect}
      >
        <div
          className={`grid gap-${data.spacing}`}
          style={{
            gridTemplateColumns: `repeat(${data.columns}, minmax(0, 1fr))`,
          }}
        >
          {data.images.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(index);
              }}
            >
              <img
                src={image.thumbnail || image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {data.lightbox && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <span className="text-gray-900 text-xl">🔍</span>
                    </div>
                  </div>
                </div>
              )}
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm font-medium">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && data.lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={closeLightbox}
          >
            <FiX className="w-6 h-6" />
          </button>

          {data.images.length > 1 && (
            <>
              <button
                className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <FiChevronLeft className="w-8 h-8" />
              </button>
              <button
                className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <FiChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div
            className="max-w-6xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={data.images[currentImageIndex].src}
              alt={data.images[currentImageIndex].alt}
              className="max-w-full max-h-full object-contain"
            />
            {data.images[currentImageIndex].caption && (
              <p className="text-white text-center mt-4 text-lg">
                {data.images[currentImageIndex].caption}
              </p>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {currentImageIndex + 1} / {data.images.length}
          </div>
        </div>
      )}
    </>
  );
};
