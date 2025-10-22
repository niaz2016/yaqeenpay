// src/pages/auth/RegisterPage.tsx
import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import RoleSelectionForm from '../../components/auth/RoleSelectionForm';
import BuyerRegisterForm from '../../components/auth/BuyerRegisterForm';
import SellerRegisterForm from '../../components/auth/SellerRegisterForm';
import type { UserRole } from '../../types/roles';

const RegisterPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  const renderContent = () => {
    if (!selectedRole) {
      return <RoleSelectionForm onRoleSelect={handleRoleSelect} />;
    }

    switch (selectedRole) {
      case 'buyer':
        return <BuyerRegisterForm onBack={handleBack} />;
      case 'seller':
        return <SellerRegisterForm onBack={handleBack} />;
      default:
        return <RoleSelectionForm onRoleSelect={handleRoleSelect} />;
    }
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mt: { xs: 4, sm: 8 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {renderContent()}
      </Box>
    </Container>
  );
};

export default RegisterPage;