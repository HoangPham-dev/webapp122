
import React from 'react';

interface InvoiceFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  isTextArea?: boolean;
}

const InvoiceField: React.FC<InvoiceFieldProps> = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  isTextArea = false,
}) => {
  const commonProps = {
    id,
    name: id,
    value,
    onChange,
    placeholder,
    className: 'mt-1 block w-full rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {isTextArea ? (
        <textarea {...commonProps} rows={3} />
      ) : (
        <input type={type} {...commonProps} />
      )}
    </div>
  );
};

export default InvoiceField;
