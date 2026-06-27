import { type FC } from 'react';
import { type CertificationBadgeData } from '../../../types/editor';

interface CertificationBadgeProps {
  data: CertificationBadgeData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const CertificationBadge: FC<CertificationBadgeProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  const badgeStyles = {
    iso: {
      bg: 'from-blue-500 to-blue-600',
      icon: '🏆',
    },
    ce: {
      bg: 'from-green-500 to-green-600',
      icon: '✓',
    },
    rohs: {
      bg: 'from-emerald-500 to-emerald-600',
      icon: '♻️',
    },
    energy: {
      bg: 'from-yellow-500 to-yellow-600',
      icon: '⚡',
    },
    fcc: {
      bg: 'from-purple-500 to-purple-600',
      icon: '📡',
    },
    custom: {
      bg: 'from-gray-500 to-gray-600',
      icon: '⭐',
    },
  };

  const style = badgeStyles[data.badgeType];

  return (
    <div
      className={`
        inline-block bg-white rounded-xl shadow-lg border-2 p-6 transition-all
        ${isSelected ? 'border-primary-500 shadow-xl ring-4 ring-primary-200' : 'border-gray-200'}
      `}
      onClick={onSelect}
    >
      {data.image ? (
        <div className="flex flex-col items-center">
          <img
            src={data.image}
            alt={data.label}
            className="w-24 h-24 object-contain mb-3"
          />
          <h4 className="font-bold text-gray-900 text-lg mb-1">{data.label}</h4>
          {data.certNumber && (
            <p className="text-xs text-gray-500 mb-2">Nº {data.certNumber}</p>
          )}
          {data.date && (
            <p className="text-xs text-gray-500">{data.date}</p>
          )}
          {data.description && (
            <p className="text-sm text-gray-600 text-center mt-2 max-w-xs">
              {data.description}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div
            className={`
              w-20 h-20 rounded-full bg-gradient-to-br ${style.bg}
              flex items-center justify-center text-4xl mb-3 shadow-lg
            `}
          >
            {style.icon}
          </div>
          <h4 className="font-bold text-gray-900 text-lg mb-1">{data.label}</h4>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {data.badgeType.toUpperCase()}
          </span>
          {data.certNumber && (
            <p className="text-xs text-gray-500 mb-1">Certificado: {data.certNumber}</p>
          )}
          {data.date && (
            <p className="text-xs text-gray-500">{data.date}</p>
          )}
          {data.description && (
            <p className="text-sm text-gray-600 text-center mt-3 max-w-xs">
              {data.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
