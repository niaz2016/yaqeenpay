import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon 
} from '@mui/icons-material';
import { useSwipeable } from 'react-swipeable';

interface ImageGalleryProps {
  images: Array<{ id: string; imageUrl: string; altText?: string; }>;
  selectedIndex: number;
  onSelect: (index: number) => void;
  aspectRatio?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  selectedIndex,
  onSelect,
  aspectRatio = 4/3
}) => {
  const [showControls, setShowControls] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (selectedIndex < images.length - 1) {
        onSelect(selectedIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (selectedIndex > 0) {
        onSelect(selectedIndex - 1);
      }
    },
    touchEventOptions: { passive: false },
    trackMouse: true
  });

  const showNavigation = images.length > 1;

  return (
    <Box
      sx={{ position: 'relative' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      {...handlers}
    >
      {showNavigation && (showControls || selectedIndex > 0) && (
        <IconButton
          onClick={() => selectedIndex > 0 && onSelect(selectedIndex - 1)}
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            },
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 1
          }}
          disabled={selectedIndex === 0}
        >
          <ChevronLeftIcon />
        </IconButton>
      )}

      {showNavigation && (showControls || selectedIndex < images.length - 1) && (
        <IconButton
          onClick={() => selectedIndex < images.length - 1 && onSelect(selectedIndex + 1)}
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            },
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 1
          }}
          disabled={selectedIndex === images.length - 1}
        >
          <ChevronRightIcon />
        </IconButton>
      )}

      {showNavigation && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 1
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={() => onSelect(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: index === selectedIndex ? 'primary.main' : 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.2)'
                }
              }}
            />
          ))}
        </Box>
      )}

      <Box
        sx={{
          width: '100%',
          paddingTop: `${100 * aspectRatio}%`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {images.map((image, index) => (
          <Box
            key={image.id}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: index === selectedIndex ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
              display: index === selectedIndex ? 'block' : 'none'
            }}
          >
            <img
              src={image.imageUrl}
              alt={image.altText || `Product image ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ImageGallery;