import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Pagination from './Pagination';

const Table = ({ 
  columns, 
  data, 
  sortConfig, 
  onSort, 
  pagination, 
  onPageChange,
  isLoading = false
}) => {
  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-slate-200 border-b border-white/10">
            <tr>
              {columns.map((column, idx) => (
                <th 
                  key={column.key || idx} 
                  className={`px-6 py-4 font-semibold ${column.sortable ? 'cursor-pointer select-none hover:bg-white/5' : ''}`}
                  onClick={() => column.sortable && onSort && onSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="flex flex-col">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4 text-indigo-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-indigo-400" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-400">
                  Loading data...
                </td>
              </tr>
            ) : data?.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  className="hover:bg-white/5 transition-colors duration-150"
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-400">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && onPageChange && data?.length > 0 && (
        <div className="flex justify-end">
          <Pagination 
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default Table;
