
import React from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface InputFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, value, onChange, placeholder, required = false }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative rounded-md shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          name={id}
          id={id}
          value={value}
          onChange={onChange}
          className="block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm transition-colors"
          placeholder={placeholder}
          inputMode="decimal"
        />
      </div>
    </div>
  );
};

export default InputField;
