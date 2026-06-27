import { type FC } from 'react';
import { type TableData } from '../../../types/editor';

interface DataTableProps {
  data: TableData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const DataTable: FC<DataTableProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border-2 overflow-hidden transition-all
        ${isSelected ? 'border-primary-500 shadow-xl ring-4 ring-primary-200' : 'border-gray-200'}
      `}
      onClick={onSelect}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`
              divide-y divide-gray-200
              ${data.striped ? 'divide-y divide-gray-100' : ''}
            `}
          >
            {data.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  transition-colors
                  ${data.hoverable ? 'hover:bg-gray-50' : ''}
                  ${data.striped && rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                `}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`
                      px-6 text-sm text-gray-900
                      ${data.compact ? 'py-2' : 'py-4'}
                      ${data.bordered ? 'border-r border-gray-200 last:border-r-0' : ''}
                    `}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
