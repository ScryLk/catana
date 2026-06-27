import { type FC } from 'react';
import { type FeatureListData } from '../../../types/editor';

interface FeatureListProps {
  data: FeatureListData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const FeatureList: FC<FeatureListProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  const renderGridLayout = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.features.map((feature, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
              {feature.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-4">
      {data.features.map((feature, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center text-3xl">
              {feature.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                {feature.title}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMasonryLayout = () => (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
      {data.features.map((feature, index) => (
        <div
          key={index}
          className="break-inside-avoid mb-6 bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="text-4xl mb-4">{feature.icon}</div>
          <h4 className="font-semibold text-gray-900 mb-2 text-lg">
            {feature.title}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`
        bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border-2 transition-all
        ${isSelected ? 'border-primary-500 shadow-xl ring-4 ring-primary-200' : 'border-gray-200 shadow-md'}
      `}
      onClick={onSelect}
    >
      <div className="mb-8 text-center">
        <h3 className="text-3xl font-bold text-gray-900 mb-2">{data.title}</h3>
        {data.subtitle && (
          <p className="text-gray-600 text-lg">{data.subtitle}</p>
        )}
      </div>

      {data.layout === 'grid' && renderGridLayout()}
      {data.layout === 'list' && renderListLayout()}
      {data.layout === 'masonry' && renderMasonryLayout()}
    </div>
  );
};
