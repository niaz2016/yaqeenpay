import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Stack,
  Card,
  CardMedia,
  CardActions,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  CloudUpload as UploadIcon,
  CameraAlt as CameraIcon,
  PhotoLibrary as GalleryIcon,
  MoreVert as MoreIcon 
} from '@mui/icons-material';
import { Capacitor } from '@capacitor/core';
import { cameraService } from '../../services/cameraService';

interface Props {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // in bytes
  acceptedFormats?: string[];
  required?: boolean;
  disabled?: boolean;
}

const ImageUpload: React.FC<Props> = ({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizePerImage = 5 * 1024 * 1024, // 5MB default
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  required = false,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isNative = Capacitor.isNativePlatform();

  const validateFile = (file: File): boolean => {
    if (!acceptedFormats.includes(file.type)) {
      setError(`File type ${file.type} is not supported. Please use: ${acceptedFormats.join(', ')}`);
      return false;
    }

    if (file.size > maxSizePerImage) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size (${(maxSizePerImage / (1024 * 1024)).toFixed(1)}MB)`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setError(null);

    if (images.length + files.length > maxImages) {
      setError(`Cannot upload more than ${maxImages} images`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (validateFile(file)) {
        validFiles.push(file);
      } else {
        return; // Stop processing if any file is invalid
      }
    }

    onImagesChange([...images, ...validFiles]);

    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleCameraCapture = async () => {
    setAnchorEl(null);
    setError(null);
    
    try {
      if (!isNative) {
        // Fallback to file input with camera capture
        cameraInputRef.current?.click();
        return;
      }

      // Use native camera service
      const file = await cameraService.takePhoto();
      if (file) {
        // Validate the captured file
        if (validateFile(file)) {
          onImagesChange([...images, file]);
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please check permissions.');
      // Fallback to file input
      cameraInputRef.current?.click();
    }
  };

  const handleGallerySelect = async () => {
    setAnchorEl(null);
    setError(null);
    
    try {
      if (!isNative) {
        // Fallback to file input
        fileInputRef.current?.click();
        return;
      }

      // Use native gallery service
      const file = await cameraService.selectFromGallery();
      if (file) {
        // Validate the selected file
        if (validateFile(file)) {
          onImagesChange([...images, file]);
        }
      }
    } catch (error) {
      console.error('Error accessing gallery:', error);
      setError('Failed to access gallery.');
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setError(null);
  };

  const getImagePreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={2} mb={2}>
        <Typography variant="subtitle2">
          Product Images {required && <span style={{ color: 'red' }}>*</span>}
        </Typography>
        {isNative ? (
          <>
            <Button
              variant="outlined"
              startIcon={<MoreIcon />}
              onClick={handleMenuOpen}
              disabled={disabled || images.length >= maxImages}
              size="small"
            >
              Add Image
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleCameraCapture}>
                <CameraIcon sx={{ mr: 1 }} />
                Take Photo
              </MenuItem>
              <MenuItem onClick={handleGallerySelect}>
                <GalleryIcon sx={{ mr: 1 }} />
                Choose from Gallery
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || images.length >= maxImages}
            size="small"
          >
            Upload Images
          </Button>
        )}
        <Typography variant="caption" color="text.secondary">
          ({images.length}/{maxImages})
        </Typography>
      </Stack>

      {/* File input for gallery selection */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Camera input for direct photo capture */}
      {isNative && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {required && images.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          At least one product image is required to proceed
        </Alert>
      )}

      {images.length > 0 && (
        <Stack direction="row" gap={2} flexWrap="wrap">
          {images.map((file, index) => (
            <Card key={index} sx={{ width: 150, height: 200 }}>
              <CardMedia
                component="img"
                height="120"
                image={getImagePreviewUrl(file)}
                alt={`Product image ${index + 1}`}
                sx={{ objectFit: 'cover' }}
              />
              <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                  {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveImage(index)}
                  disabled={disabled}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Supported formats: {acceptedFormats.join(', ')} • Max size per image: {(maxSizePerImage / (1024 * 1024)).toFixed(1)}MB
      </Typography>
    </Box>
  );
};

export default ImageUpload;