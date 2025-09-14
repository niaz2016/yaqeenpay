import React from 'react';
import { Stack, TextField, Button, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TopUpRequest } from '../../types/wallet';

const schema = z.object({
  amount: z
    .number()
    .refine((v) => Number.isFinite(v), { message: 'Amount is required' })
    .refine((v) => v > 0, { message: 'Amount must be greater than 0' })
    .refine((v) => v <= 100000, { message: 'Amount too large' }),
  channel: z.enum(['JazzCash', 'Easypaisa', 'BankTransfer', 'ManualAdjustment']),
});

type FormData = z.infer<typeof schema>;

type Props = {
  onSubmit: (data: TopUpRequest) => Promise<void> | void;
  submitting?: boolean;
};

const TopUpForm: React.FC<Props> = ({ onSubmit, submitting }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 100, channel: 'JazzCash' },
  });

  const handleFormSubmit = (data: FormData) => {
    const request: TopUpRequest = {
      amount: data.amount,
      currency: 'PKR',
      channel: data.channel
    };
    onSubmit(request);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          label="Amount"
          type="number"
          inputProps={{ step: '0.01', min: '0.01' }}
          error={!!errors.amount}
          helperText={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
          sx={{ width: 180 }}
        />
        <TextField
          label="Method"
          select
          defaultValue={'JazzCash'}
          {...register('channel')}
          onChange={(e) => setValue('channel', e.target.value as any)}
          sx={{ width: 220 }}
        >
          {[
            { value: 'JazzCash', label: 'JazzCash' },
            { value: 'Easypaisa', label: 'Easypaisa' },
            { value: 'BankTransfer', label: 'Bank Transfer' },
            { value: 'ManualAdjustment', label: 'Manual Adjustment' }
          ].map(m => (
            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" disabled={!!submitting}>Top Up</Button>
      </Stack>
    </form>
  );
};

export default TopUpForm;
