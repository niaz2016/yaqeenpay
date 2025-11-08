import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Paper,
  Divider,
  Container,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import adminService from '../../services/adminServiceSelector';
import TopRightToast from '../../components/TopRightToast';

interface CreateEmailForm {
  username: string;
  password: string;
  confirmPassword: string;
}

const EmailManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<CreateEmailForm>({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const generatePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
  };

  const validateForm = (): boolean => {
    setError('');

    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }

    if (!/^[a-z0-9]+$/.test(formData.username)) {
      setError('Username must contain only lowercase letters and numbers');
      return false;
    }

    if (formData.username.length < 3 || formData.username.length > 20) {
      setError('Username must be between 3 and 20 characters');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleCreateEmailUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await adminService.createEmailUser({
        username: formData.username.toLowerCase(),
        password: formData.password
      });

      setSuccess(`Email account created successfully! Email: ${formData.username}@techtorio.online`);
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create email account');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 4 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
            <IconButton
              onClick={() => navigate('/admin/dashboard')}
              sx={{ color: 'text.secondary' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <EmailIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              Email Management
            </Typography>
          </Box>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="md">
        <Stack spacing={3}>
          {/* Alert Messages */}
          <TopRightToast open={Boolean(error)} message={error || ''} severity="error" onClose={() => setError('')} />
          <TopRightToast open={Boolean(success)} message={success || ''} severity="success" onClose={() => setSuccess('')} />

          {/* Create Email Form */}
          <Card>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                px: 3,
                py: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon sx={{ color: 'white' }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Create New Email Account
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <form onSubmit={handleCreateEmailUser}>
                <Stack spacing={3}>
                  {/* Username Field */}
                  <Box>
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="support, sales, info"
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="body2" color="text.secondary">
                              @techtorio.online
                            </Typography>
                          </InputAdornment>
                        )
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Use lowercase letters and numbers only (3-20 characters)
                    </Typography>
                  </Box>

                  {/* Password Field */}
                  <Box>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Min 8 characters"
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                    <Button
                      size="small"
                      onClick={generatePassword}
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      Generate Strong Password
                    </Button>
                  </Box>

                  {/* Confirm Password Field */}
                  <Box>
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm Password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={<AddIcon />}
                    fullWidth
                    sx={{ py: 1.5, textTransform: 'none', fontSize: '1rem' }}
                  >
                    {loading ? 'Creating Account...' : 'Create Email Account'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Paper sx={{ bgcolor: '#e3f2fd', border: '1px solid #90caf9', p: { xs: 2, sm: 3 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0d47a1', mb: 2 }}>
              Email Access Information
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.5, sm: 2 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120, color: '#1565c0' }}>
                  IMAP Server:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-all' }}>
                  mail.techtorio.online
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.5, sm: 2 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120, color: '#1565c0' }}>
                  IMAP Port:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  993 (SSL/TLS)
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.5, sm: 2 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120, color: '#1565c0' }}>
                  SMTP Server:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-all' }}>
                  mail.techtorio.online
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.5, sm: 2 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120, color: '#1565c0' }}>
                  SMTP Port:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  465 (SSL/TLS) or 587 (STARTTLS)
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default EmailManagement;
