// src/components/auth/OtpInput.tsx
import React, { useRef, useState, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { Box, TextField } from '@mui/material';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, value: string) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle single digit input
    if (value.length === 1) {
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (index < length - 1 && value) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if OTP is complete
      if (index === length - 1 && value) {
        const completeOtp = newOtp.join('');
        if (completeOtp.length === length) {
          onComplete(completeOtp);
        }
      }
    } 
    // Handle paste or multiple character input
    else if (value.length > 1) {
      handlePaste(value, index);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLDivElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, go to previous input
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (pastedData: string, startIndex: number = 0) => {
    // Extract only digits from pasted data
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (digits.length === 0) return;

    const newOtp = [...otp];
    
    // Fill inputs starting from the current index
    for (let i = 0; i < digits.length && startIndex + i < length; i++) {
      newOtp[startIndex + i] = digits[i];
    }
    
    setOtp(newOtp);

    // Focus the next empty input or the last filled input
    const nextIndex = Math.min(startIndex + digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    // Check if OTP is complete
    const completeOtp = newOtp.join('');
    if (completeOtp.length === length && completeOtp.replace(/\D/g, '').length === length) {
      onComplete(completeOtp);
    }
  };

  const handlePasteEvent = (e: ClipboardEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    handlePaste(pastedData, index);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 1, sm: 1.5 },
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {otp.map((digit, index) => (
        <TextField
          key={index}
          inputRef={(el) => (inputRefs.current[index] = el)}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e as any)}
          onPaste={(e) => handlePasteEvent(e as any, index)}
          disabled={disabled}
          error={error}
          inputProps={{
            maxLength: 1,
            style: {
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 600,
              padding: '12px',
            },
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          sx={{
            width: { xs: 40, sm: 50 },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderWidth: 2,
                borderColor: error ? 'error.main' : digit ? 'primary.main' : 'grey.300',
              },
              '&:hover fieldset': {
                borderColor: error ? 'error.main' : 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: error ? 'error.main' : 'primary.main',
                borderWidth: 2,
              },
            },
          }}
        />
      ))}
    </Box>
  );
};

export default OtpInput;
