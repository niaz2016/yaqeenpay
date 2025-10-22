// src/pages/profile/ProfilePage.tsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tab,
  Tabs,
  Paper,
  Avatar,
  Chip,
  Stack,
  Card,
  CardContent,
  Button,
  IconButton,
  Divider,
  LinearProgress,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Edit,
  PhotoCamera,
  Email,
  Phone,
  LocationOn,
  Business,
  Star as StarIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import ProfileDetails from '../../components/profile/ProfileDetails';
import ChangePassword from '../../components/profile/ChangePassword';
import RatingSummary from '../../components/rating/RatingSummary';
import RatingsList from '../../components/rating/RatingsList';
import RatingBadge from '../../components/rating/RatingBadge';
import profileService from '../../services/profileService';
import ratingService from '../../services/ratingService';
import { validateFileForUpload } from '../../utils/fileUploadTest';
import type { RatingStats } from '../../types/rating';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { updateUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Hidden file input ref (use id to trigger)
  const fileInputId = 'profile-image-input';

  // Load rating stats on mount
  React.useEffect(() => {
    if (user?.id) {
      loadRatingStats();
    }
  }, [user?.id]);

  const loadRatingStats = async () => {
    if (!user?.id) return;
    try {
      setLoadingRatings(true);
      const stats = await ratingService.getRatingStats(user.id);
      setRatingStats(stats);
    } catch (error) {
      console.error('Failed to load rating stats:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getProfileCompletion = () => {
    if (!user) return 0;
    let completion = 0;
    const fields = [
      user.firstName,
      user.lastName,
      user.email,
      user.phoneNumber,
      user.address,
      user.city,
      user.country
    ];

    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    completion = Math.round((filledFields / fields.length) * 100);

    // Add bonus for verified fields
    if (user.isEmailVerified) completion += 5;
    if (user.isPhoneVerified) completion += 5;

    return Math.min(completion, 100);
  };

  const getKycStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 2, sm: 3 } }}>
        <Alert severity="error">Please log in to view your profile.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 2, sm: 3 } }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #4288e9ff 100%)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: { xs: 2, sm: 3 }, textAlign: { xs: 'center', sm: 'left' } }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              sx={{
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                border: '4px solid white',
                fontSize: '2rem',
                bgcolor: 'primary.main'
              }}
              src={user.profileImageUrl}
            >
              {!user.profileImageUrl && `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
            </Avatar>
            <IconButton
              sx={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                bgcolor: 'white',
                border: '2px solid',
                borderColor: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' }
              }}
              size="small"
              component="label"
            >
              <input
                hidden
                id={fileInputId}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  setUploadError(null);
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const validation = validateFileForUpload(file);
                  if (!validation.isValid) {
                    setUploadError(validation.error || 'Invalid file');
                    return;
                  }

                  try {
                    setUploading(true);
                    setUploadProgress(0);
                    const res = await profileService.uploadProfileImage(file, (progressEvent) => {
                      if (!progressEvent.lengthComputable) return;
                      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                      setUploadProgress(percent);
                    });

                    // Ensure URL present
                    if (!res || !res.url) {
                      throw new Error('Upload completed but no URL was returned by the server');
                    }

                    // Persist returned url to user profile
                    const updated = await profileService.updateProfile({ profileImageUrl: res.url });
                    // API returns ProfileDetails; map to auth user shape and update auth context
                    if (updated) {
                      updateUser({
                        id: updated.id,
                        email: updated.email,
                        phoneNumber: updated.phoneNumber,
                        firstName: updated.firstName,
                        lastName: updated.lastName,
                        profileImageUrl: updated.profileImageUrl,
                        dateOfBirth: updated.dateOfBirth as any,
                        gender: updated.gender,
                        address: updated.address,
                        city: updated.city,
                        state: updated.state,
                        country: updated.country,
                        postalCode: updated.postalCode,
                        isEmailVerified: (updated as any).isEmailVerified ?? false,
                        isPhoneVerified: (updated as any).isPhoneVerified ?? false,
                        kycStatus: (updated as any).kycStatus ?? '',
                        profileCompleteness: (updated as any).profileCompleteness ?? 0,
                        roles: updated.roles || [],
                        created: (updated as any).created || ''
                      } as any);
                    }
                  } catch (err: any) {
                    setUploadError(err?.message || 'Upload failed');
                  } finally {
                    setUploading(false);
                    setUploadProgress(0);
                  }
                }}
              />
              <PhotoCamera fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, color: 'white' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              {user.email}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
              {user.roles?.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                />
              ))}
            </Stack>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                Profile Completion: {getProfileCompletion()}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={getProfileCompletion()}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                    borderRadius: 4
                  }
                }}
              />
              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption">Uploading: {uploadProgress}%</Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, mt: 1 }} />
                </Box>
              )}
              {uploadError && (
                <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Quick Stats Cards */}
      <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 250px', minWidth: { xs: '100%', sm: 250 } }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Email />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email Status
                </Typography>
                <Chip
                  label={user.isEmailVerified ? 'Verified' : 'Unverified'}
                  color={user.isEmailVerified ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <Phone />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Phone Status
                </Typography>
                <Chip
                  label={user.isPhoneVerified ? 'Verified' : 'Unverified'}
                  color={user.isPhoneVerified ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  KYC Status
                </Typography>
                <Chip
                  label={user.kycStatus}
                  color={getKycStatusColor(user.kycStatus)}
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <LocationOn />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {user.city && user.country ? `${user.city}, ${user.country}` : 'Not Set'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Rating Stats Card */}
        {ratingStats && (
          <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <StarIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Reputation
                  </Typography>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <RatingBadge stats={ratingStats} size="small" />
                    <Typography variant="body2" fontWeight={500}>
                      {ratingStats.averageRating.toFixed(1)} ★
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({ratingStats.totalRatings})
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Main Content with Tabs */}
      <Paper elevation={2}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="profile tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ 
              px: { xs: 1, sm: 3 },
              minHeight: { xs: 48, sm: 56 },
              '& .MuiTab-root': {
                minHeight: { xs: 48, sm: 56 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 }
              }
            }}
          >
            <Tab
              label="Overview"
              icon={<Person />}
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              label="Personal Info"
              icon={<Edit />}
              iconPosition="start"
              {...a11yProps(1)}
            />
            <Tab
              label="Security"
              icon={<Security />}
              iconPosition="start"
              {...a11yProps(2)}
            />
            <Tab
              label="Reputation"
              icon={<StarIcon />}
              iconPosition="start"
              {...a11yProps(3)}
            />
            <Tab
              label="Notifications"
              icon={<Notifications />}
              iconPosition="start"
              {...a11yProps(4)}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Welcome to your account overview. Here you can see a summary of your account status and recent activity.
            </Typography>

            {/* Account Summary */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Account Summary
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Account Type:</Typography>
                  <Stack direction="row" spacing={1}>
                    {user.roles?.map((role) => (
                      <Chip key={role} label={role} size="small" />
                    ))}
                  </Stack>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Member Since:</Typography>
                  <Typography variant="body2">
                    {user.created ? new Date(user.created).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Profile Completion:</Typography>
                  <Typography variant="body2">{getProfileCompletion()}%</Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ProfileDetails />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <ChangePassword />
            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Additional security settings and two-factor authentication options will be available here.
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Account Security
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">Two-Factor Authentication</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add an extra layer of security to your account
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small">
                    Enable
                  </Button>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">Login Notifications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get notified when someone logs into your account
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              My Reputation & Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your reputation score is built from verified transactions and helps other users trust you.
            </Typography>

            {loadingRatings ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : ratingStats ? (
              <>
                {/* Rating Summary */}
                <Box sx={{ mb: 4 }}>
                  <RatingSummary userId={user.id} compact={false} />
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Ratings List */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Recent Reviews
                </Typography>
                <RatingsList userId={user.id} />
              </>
            ) : (
              <Alert severity="info">
                You haven't received any ratings yet. Complete transactions to build your reputation!
              </Alert>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage how you receive notifications and communications from YaqeenPay.
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Email Notifications
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">Transaction Alerts</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get notified about payments and withdrawals
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small">
                    Enabled
                  </Button>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">Account Updates</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Important updates about your account
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small">
                    Enabled
                  </Button>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">Marketing Communications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      News, features, and promotional content
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ProfilePage;