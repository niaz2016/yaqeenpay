// src/components/seller/KycDocumentUpload.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip
} from '@mui/material';
import { CloudUpload, Delete, Description } from '@mui/icons-material';
import type {
  KycDocumentUpload as KycDocumentUploadType,
  KycDocumentType
} from '../../types/seller';

interface KycDocumentUploadProps {
  onSubmit: (documents: KycDocumentUploadType[]) => void;
  onBack: () => void;
  initialDocuments?: KycDocumentUploadType[];
}

const documentTypes: Array<{ value: KycDocumentType; label: string; description: string }> = [
  {
    value: 'BusinessLicense',
    label: 'Business License',
    description: 'Official business registration or license document'
  },
  {
    value: 'TaxCertificate',
    label: 'Tax Certificate',
    description: 'Tax registration certificate or tax ID document'
  },
  {
    value: 'BankStatement',
    label: 'Bank Statement',
    description: 'Recent bank statement (last 3 months)'
  },
  {
    value: 'IdentityDocument',
    label: 'Identity Document',
    description: 'Government-issued ID (passport, driver\'s license, etc.)'
  },
  {
    value: 'AddressProof',
    label: 'Address Proof',
    description: 'Utility bill or lease agreement'
  }
];

const KycDocumentUpload: React.FC<KycDocumentUploadProps> = ({
  onSubmit,
  onBack,
  initialDocuments = []
}) => {
  const [documents, setDocuments] = useState<KycDocumentUploadType[]>(initialDocuments);
  const [selectedDocumentType, setSelectedDocumentType] = useState<KycDocumentType>('BusinessLicense');
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected for upload:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload only PDF, JPG, JPEG, or PNG files');
      console.error('Invalid file type:', file.type);
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      console.error('File too large:', file.size, 'bytes');
      return;
    }

    // Check if document type is already uploaded
    const existingDocument = documents.find(doc => doc.documentType === selectedDocumentType);
    if (existingDocument) {
      setError('Document of this type has already been uploaded');
      console.error('Document type already exists:', selectedDocumentType);
      return;
    }

    setError(null);
    console.log('File validation passed, adding to documents list');

    // Add document to the list
    const newDocument: KycDocumentUploadType = {
      documentType: selectedDocumentType,
      file
    };

    setDocuments([...documents, newDocument]);
    console.log('Documents updated:', [...documents, newDocument]);

    // Reset the file input
    event.target.value = '';
  };

  const handleRemoveDocument = (documentType: KycDocumentType) => {
    setDocuments(documents.filter(doc => doc.documentType !== documentType));
  };

  const handleContinue = () => {
    if (documents.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    onSubmit(documents);
  };

  const getDocumentTypeLabel = (type: KycDocumentType) => {
    return documentTypes.find(dt => dt.value === type)?.label || type;
  };

  const getAvailableDocumentTypes = () => {
    const uploadedTypes = documents.map(doc => doc.documentType);
    return documentTypes.filter(type => !uploadedTypes.includes(type.value));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        KYC Document Upload
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please upload the required documents for verification. All documents should be clear and readable.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Upload Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Upload Documents
        </Typography>

        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={selectedDocumentType}
              label="Document Type"
              onChange={(e) => setSelectedDocumentType(e.target.value as KycDocumentType)}
            >
              {getAvailableDocumentTypes().map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box>
                    <Typography variant="body2">{type.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <input
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={getAvailableDocumentTypes().length === 0}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                disabled={getAvailableDocumentTypes().length === 0}
                fullWidth
              >
                Choose File to Upload
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Supported formats: PDF, JPG, JPEG, PNG (Max 5MB)
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Uploaded Documents ({documents.length})
          </Typography>

          <List>
            {documents.map((doc) => (
              <ListItem key={doc.documentType} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description color="primary" />
                      <Typography variant="body2">
                        {getDocumentTypeLabel(doc.documentType)}
                      </Typography>
                      <Chip
                        label="Uploaded"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {doc.file.name} • {formatFileSize(doc.file.size)}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveDocument(doc.documentType)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Required Documents Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          <strong>Required Documents:</strong>
        </Typography>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Business License (Required)</li>
          <li>Identity Document (Required)</li>
          <li>Tax Certificate (Recommended)</li>
          <li>Bank Statement (Recommended)</li>
          <li>Address Proof (Recommended)</li>
        </ul>
      </Alert>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          onClick={onBack}
          variant="outlined"
          size="large"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          variant="contained"
          size="large"
          disabled={documents.length === 0}
        >
          Continue to Review
        </Button>
      </Box>
    </Box>
  );
};

export default KycDocumentUpload;