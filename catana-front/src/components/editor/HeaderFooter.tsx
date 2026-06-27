import { type FC } from 'react';
import type { HeaderFooterConfig } from '../../types/editor';
import { processAllFields } from '../../utils/dynamicFields';

interface HeaderFooterProps {
  config: HeaderFooterConfig;
  type: 'header' | 'footer';
  currentPage: number;
  totalPages: number;
  catalogName: string;
  lineName?: string;
  version?: string;
}

export const HeaderFooter: FC<HeaderFooterProps> = ({
  config,
  type,
  currentPage,
  totalPages,
  catalogName,
  lineName,
  version,
}) => {
  if (!config.enabled) {
    return null;
  }

  const fieldValues = processAllFields(config.fields, {
    currentPage,
    totalPages,
    catalogName,
    lineName,
    version,
  });

  const alignmentStyles: Record<string, any> = {
    left: { justifyContent: 'flex-start' },
    center: { justifyContent: 'center' },
    right: { justifyContent: 'flex-end' },
    'space-between': { justifyContent: 'space-between' },
  };

  return (
    <div
      className="w-full flex items-center px-4"
      style={{
        height: `${config.height}px`,
        backgroundColor: config.backgroundColor,
        borderTopWidth: type === 'footer' && config.borderWidth ? `${config.borderWidth}px` : undefined,
        borderBottomWidth: type === 'header' && config.borderWidth ? `${config.borderWidth}px` : undefined,
        borderColor: config.borderColor,
        borderStyle: config.borderWidth ? 'solid' : undefined,
        padding: config.padding ? `${config.padding}px` : undefined,
        ...alignmentStyles[config.alignment],
        gap: '16px',
      }}
    >
      {/* Logo (se houver) */}
      {config.logo && config.logoPosition === 'left' && (
        <img
          src={config.logo}
          alt="Logo"
          style={{
            width: config.logoSize?.width || 40,
            height: config.logoSize?.height || 40,
            objectFit: 'contain',
          }}
        />
      )}

      {/* Fields Container */}
      <div
        className="flex items-center gap-3 flex-1"
        style={{
          justifyContent: config.alignment === 'space-between' ? 'flex-start' : config.alignment,
        }}
      >
        {fieldValues.map((value, index) => (
          <span
            key={index}
            style={{
              fontSize: config.fontSize || 12,
              fontFamily: config.fontFamily || 'Arial',
              color: config.textColor || '#000000',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </span>
        ))}
      </div>

      {/* Logo (centro ou direita) */}
      {config.logo && (config.logoPosition === 'center' || config.logoPosition === 'right') && (
        <img
          src={config.logo}
          alt="Logo"
          style={{
            width: config.logoSize?.width || 40,
            height: config.logoSize?.height || 40,
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  );
};
