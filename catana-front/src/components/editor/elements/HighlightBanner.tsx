import { type FC } from 'react';
import { type HighlightBannerData } from '../../../types/editor';

interface HighlightBannerProps {
  data: HighlightBannerData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const HighlightBanner: FC<HighlightBannerProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  const variantStyles = {
    info: 'from-blue-500 via-blue-600 to-cyan-600',
    success: 'from-green-500 via-emerald-600 to-teal-600',
    warning: 'from-yellow-500 via-amber-600 to-orange-600',
    error: 'from-red-500 via-rose-600 to-pink-600',
    primary: 'from-primary-500 via-primary-600 to-accent-600',
  };

  return (
    <div
      className={`
        relative rounded-3xl overflow-hidden shadow-strong border-2 transition-all
        ${isSelected ? 'border-white shadow-2xl ring-4 ring-primary-400' : 'border-transparent hover:border-white/50'}
      `}
      onClick={onSelect}
    >
      {data.image && (
        <div className="absolute inset-0">
          <img
            src={data.image}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-transparent" />
        </div>
      )}

      <div
        className={`
          relative ${data.image ? 'bg-transparent' : `bg-gradient-to-r ${variantStyles[data.variant]}`}
          px-8 py-12 md:px-12 md:py-16
        `}
      >
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
            {data.title}
          </h2>
          {data.subtitle && (
            <p className="text-lg md:text-xl text-white/95 mb-6 leading-relaxed drop-shadow">
              {data.subtitle}
            </p>
          )}
          {data.ctaText && (
            <button className="bg-white hover:bg-gray-50 text-gray-900 font-bold px-8 py-3.5 rounded-xl transition-all shadow-medium hover:shadow-strong hover:scale-105">
              {data.ctaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
