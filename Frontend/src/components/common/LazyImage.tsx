import React, { useState, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lowResSrc?: string;
  aspectRatio?: number;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  lowResSrc,
  aspectRatio = 1,
  ...props 
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);

    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        paddingTop: `${100 * aspectRatio}%`,
        backgroundColor: '#f5f5f5',
        overflow: 'hidden'
      }}
    >
      {!loaded && !error && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}
      {lowResSrc && !loaded && !error && (
        <img
          src={lowResSrc}
          alt={alt}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      <img
        {...props}
        src={error ? '/placeholder-image.png' : src}
        alt={alt}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        loading="lazy"
      />
    </Box>
  );
};

export default LazyImage;