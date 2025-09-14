import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Stack,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import adminService from '../../services/adminServiceSelector';
import type { BusinessProfile, SellerApprovalRequest } from '../../types/admin';

const SellerApproval: React.FC = () => {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPendingSellerApplications();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch seller applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleReviewApplication = async () => {
    if (!selectedProfile) return;

    try {
      setSubmitting(true);
      const request: SellerApprovalRequest = {
        businessProfileId: selectedProfile.id,
        status: reviewAction,
        rejectionReason: reviewAction === 'Rejected' ? rejectionReason : undefined
      };

      await adminService.reviewSellerApplication(request);
      await fetchProfiles();
      setReviewDialogOpen(false);
      setSelectedProfile(null);
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review application');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewDialog = (profile: BusinessProfile, action: 'Approved' | 'Rejected') => {
    setSelectedProfile(profile);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const getStatusChip = (status: string) => {
    const statusMap = {
      'Pending': { color: 'warning' as const, label: 'Pending Review' },
      'Approved': { color: 'success' as const, label: 'Approved' },
      'Rejected': { color: 'error' as const, label: 'Rejected' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.Pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Seller Application Approval
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Seller Application Approval
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {profiles.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" textAlign="center">
              No pending seller applications to review
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Applications ({profiles.length})
            </Typography>
          </CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Business Name</TableCell>
                  <TableCell>Business Type</TableCell>
                  <TableCell>Submission Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {profile.user.firstName} {profile.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {profile.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BusinessIcon color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {profile.businessName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={profile.businessType} 
                        color="default" 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(profile.submissionDate)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(profile.verificationStatus)}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Approve Application">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => openReviewDialog(profile, 'Approved')}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject Application">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openReviewDialog(profile, 'Rejected')}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {reviewAction === 'Approved' ? 'Approve Seller Application' : 'Reject Seller Application'}
        </DialogTitle>
        <DialogContent>
          {selectedProfile && (
            <Box>
              {/* User Information */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6">User Information</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon color="action" />
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedProfile.user.firstName} {selectedProfile.user.lastName}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon color="action" />
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedProfile.user.email}
                      </Typography>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Business Information */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BusinessIcon color="primary" />
                    <Typography variant="h6">Business Information</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Typography variant="body2">
                      <strong>Business Name:</strong> {selectedProfile.businessName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Business Type:</strong> {selectedProfile.businessType}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Category:</strong> {selectedProfile.businessCategory}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Description:</strong> {selectedProfile.description}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tax ID:</strong> {selectedProfile.taxId}
                    </Typography>
                    {selectedProfile.website && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <LanguageIcon color="action" />
                        <Typography variant="body2">
                          <strong>Website:</strong> 
                          <a href={selectedProfile.website} target="_blank" rel="noopener noreferrer">
                            {selectedProfile.website}
                          </a>
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Contact Information */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PhoneIcon color="primary" />
                    <Typography variant="h6">Contact Information</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon color="action" />
                      <Typography variant="body2">
                        <strong>Phone:</strong> {selectedProfile.phoneNumber}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOnIcon color="action" />
                      <Typography variant="body2">
                        <strong>Address:</strong> {selectedProfile.address}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      <strong>City:</strong> {selectedProfile.city}
                    </Typography>
                    <Typography variant="body2">
                      <strong>State:</strong> {selectedProfile.state}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Country:</strong> {selectedProfile.country}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Postal Code:</strong> {selectedProfile.postalCode}
                    </Typography>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Submitted:</strong> {formatDate(selectedProfile.submissionDate)}
                </Typography>
              </Box>

              {reviewAction === 'Rejected' && (
                <Box mt={3}>
                  <TextField
                    fullWidth
                    label="Rejection Reason"
                    multiline
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejection..."
                    required
                  />
                </Box>
              )}

              <Alert 
                severity={reviewAction === 'Approved' ? 'success' : 'warning'} 
                sx={{ mt: 2 }}
              >
                {reviewAction === 'Approved' 
                  ? 'This seller application will be approved and the user will gain seller privileges.'
                  : 'This seller application will be rejected and the user will need to resubmit.'
                }
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReviewDialogOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReviewApplication}
            variant="contained"
            color={reviewAction === 'Approved' ? 'success' : 'error'}
            disabled={
              submitting || 
              (reviewAction === 'Rejected' && !rejectionReason.trim())
            }
          >
            {submitting ? 'Processing...' : `${reviewAction === 'Approved' ? 'Approve' : 'Reject'} Application`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerApproval;