import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ActionCategoryAccordion({ title, children, defaultOpen }: { title: string, children: React.ReactNode, defaultOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-default last:border-b-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center h-12 focus:outline-none text-left"
      >
        <span className={`font-sans font-semibold text-sm uppercase tracking-[0.12em] transition-colors ${isOpen ? 'text-text-primary' : 'text-text-secondary'}`}>
          {title}
        </span>
        <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      {isOpen && (
        <div className="pb-4 pt-1 flex flex-col gap-1">
          {children}
        </div>
      )}
    </div>
  );
}
