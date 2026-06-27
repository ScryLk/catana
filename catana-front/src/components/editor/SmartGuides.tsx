import { type FC } from 'react';

export interface Guide {
  type: 'horizontal' | 'vertical';
  position: number;
  color?: string;
  label?: string;
}

interface SmartGuidesProps {
  guides: Guide[];
  canvasWidth: number;
  canvasHeight: number;
}

export const SmartGuides: FC<SmartGuidesProps> = ({
  guides,

}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {guides.map((guide, index) => (
        <div key={index}>
          {guide.type === 'horizontal' ? (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed"
              style={{
                top: `${guide.position}px`,
                borderColor: guide.color || '#3b82f6',
              }}
            >
              {guide.label && (
                <span
                  className="absolute left-2 -top-3 text-xs font-medium px-1 rounded"
                  style={{
                    backgroundColor: guide.color || '#3b82f6',
                    color: 'white',
                  }}
                >
                  {guide.label}
                </span>
              )}
            </div>
          ) : (
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed"
              style={{
                left: `${guide.position}px`,
                borderColor: guide.color || '#3b82f6',
              }}
            >
              {guide.label && (
                <span
                  className="absolute top-2 -left-3 text-xs font-medium px-1 rounded rotate-90 origin-left"
                  style={{
                    backgroundColor: guide.color || '#3b82f6',
                    color: 'white',
                  }}
                >
                  {guide.label}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
