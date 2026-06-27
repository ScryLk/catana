import { type FC } from 'react';
import { type IconGridData } from '../../../types/editor';

interface IconGridProps {
  data: IconGridData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const IconGrid: FC<IconGridProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl p-8 border-2 transition-all
        ${isSelected ? 'border-primary-500 shadow-xl ring-4 ring-primary-200' : 'border-gray-200 shadow-md'}
      `}
      onClick={onSelect}
    >
      {data.title && (
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {data.title}
        </h3>
      )}

      <div
        className={`grid gap-${data.spacing}`}
        style={{
          gridTemplateColumns: `repeat(${data.columns}, minmax(0, 1fr))`,
        }}
      >
        {data.icons.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div
              className={`
                w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3
                transition-transform group-hover:scale-110
              `}
              style={{
                backgroundColor: item.color ? `${item.color}20` : '#f3f4f6',
                color: item.color || '#6b7280',
              }}
            >
              {item.icon}
            </div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">
              {item.label}
            </h4>
            {item.description && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
