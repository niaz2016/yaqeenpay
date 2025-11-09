// src/components/user/RegistrationSummary.tsx
import React from 'react';
import {
	Box,
	Button,
	Typography,
	Paper,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Stack,
	Chip,
	Alert
} from '@mui/material';
import {
	Business,
	Phone,
	Language,
	LocationOn,
	Description,
	AttachFile
} from '@mui/icons-material';
import type {
		CreateBusinessProfileRequest,
		KycDocumentUpload as KycDocumentUploadType
} from '../../types/user';

interface RegistrationSummaryProps {
	businessProfile: CreateBusinessProfileRequest;
	kycDocuments: KycDocumentUploadType[];
	onSubmit: () => void;
	onBack: () => void;
	loading: boolean;
}

const RegistrationSummary: React.FC<RegistrationSummaryProps> = ({
	businessProfile,
	kycDocuments,
	onSubmit,
	onBack,
	loading
}) => {
	const getDocumentTypeLabel = (type: string) => {
		const types: Record<string, string> = {
			'BusinessLicense': 'Business License',
			'TaxCertificate': 'Tax Certificate',
			'BankStatement': 'Bank Statement',
			'IdentityDocument': 'Identity Document',
			'AddressProof': 'Address Proof'
		};
		return types[type] || type;
	};

	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Review & Submit Application
			</Typography>

			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				Please review all information before submitting your seller application.
			</Typography>

			<Paper sx={{ p: 3, mb: 3 }}>
				<Typography variant="h6" gutterBottom>
					Business Profile
				</Typography>

				<Stack spacing={2}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						<Business color="primary" />
						<Box>
							<Typography variant="body1" fontWeight="medium">
								{businessProfile.businessName}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{businessProfile.businessType} • {businessProfile.businessCategory}
							</Typography>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						<Phone color="primary" />
						<Typography variant="body2">
							{businessProfile.phoneNumber}
						</Typography>
					</Box>

					{businessProfile.website && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
							<Language color="primary" />
							<Typography variant="body2">
								{businessProfile.website}
							</Typography>
						</Box>
					)}

					<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
						<LocationOn color="primary" />
						<Box>
							<Typography variant="body2">
								{businessProfile.address}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{businessProfile.city}, {businessProfile.state} {businessProfile.postalCode}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{businessProfile.country}
							</Typography>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
						<Description color="primary" />
						<Typography variant="body2">
							{businessProfile.description}
						</Typography>
					</Box>

					{businessProfile.taxId && (
						<Box>
							<Typography variant="body2" color="text.secondary">
								Tax ID: {businessProfile.taxId}
							</Typography>
						</Box>
					)}
				</Stack>
			</Paper>

			<Paper sx={{ p: 3, mb: 3 }}>
				<Typography variant="h6" gutterBottom>
					KYC Documents ({kycDocuments.length})
				</Typography>

				{kycDocuments.length > 0 ? (
					<List>
						{kycDocuments.map((doc, index) => (
							<ListItem key={doc.documentType} divider={index < kycDocuments.length - 1}>
								<ListItemIcon>
									<AttachFile color="primary" />
								</ListItemIcon>
								<ListItemText
									primary={getDocumentTypeLabel(doc.documentType)}
									secondary={`${doc.file.name} • ${(doc.file.size / 1024 / 1024).toFixed(2)} MB`}
								/>
								<Chip
									label="Ready"
									size="small"
									color="success"
									variant="outlined"
								/>
							</ListItem>
						))}
					</List>
				) : (
					<Alert severity="warning">
						No documents uploaded. Consider uploading KYC documents to speed up verification.
					</Alert>
				)}
			</Paper>

			<Alert severity="info" sx={{ mb: 3 }}>
				<Typography variant="body2">
					By submitting this application, you agree to our{' '}
					<Typography component="span" color="primary" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
						Terms of Service
					</Typography>{' '}
					and{' '}
					<Typography component="span" color="primary" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
						Seller Agreement
					</Typography>.
					Your application will be reviewed by our team within 2-3 business days.
				</Typography>
			</Alert>

			<Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
				<Typography variant="h6" gutterBottom>
					What Happens Next?
				</Typography>
				<List dense>
					<ListItem>
						<Typography variant="body2">
							1. Your application will be reviewed by our verification team
						</Typography>
					</ListItem>
					<ListItem>
						<Typography variant="body2">
							2. We may contact you for additional information if needed
						</Typography>
					</ListItem>
					<ListItem>
						<Typography variant="body2">
							3. You'll receive an email notification once your application is approved
						</Typography>
					</ListItem>
					<ListItem>
						<Typography variant="body2">
							4. Start selling on TechTorio with full seller privileges
						</Typography>
					</ListItem>
				</List>
			</Paper>

			<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
				<Button
					onClick={onBack}
					variant="outlined"
					size="large"
					disabled={loading}
				>
					Back
				</Button>
				<Button
					onClick={onSubmit}
					variant="contained"
					size="large"
					disabled={loading}
					sx={{ minWidth: 150 }}
				>
					{loading ? 'Submitting...' : 'Submit Application'}
				</Button>
			</Box>
		</Box>
	);
};

export default RegistrationSummary;
