// src/components/user/BusinessProfileForm.tsx
import React, { useEffect } from 'react';
import {
	Box,
	TextField,
	Button,
	Typography,
	MenuItem,
	FormControl,
	InputLabel,
	Select,
	Stack
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateBusinessProfileRequest } from '../../types/user';

const businessProfileSchema = z.object({
	businessName: z.string().min(1, 'Business name is required'),
	businessType: z.string().min(1, 'Business type is required'),
	businessCategory: z.string().min(1, 'Business category is required'),
	description: z.string().min(10, 'Description must be at least 10 characters'),
	website: z.string().url('Invalid URL').optional().or(z.literal('')),
	phoneNumber: z.string().min(1, 'Phone number is required'),
	address: z.string().min(1, 'Address is required'),
	city: z.string().min(1, 'City is required'),
	state: z.string().min(1, 'State is required'),
	country: z.string().min(1, 'Country is required'),
	postalCode: z.string().min(1, 'Postal code is required'),
	taxId: z.string().optional()
});

type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

interface BusinessProfileFormProps {
	onSubmit: (data: CreateBusinessProfileRequest) => void;
	initialData?: CreateBusinessProfileRequest | null;
}

const businessTypes = [
	'Sole Proprietorship',
	'Partnership',
	'Corporation',
	'LLC',
	'Non-Profit',
	'Other'
];

const businessCategories = [
	'Electronics',
	'Fashion & Apparel',
	'Home & Garden',
	'Health & Beauty',
	'Sports & Outdoors',
	'Books & Media',
	'Automotive',
	'Food & Beverages',
	'Art & Crafts',
	'Services',
	'Other'
];

const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({ onSubmit, initialData }) => {
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting }
	} = useForm<BusinessProfileFormData>({
		resolver: zodResolver(businessProfileSchema),
		defaultValues: initialData || {
			businessName: '',
			businessType: '',
			businessCategory: '',
			description: '',
			website: '',
			phoneNumber: '',
			address: '',
			city: '',
			state: '',
			country: '',
			postalCode: '',
			taxId: ''
		}
	});

	// Keep form in sync when initialData arrives/changes after mount
	useEffect(() => {
		if (initialData) {
			reset({
				businessName: initialData.businessName || '',
				businessType: initialData.businessType || '',
				businessCategory: initialData.businessCategory || '',
				description: initialData.description || '',
				website: initialData.website || '',
				phoneNumber: initialData.phoneNumber || '',
				address: initialData.address || '',
				city: initialData.city || '',
				state: initialData.state || '',
				country: initialData.country || '',
				postalCode: initialData.postalCode || '',
				taxId: initialData.taxId || ''
			});
		}
	}, [initialData, reset]);

	const handleFormSubmit = (data: BusinessProfileFormData) => {
		// Remove empty website field if not provided
		const submitData: CreateBusinessProfileRequest = {
			...data,
			website: data.website || undefined
		};
		onSubmit(submitData);
	};

	return (
		<Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
			<Typography variant="h6" gutterBottom>
				Business Information
			</Typography>

			<Stack spacing={3}>
				<Box sx={{ display: 'flex', gap: 2 }}>
					<Controller
						name="businessName"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								fullWidth
								label="Business Name"
								error={!!errors.businessName}
								helperText={errors.businessName?.message}
								required
							/>
						)}
					/>

					<Controller
						name="businessType"
						control={control}
						render={({ field }) => (
							<FormControl fullWidth error={!!errors.businessType} required>
								<InputLabel>Business Type</InputLabel>
								<Select {...field} label="Business Type">
									{businessTypes.map((type) => (
										<MenuItem key={type} value={type}>
											{type}
										</MenuItem>
									))}
								</Select>
								{errors.businessType && (
									<Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
										{errors.businessType.message}
									</Typography>
								)}
							</FormControl>
						)}
					/>
				</Box>

				<Box sx={{ display: 'flex', gap: 2 }}>
					<Controller
						name="businessCategory"
						control={control}
						render={({ field }) => (
							<FormControl fullWidth error={!!errors.businessCategory} required>
								<InputLabel>Business Category</InputLabel>
								<Select {...field} label="Business Category">
									{businessCategories.map((category) => (
										<MenuItem key={category} value={category}>
											{category}
										</MenuItem>
									))}
								</Select>
								{errors.businessCategory && (
									<Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
										{errors.businessCategory.message}
									</Typography>
								)}
							</FormControl>
						)}
					/>

					<Controller
						name="phoneNumber"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								fullWidth
								label="Business Phone Number"
								error={!!errors.phoneNumber}
								helperText={errors.phoneNumber?.message}
								required
							/>
						)}
					/>
				</Box>

				<Controller
					name="description"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							fullWidth
							label="Business Description"
							multiline
							rows={4}
							error={!!errors.description}
							helperText={errors.description?.message}
							required
						/>
					)}
				/>

				<Box sx={{ display: 'flex', gap: 2 }}>
					<Controller
						name="website"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								fullWidth
								label="Website (optional)"
								error={!!errors.website}
								helperText={errors.website?.message}
								placeholder="https://example.com"
							/>
						)}
					/>

					<Controller
						name="taxId"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								fullWidth
								label="Tax ID (optional)"
								error={!!errors.taxId}
								helperText={errors.taxId?.message}
							/>
						)}
					/>
				</Box>

				<Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
					Business Address
				</Typography>

				<Controller
					name="address"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							fullWidth
							label="Street Address"
							error={!!errors.address}
							helperText={errors.address?.message}
							required
						/>
					)}
				/>

				<Box sx={{ display: 'flex', gap: 2 }}>
					<Controller
						name="city"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								fullWidth
								label="City"
								error={!!errors.city}
								helperText={errors.city?.message}
								required
							/>
						)}
					/>

					<Controller
						name="state"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								fullWidth
								label="State/Province"
								error={!!errors.state}
								helperText={errors.state?.message}
								required
							/>
						)}
					/>

					<Controller
						name="postalCode"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								fullWidth
								label="Postal Code"
								error={!!errors.postalCode}
								helperText={errors.postalCode?.message}
								required
							/>
						)}
					/>
				</Box>

				<Controller
					name="country"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							fullWidth
							label="Country"
							error={!!errors.country}
							helperText={errors.country?.message}
							required
						/>
					)}
				/>

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
					<Button
						type="submit"
						variant="contained"
						size="large"
						disabled={isSubmitting}
					>
						Continue to KYC Documents
					</Button>
				</Box>
			</Stack>
		</Box>
	);
};

export default BusinessProfileForm;
