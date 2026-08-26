import React from 'react';

interface OneDigitPinSelectorProps {
  value: string;
  onChange: (pin: string) => void;
  options?: string[];
  label?: string;
  disabled?: boolean;
}

export const OneDigitPinSelector: React.FC<OneDigitPinSelectorProps> = ({
  value,
  onChange,
  options = ['1', '2', '3', '4'],
  label = 'Enter 1 digit Pin',
  disabled = false,
}) => {
  return (
    <div className="w-full">
      {label && <p className="text-xs text-[#09003B] font-normal mb-3">{label}</p>}
      <div className="grid grid-cols-4 gap-3 w-full">
        {options.map((digit) => {
          const isSelected = value === digit;
          return (
            <button
              key={digit}
              type="button"
              disabled={disabled}
              onClick={() => onChange(digit)}
              className={`h-14 sm:h-16 rounded-2xl text-xl sm:text-2xl font-semibold flex items-center justify-center transition-all duration-150 touch-manipulation border ${
                isSelected
                  ? 'bg-[#3A67D5] text-white border-[#3A67D5] shadow-md shadow-[#3A67D5]/20 scale-[1.02]'
                  : 'bg-white text-[#09003B] border-[#E1E1E1] hover:border-[#3A67D5]/50 hover:bg-[#F8FAFC]'
              }`}
              aria-label={`Select PIN digit ${digit}`}
              aria-pressed={isSelected}
            >
              {digit}
            </button>
          );
        })}
      </div>
      <div className="mt-3 min-h-5 flex items-center">
        {value ? (
          <p className="text-xs font-medium text-[#00AA1D] flex items-center gap-1.5 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00AA1D] inline-block" />
            PIN {value} selected
          </p>
        ) : (
          <p className="text-xs text-gray-400">Select any digit (1-4) for instant emergency access</p>
        )}
      </div>
    </div>
  );
};
