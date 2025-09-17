// src/pages/seller/SellerRegistrationPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BusinessProfileForm, KycDocumentUpload, RegistrationSummary } from '../../components/user';
import { userService } from '../../services/userService';
import type {
  CreateBusinessProfileRequest,
  KycDocumentUpload as KycDocumentUploadType,
  SellerRegistrationRequest
} from '../../types/user';

const steps = ['Business Profile', 'KYC Documents', 'Review & Submit'];

const UserRegistrationPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [businessProfile, setBusinessProfile] = useState<CreateBusinessProfileRequest | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocumentUploadType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect or hide page when user is already a seller or has submitted KYC
  useEffect(() => {
    if (loading) return;
    if (!user) return; // unauthenticated users may still access the page (registration flow)

  const isSeller = (user.roles || []).some(r => r.toLowerCase() === 'seller');
  const kycStatus = (user.kycStatus || '').toString().toLowerCase();
  // Only block users who are already verified or explicitly rejected.
  // Users in 'pending' should be allowed to view/edit their application.
  const blockedStatuses = ['verified', 'rejected'];
  const kycSubmitted = blockedStatuses.includes(kycStatus);

    if (isSeller || kycSubmitted) {
      // If the user already has KYC or is a seller, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleBusinessProfileSubmit = (data: CreateBusinessProfileRequest) => {
    setBusinessProfile(data);
    handleNext();
  };

  const handleKycDocumentsSubmit = (documents: KycDocumentUploadType[]) => {
    setKycDocuments(documents);
    handleNext();
  };

  const handleFinalSubmit = async () => {
    if (!businessProfile) {
      setError('Business profile is required');
      return;
    }

  setSubmitting(true);
    setError(null);

    try {
      const registrationData: SellerRegistrationRequest = {
        businessProfile,
        kycDocuments
      };

      const response: any = await userService.applyForSellerRole(registrationData as any);

      // Normalize multiple possible API shapes so frontend doesn't crash
      // Possible shapes observed in this codebase:
      // 1) ApiResponse wrapper: { success: boolean, data: any, message?: string }
      // 2) PascalCase wrapper: { Success: boolean, Message?: string, Data?: any }
      // 3) Direct data or string
      if (!response) {
        setError('Empty response from server');
        return;
      }

      const normalized = (() => {
        if (typeof response === 'string') {
          return { ok: true, message: response, data: null };
        }

        if (typeof response === 'object') {
          if ('success' in response) {
            return {
              ok: Boolean((response as any).success),
              message: (response as any).message || (response as any).data || '',
              data: (response as any).data
            };
          }

          if ('Success' in response) {
            return {
              ok: Boolean((response as any).Success),
              message: (response as any).Message || (response as any).Data || '',
              data: (response as any).Data || (response as any).data
            };
          }

          // Fallback: if it has a message field, use it; otherwise treat as success
          return {
            ok: true,
            message: (response as any).message || (response as any).Message || JSON.stringify(response),
            data: response
          };
        }

        return { ok: false, message: 'Unexpected server response', data: null };
      })();

      if (normalized.ok) {
        setSuccess(typeof normalized.message === 'string' ? normalized.message : 'Registration submitted');
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setError(typeof normalized.message === 'string' ? normalized.message : 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <BusinessProfileForm
            onSubmit={handleBusinessProfileSubmit}
            initialData={businessProfile}
          />
        );
      case 1:
        return (
          <KycDocumentUpload
            onSubmit={handleKycDocumentsSubmit}
            initialDocuments={kycDocuments}
            onBack={handleBack}
          />
        );
      case 2:
        return (
            <RegistrationSummary
              businessProfile={businessProfile!}
              kycDocuments={kycDocuments}
              onSubmit={handleFinalSubmit}
              onBack={handleBack}
              loading={submitting}
            />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Become a Seller
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Complete the registration process to start selling on YaqeenPay
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box>{renderStepContent(activeStep)}</Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default UserRegistrationPage;