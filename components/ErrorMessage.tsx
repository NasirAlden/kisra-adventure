
import React from 'react';
import { ErrorType } from '../types';

interface ErrorMessageProps {
  error: ErrorType | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div 
      className="bg-red-700 bg-opacity-80 border-l-4 border-red-500 text-red-100 p-4 rounded-md shadow-lg my-4" 
      role="alert"
    >
      <p className="font-bold text-red-300">حدث خطأ ({error.type})</p>
      <p>{error.message}</p>
      {error.details && <p className="text-sm mt-1">التفاصيل: {error.details}</p>}
    </div>
  );
};

export default ErrorMessage;
