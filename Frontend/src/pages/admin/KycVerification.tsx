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
  Avatar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import adminService from '../../services/adminServiceSelector';
import type { KycDocument, KycReviewRequest } from '../../types/admin';

const KycVerification: React.FC = () => {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'Verified' | 'Rejected'>('Verified');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPendingKycDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KYC documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleReviewDocument = async () => {
    if (!selectedDocument) return;

    try {
      setSubmitting(true);
      const request: KycReviewRequest = {
        documentId: selectedDocument.id,
        status: reviewAction,
        rejectionReason: reviewAction === 'Rejected' ? rejectionReason : undefined
      };

      await adminService.reviewKycDocument(request);
      await fetchDocuments();
      setReviewDialogOpen(false);
      setSelectedDocument(null);
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review document');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewDialog = (document: KycDocument, action: 'Verified' | 'Rejected') => {
    setSelectedDocument(document);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const getStatusChip = (status: string) => {
    const statusMap = {
      'Pending': { color: 'warning' as const, label: 'Pending Review' },
      'Verified': { color: 'success' as const, label: 'Verified' },
      'Approved': { color: 'success' as const, label: 'Approved' }, // Legacy support
      'Rejected': { color: 'error' as const, label: 'Rejected' },
      'Expired': { color: 'error' as const, label: 'Expired' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.Pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'NationalId': 'National ID',
      'Passport': 'Passport',
      'DrivingLicense': 'Driving License',
      'Utility': 'Utility Bill',
      'BankStatement': 'Bank Statement',
      'Other': 'Other Document'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownloadDocument = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          KYC Document Verification
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        KYC Document Verification
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" textAlign="center">
              No pending KYC documents to review
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Documents ({documents.length})
            </Typography>
          </CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Document Type</TableCell>
                  <TableCell>Document Number</TableCell>
                  <TableCell>Submission Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {document.userFullName || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {document.userEmail || 'No email provided'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getDocumentTypeLabel(document.documentType)}
                    </TableCell>
                    <TableCell>
                      {document.documentNumber}
                    </TableCell>
                    <TableCell>
                      {formatDate(document.createdAt)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(document.status)}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Download Document">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownloadDocument(document.documentUrl)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => openReviewDialog(document, 'Verified')}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openReviewDialog(document, 'Rejected')}
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
          {reviewAction === 'Verified' ? 'Verify KYC Document' : 'Reject KYC Document'}
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                <Box flex={1}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        User Information
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Name:</strong> {selectedDocument.userFullName || 'Unknown User'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Email:</strong> {selectedDocument.userEmail || 'No email provided'}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
                
                <Box flex={1}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Document Information
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Type:</strong> {getDocumentTypeLabel(selectedDocument.documentType)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Number:</strong> {selectedDocument.documentNumber}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Submitted:</strong> {formatDate(selectedDocument.createdAt)}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              <Box mt={3}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadDocument(selectedDocument.documentUrl)}
                  fullWidth
                >
                  Download and Review Document
                </Button>
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
                severity={reviewAction === 'Verified' ? 'success' : 'warning'} 
                sx={{ mt: 2 }}
              >
                {reviewAction === 'Verified' 
                  ? 'This document will be marked as verified and the user will be notified.'
                  : 'This document will be rejected and the user will need to resubmit.'
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
            onClick={handleReviewDocument}
            variant="contained"
            color={reviewAction === 'Verified' ? 'success' : 'error'}
            disabled={
              submitting || 
              (reviewAction === 'Rejected' && !rejectionReason.trim())
            }
          >
            {submitting ? 'Processing...' : `${reviewAction === 'Verified' ? 'Verify' : 'Reject'} Document`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KycVerification;