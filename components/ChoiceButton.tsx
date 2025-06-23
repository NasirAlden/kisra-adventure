
import React from 'react';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ text, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-3 rounded-lg font-semibold text-lg
        transition-all duration-200 ease-in-out transform
        focus:outline-none focus:ring-2 focus:ring-opacity-75
        ${disabled 
          ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
          : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md hover:shadow-lg active:scale-95 focus:ring-teal-400'
        }
      `}
    >
      {text}
    </button>
  );
};

export default ChoiceButton;
