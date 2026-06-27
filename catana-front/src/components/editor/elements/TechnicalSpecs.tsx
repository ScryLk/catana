import { type FC } from 'react';
import { type TechnicalSpecsData } from '../../../types/editor';

interface TechnicalSpecsProps {
  data: TechnicalSpecsData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const TechnicalSpecs: FC<TechnicalSpecsProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border-2 transition-all
        ${isSelected ? 'border-primary-500 shadow-xl ring-4 ring-primary-200' : 'border-gray-200'}
      `}
      onClick={onSelect}
    >
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {data.specs.map((category, categoryIndex) => (
          <div key={categoryIndex} className="p-6">
            <h4 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
              {category.category}
            </h4>
            <div className="space-y-3">
              {category.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-start justify-between gap-4 py-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.icon && (
                      <span className="text-gray-400 flex-shrink-0">{item.icon}</span>
                    )}
                    <span className="text-gray-600 text-sm font-medium">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-gray-900 font-semibold text-sm text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
