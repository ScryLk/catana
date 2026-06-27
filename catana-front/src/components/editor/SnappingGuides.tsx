import { type FC } from 'react';
import { type SnapLine } from '../../utils/snappingUtils';

interface SnappingGuidesProps {
  lines: SnapLine[];
  zoom: number;
}

export const SnappingGuides: FC<SnappingGuidesProps> = ({ lines, zoom }) => {
  if (lines.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {lines.map((line, index) => (
        <div
          key={index}
          className="absolute bg-blue-500"
          style={{
            left: line.orientation === 'vertical' ? line.position * (zoom / 100) : line.start * (zoom / 100),
            top: line.orientation === 'horizontal' ? line.position * (zoom / 100) : line.start * (zoom / 100),
            width: line.orientation === 'vertical' ? '1px' : (line.end - line.start) * (zoom / 100),
            height: line.orientation === 'horizontal' ? '1px' : (line.end - line.start) * (zoom / 100),
          }}
        />
      ))}
    </div>
  );
};
