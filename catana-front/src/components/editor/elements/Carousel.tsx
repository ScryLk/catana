import { type FC, useState, useEffect } from 'react';
import { type CarouselData } from '../../../types/editor';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface CarouselProps {
  data: CarouselData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const Carousel: FC<CarouselProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (data.autoplay && data.interval) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % data.slides.length);
      }, data.interval);

      return () => clearInterval(timer);
    }
  }, [data.autoplay, data.interval, data.slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % data.slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + data.slides.length) % data.slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden border-2 transition-all
        ${isSelected ? 'border-primary-500 shadow-xl ring-4 ring-primary-200' : 'border-gray-200 shadow-lg'}
      `}
      onClick={onSelect}
    >
      {/* Slides */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-900">
        {data.slides.map((slide, index) => (
          <div
            key={index}
            className={`
              absolute inset-0 transition-all duration-500 ease-in-out
              ${index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
            `}
          >
            <img
              src={slide.image}
              alt={slide.title || `Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {(slide.title || slide.description) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                <div className="p-8 text-white max-w-3xl">
                  {slide.title && (
                    <h3 className="text-3xl font-bold mb-2">{slide.title}</h3>
                  )}
                  {slide.description && (
                    <p className="text-lg text-white/90">{slide.description}</p>
                  )}
                  {slide.link && (
                    <button className="mt-4 bg-white text-gray-900 font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      Saiba mais
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      {data.showControls && data.slides.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
          >
            <FiChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
          >
            <FiChevronRight className="w-6 h-6 text-gray-900" />
          </button>
        </>
      )}

      {/* Indicators */}
      {data.showIndicators && data.slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {data.slides.map((_, index) => (
            <button
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all
                ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'}
              `}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
