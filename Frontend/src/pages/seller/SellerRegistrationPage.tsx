// src/pages/seller/SellerRegistrationPage.tsx
import React, { useState } from 'react';
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
import BusinessProfileForm from '../../components/seller/BusinessProfileForm';
import KycDocumentUpload from '../../components/seller/KycDocumentUpload';
import RegistrationSummary from '../../components/seller/RegistrationSummary';
import { sellerService } from '../../services/sellerService';
import type {
  CreateBusinessProfileRequest,
  KycDocumentUpload as KycDocumentUploadType,
  SellerRegistrationRequest
} from '../../types/seller';

const steps = ['Business Profile', 'KYC Documents', 'Review & Submit'];

const SellerRegistrationPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [businessProfile, setBusinessProfile] = useState<CreateBusinessProfileRequest | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocumentUploadType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

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

    setLoading(true);
    setError(null);

    try {
      const registrationData: SellerRegistrationRequest = {
        businessProfile,
        kycDocuments
      };

      const response = await sellerService.applyForSellerRole(registrationData);

      if (response.Success) {
        setSuccess(response.Message);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setError(response.Message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
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
            loading={loading}
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

export default SellerRegistrationPage;