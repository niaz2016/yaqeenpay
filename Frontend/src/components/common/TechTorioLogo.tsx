import React from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

interface TechTorioLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  sx?: SxProps<Theme>;
}

const sizeMap = {
  small: { height: 32, fontSize: '0.875rem' },
  medium: { height: 48, fontSize: '1.25rem' },
  large: { height: 64, fontSize: '1.5rem' }
};

const TechTorioLogo: React.FC<TechTorioLogoProps> = ({ 
  size = 'medium', 
  showText = true,
  sx 
}) => {
  const { height, fontSize } = sizeMap[size];
  const basePath = import.meta.env.VITE_BASE_PATH || '/';
  const logoPath = basePath === '/' ? '/techtorio-logo.svg' : `${basePath}techtorio-logo.svg`;
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        ...sx
      }}
    >
      {/* Logo using standalone SVG file */}
      <Box
        component="img"
        src={logoPath}
        alt="TechTorio"
        sx={{
          height: height,
          width: 'auto',
          flexShrink: 0
        }}
      />
      
      {showText && (
        <Typography
          variant="h6"
          component="span"
          sx={{
            fontSize: fontSize,
            fontWeight: 700,
            color: 'text.primary',
            letterSpacing: '-0.5px'
          }}
        >
          Tech<Box component="span" sx={{ color: '#3498db' }}>Torio</Box>
        </Typography>
      )}
    </Box>
  );
};

export default TechTorioLogo;
