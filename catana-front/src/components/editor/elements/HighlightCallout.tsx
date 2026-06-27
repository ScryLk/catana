import { type FC } from 'react';
import { type HighlightCalloutData } from '../../../types/editor';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiStar } from 'react-icons/fi';

interface HighlightCalloutProps {
  data: HighlightCalloutData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const HighlightCallout: FC<HighlightCalloutProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  const variantConfig = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-800',
      Icon: FiInfo,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      textColor: 'text-green-800',
      Icon: FiCheckCircle,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      textColor: 'text-yellow-800',
      Icon: FiAlertTriangle,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      textColor: 'text-red-800',
      Icon: FiAlertCircle,
    },
    primary: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      titleColor: 'text-primary-900',
      textColor: 'text-primary-800',
      Icon: FiStar,
    },
  };

  const config = variantConfig[data.variant];
  const Icon = config.Icon;

  return (
    <div
      className={`
        ${config.bg} ${config.border} border-2 rounded-lg p-4 transition-all
        ${isSelected ? 'ring-4 ring-primary-500 shadow-lg' : 'shadow-sm hover:shadow-md'}
      `}
      onClick={onSelect}
    >
      <div className="flex gap-3">
        <div className={`${config.iconBg} ${config.iconColor} rounded-lg p-2 h-fit`}>
          {data.icon ? (
            <span className="text-2xl">{data.icon}</span>
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`${config.titleColor} font-semibold text-lg mb-1`}>
            {data.title}
          </h4>
          <p className={`${config.textColor} text-sm leading-relaxed`}>
            {data.message}
          </p>
        </div>
      </div>
    </div>
  );
};
