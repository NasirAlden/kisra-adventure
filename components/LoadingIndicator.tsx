
import React from 'react';

interface LoadingIndicatorProps {
  text?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ text = "جارٍ التحميل..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 my-6 text-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-400 mb-4"></div>
      <p className="text-sky-300 text-lg">
        {text}
        <span className="loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </p>
    </div>
  );
};

export default LoadingIndicator;
