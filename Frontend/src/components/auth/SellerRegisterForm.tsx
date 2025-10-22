// src/components/auth/SellerRegisterForm.tsx
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack, Store } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import profileService from '../../services/profileService';

// Extended schema for seller registration
const sellerRegisterSchema = z.object({
  // Basic user info
  email: z.string().email('Invalid email address'),
  userName: z.string().min(3, 'Username must be at least 3 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  
  // Business info
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  businessDescription: z.string().min(10, 'Business description must be at least 10 characters'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  
  // Agreement
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms'),
  sellerAgreementAccepted: z.boolean().refine(val => val === true, 'You must accept the seller agreement'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SellerRegisterFormData = z.infer<typeof sellerRegisterSchema>;

interface SellerRegisterFormProps {
  onBack: () => void;
}

const businessTypes = [
  'Individual/Sole Proprietorship',
  'LLC (Limited Liability Company)',
  'Corporation',
  'Partnership',
  'Non-Profit Organization',
  'Other'
];

const SellerRegisterForm: React.FC<SellerRegisterFormProps> = ({ onBack }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Personal Information', 'Business Details', 'Terms & Agreements'];

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<SellerRegisterFormData>({
    resolver: zodResolver(sellerRegisterSchema),
    defaultValues: {
      email: '',
      userName: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      businessName: '',
      businessType: '',
      businessDescription: '',
      website: '',
      termsAccepted: false,
      sellerAgreementAccepted: false,
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof SellerRegisterFormData)[] = [];
    
    switch (activeStep) {
      case 0:
        fieldsToValidate = ['email', 'userName', 'phoneNumber', 'password', 'confirmPassword', 'firstName', 'lastName'];
        break;
      case 1:
        fieldsToValidate = ['businessName', 'businessType', 'businessDescription', 'website'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: SellerRegisterFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare registration data with seller role
      const registrationData = {
        ...data,
        role: 'seller' as const,
        businessInfo: {
          businessName: data.businessName,
          businessType: data.businessType,
          businessDescription: data.businessDescription,
          website: data.website || undefined,
        }
      };

      await register(registrationData);

      // Request SMS OTP to phone via profile verification endpoint
      try {
        await profileService.requestPhoneVerification(data.phoneNumber);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (/too many attempts/i.test(msg)) {
          sessionStorage.setItem('otp_rate_limited', '1');
        }
        console.warn('Failed to request SMS OTP', e);
      }

      // Save pending login creds to auto-login after OTP
      sessionStorage.setItem('pending_login_email', data.email);
      // Password not stored for security reasons
      sessionStorage.setItem('pending_login_channel', 'phone');
      sessionStorage.setItem('pending_login_target', data.phoneNumber || data.email);

      navigate('/auth/verify-phone', { state: { phoneNumber: data.phoneNumber, channel: 'phone' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPersonalInfo = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Controller
          name="firstName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="First Name"
              fullWidth
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
          )}
        />
        <Controller
          name="lastName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Last Name"
              fullWidth
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
          )}
        />
      </Box>

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Email Address"
            type="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        )}
      />

      <Controller
        name="userName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Username"
            fullWidth
            error={!!errors.userName}
            helperText={errors.userName?.message}
          />
        )}
      />

      <Controller
        name="phoneNumber"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Mobile Number"
            fullWidth
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber?.message}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            fullWidth
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      />
    </Box>
  );

  const renderBusinessInfo = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Controller
        name="businessName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Business Name"
            fullWidth
            error={!!errors.businessName}
            helperText={errors.businessName?.message}
          />
        )}
      />

      <Controller
        name="businessType"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label="Business Type"
            fullWidth
            SelectProps={{ native: true }}
            error={!!errors.businessType}
            helperText={errors.businessType?.message}
          >
            <option value="">Select Business Type</option>
            {businessTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </TextField>
        )}
      />

      <Controller
        name="businessDescription"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Business Description"
            multiline
            rows={4}
            fullWidth
            error={!!errors.businessDescription}
            helperText={errors.businessDescription?.message}
            placeholder="Describe your business, products, or services..."
          />
        )}
      />

      <Controller
        name="website"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Website (Optional)"
            fullWidth
            error={!!errors.website}
            helperText={errors.website?.message}
            placeholder="https://www.yourbusiness.com"
          />
        )}
      />
    </Box>
  );

  const renderTermsAndAgreements = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" gutterBottom>
        Terms and Agreements
      </Typography>
      
      <Controller
        name="termsAccepted"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                {...field}
                checked={field.value}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Link component={RouterLink} to="/terms" target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link component={RouterLink} to="/privacy" target="_blank">
                  Privacy Policy
                </Link>
              </Typography>
            }
          />
        )}
      />
      {errors.termsAccepted && (
        <Typography variant="caption" color="error">
          {errors.termsAccepted.message}
        </Typography>
      )}

      <Controller
        name="sellerAgreementAccepted"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                {...field}
                checked={field.value}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Link component={RouterLink} to="/seller-agreement" target="_blank">
                  Seller Agreement
                </Link>{' '}
                and understand the fees and commission structure
              </Typography>
            }
          />
        )}
      />
      {errors.sellerAgreementAccepted && (
        <Typography variant="caption" color="error">
          {errors.sellerAgreementAccepted.message}
        </Typography>
      )}

      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>As a seller, you will:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          • Need to complete KYC verification before selling
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Pay a commission fee on each successful transaction
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Be responsible for order fulfillment and customer service
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Follow our seller guidelines and policies
        </Typography>
      </Box>
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderBusinessInfo();
      case 2:
        return renderTermsAndAgreements();
      default:
        return null;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 600, mx: 'auto', width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 4 } }}>
        <Store sx={{ fontSize: { xs: 36, sm: 48 }, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Seller Registration
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Join YaqeenPay as a trusted seller
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel sx={{ 
              '& .MuiStepLabel-label': { 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                display: { xs: 'none', sm: 'block' }
              } 
            }}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {getStepContent(activeStep)}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
          justifyContent: 'space-between' 
        }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={activeStep === 0 ? onBack : handleBack}
            variant="outlined"
            fullWidth={true}
            sx={{ maxWidth: { xs: '100%', sm: 'auto' } }}
          >
            {activeStep === 0 ? 'Back to Role Selection' : 'Back'}
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              fullWidth={true}
              sx={{ maxWidth: { xs: '100%', sm: 'auto' } }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Seller Account'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              fullWidth={true}
              sx={{ maxWidth: { xs: '100%', sm: 'auto' } }}
            >
              Next
            </Button>
          )}
        </Box>
      </form>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link component={RouterLink} to="/auth/login">
            Sign In
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default SellerRegisterForm;