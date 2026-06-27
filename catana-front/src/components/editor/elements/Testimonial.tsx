import { type FC } from 'react';
import { type TestimonialData } from '../../../types/editor';
import { FiStar } from 'react-icons/fi';

interface TestimonialProps {
  data: TestimonialData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const Testimonial: FC<TestimonialProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-lg border-2 p-6 transition-all
        ${isSelected ? 'border-primary-500 shadow-xl ring-4 ring-primary-200' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      {/* Quote Icon */}
      <div className="absolute top-4 right-4 text-6xl text-primary-100 font-serif leading-none">
        "
      </div>

      {/* Rating */}
      {data.rating !== undefined && data.rating > 0 && (
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <FiStar
              key={index}
              className={`w-5 h-5 ${
                index < data.rating!
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Quote */}
      <blockquote className="relative z-10 text-gray-700 text-lg leading-relaxed mb-6 italic">
        "{data.quote}"
      </blockquote>

      {/* Author Info */}
      <div className="flex items-center gap-4">
        {data.avatar ? (
          <img
            src={data.avatar}
            alt={data.author}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-lg">
              {data.author.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{data.author}</p>
          {data.role && (
            <p className="text-sm text-gray-600">
              {data.role}
              {data.company && ` • ${data.company}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
