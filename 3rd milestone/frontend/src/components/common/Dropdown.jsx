import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({ trigger, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger || <button className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">Options <ChevronDown className="w-4 h-4 ml-1" /></button>}
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-dark-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 border border-gray-100 dark:border-gray-800">
            <div className="py-1" onClick={() => setIsOpen(false)}>
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
