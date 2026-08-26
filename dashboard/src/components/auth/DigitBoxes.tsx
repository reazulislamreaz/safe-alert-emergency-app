import React, { useRef } from 'react';
import { authOtpInputClass } from './AuthShell';

interface DigitBoxesProps {
  length: number;
  value: string[];
  onChange: (next: string[]) => void;
  inputMode?: 'numeric';
  autoComplete?: string;
  masked?: boolean;
}

export const DigitBoxes: React.FC<DigitBoxesProps> = ({
  length,
  value,
  onChange,
  autoComplete = 'one-time-code',
  masked = false,
}) => {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill('');
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    onChange(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex items-center gap-3 w-full">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type={masked ? 'password' : 'text'}
          inputMode="numeric"
          autoComplete={index === 0 ? autoComplete : 'off'}
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`${authOtpInputClass} ${
            digit ? 'border-[#3A67D5] bg-[#BCD9FF]/40' : ''
          }`}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};
