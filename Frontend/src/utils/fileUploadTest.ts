// src/utils/fileUploadTest.ts
// Utility for testing file upload functionality

export const testFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('test', file);

  // Test the FormData creation
  console.log('FormData entries:');
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  // Check if the file is properly appended
  const appendedFile = formData.get('test') as File;
  console.log('File details:', {
    name: appendedFile?.name,
    size: appendedFile?.size,
    type: appendedFile?.type,
    lastModified: appendedFile?.lastModified
  });

  return formData;
};

export const validateFileForUpload = (file: File): { isValid: boolean; error?: string } => {
  // Validate file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf',
    'image/gif'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Please use JPG, PNG, PDF, or GIF files.`
    };
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds the 5MB limit.`
    };
  }

  // Validate file name
  if (!file.name || file.name.trim() === '') {
    return {
      isValid: false,
      error: 'File must have a valid name.'
    };
  }

  return { isValid: true };
};

export const getFileInfo = (file: File) => {
  return {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    type: file.type,
    lastModified: new Date(file.lastModified).toLocaleString()
  };
};