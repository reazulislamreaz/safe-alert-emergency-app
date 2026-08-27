import React from 'react';
import { DigitBoxes } from './DigitBoxes';

const PIN_LENGTH = 4;

interface FourDigitPinInputProps {
  value: string;
  onChange: (pin: string) => void;
  label?: string;
  masked?: boolean;
  disabled?: boolean;
}

export const FourDigitPinInput: React.FC<FourDigitPinInputProps> = ({
  value,
  onChange,
  label = 'Enter 4-digit PIN',
  masked = true,
  disabled = false,
}) => {
  const digits = Array.from({ length: PIN_LENGTH }, (_, i) => value[i] || '');

  const handleChange = (next: string[]) => {
    if (disabled) return;
    onChange(next.join('').slice(0, PIN_LENGTH));
  };

  return (
    <div className="w-full">
      {label && <p className="text-xs text-[#09003B] font-normal mb-3">{label}</p>}
      <DigitBoxes
        length={PIN_LENGTH}
        value={digits}
        onChange={handleChange}
        autoComplete="new-password"
        masked={masked}
      />
      <div className="mt-3 min-h-5 flex items-center">
        {value.length === PIN_LENGTH ? (
          <p className="text-xs font-medium text-[#00AA1D] flex items-center gap-1.5 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00AA1D] inline-block" />
            4-digit PIN entered
          </p>
        ) : (
          <p className="text-xs text-gray-400">Enter exactly 4 digits</p>
        )}
      </div>
    </div>
  );
};

/** @deprecated Use FourDigitPinInput — kept for any leftover imports */
export const OneDigitPinSelector = FourDigitPinInput;
