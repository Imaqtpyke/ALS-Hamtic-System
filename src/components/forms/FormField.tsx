import React from 'react';

type CommonProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
};

type InputProps = CommonProps & React.InputHTMLAttributes<HTMLInputElement> & {
  type?: string;
};

type TextareaProps = CommonProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type SelectProps = CommonProps & React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
};

export const InputField: React.FC<InputProps> = ({ id, label, required, error, hint, className = '', type = 'text', ...rest }) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={id}
        type={type}
        aria-invalid={!!error}
        aria-describedby={hint ? `${id}-hint` : error ? `${id}-error` : undefined}
        className={`mt-1 block w-full border rounded-md shadow-sm py-3 sm:py-2.5 px-3 text-base sm:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export const TextareaField: React.FC<TextareaProps> = ({ id, label, required, error, hint, className = '', rows = 3, ...rest }) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={hint ? `${id}-hint` : error ? `${id}-error` : undefined}
        className={`mt-1 block w-full border rounded-md shadow-sm py-3 sm:py-2.5 px-3 text-base sm:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export const SelectField: React.FC<SelectProps> = ({ id, label, required, error, hint, className = '', children, ...rest }) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={hint ? `${id}-hint` : error ? `${id}-error` : undefined}
        className={`mt-1 block w-full border rounded-md shadow-sm py-3 sm:py-2.5 px-3 text-base sm:text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
        {...rest}
      >
        {children}
      </select>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};
