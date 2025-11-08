
import React from 'react';

interface SummaryItemProps {
  label: string;
  value: string;
  isNegative?: boolean;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, isNegative = false }) => {
  return (
    <div className="flex justify-between items-baseline">
            <span className="text-gray-400 print:text-black">{label}</span>
            <span className={`font-semibold ${isNegative ? 'text-red-400' : 'text-gray-100'} print:text-black`}>
        {value}
      </span>
    </div>
  );
};

export default SummaryItem;
