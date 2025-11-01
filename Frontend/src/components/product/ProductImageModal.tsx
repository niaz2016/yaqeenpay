import React, { memo, useEffect, useRef } from 'react';
import {
  Modal,
  Box,
  IconButton,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface ProductImageModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
  zoom: number;
  position: { x: number; y: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onImageClick: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  // Optional handler to set zoom directly (used by pinch gestures)
  onSetZoom?: (zoom: number) => void;
}

const ProductImageModal: React.FC<ProductImageModalProps> = memo(({
  open,
  onClose,
  imageUrl,
  altText,
  zoom,
  position,
  onZoomIn,
  onZoomOut,
  onImageClick,
  onMouseMove
  , onSetZoom
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Dynamically import Hammer only in the browser environment
    let Hammer: any;
    let mc: any;
    let startZoom = zoom;

    const setup = async () => {
      try {
  // Use an indirect dynamic import (via Function) to prevent Vite from
  // statically analyzing/trying to resolve the module when it's not
  // installed. This lets the app fall back gracefully if Hammer isn't present.
  const dynamicImport: (id: string) => Promise<any> = new Function('id', 'return import(id);') as any;
  const mod = await dynamicImport('hammerjs');
  Hammer = mod?.default || mod;
        if (!containerRef.current || !Hammer) return;

        mc = new Hammer.Manager(containerRef.current);
        const pinch = new Hammer.Pinch();
        mc.add([pinch]);

        mc.on('pinchstart', () => {
          startZoom = zoom;
        });

        mc.on('pinchmove', (ev: any) => {
          if (typeof onSetZoom !== 'function') return;
          const scale = ev.scale || 1;
          const newZoom = Math.max(1, Math.min(3, startZoom * scale));
          onSetZoom(newZoom);
        });

        mc.on('pinchend', (ev: any) => {
          if (typeof onSetZoom !== 'function') return;
          const scale = ev.scale || 1;
          const finalZoom = Math.max(1, Math.min(3, startZoom * scale));
          onSetZoom(finalZoom);
        });
      } catch (err) {
        // If hammer fails to load, silently ignore - pinch won't be available
        // but other interactions still work.
        // eslint-disable-next-line no-console
        console.warn('Hammer.js pinch not available', err);
      }
    };

    if (open) setup();

    return () => {
      try {
        if (mc) {
          mc.stop();
          mc.destroy();
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [open, onSetZoom, zoom]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          outline: 'none'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            display: 'flex',
            gap: 1
          }}
        >
          <IconButton
            onClick={onZoomOut}
            disabled={zoom <= 1}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'black',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
            }}
          >
            <ZoomOutIcon />
          </IconButton>
          <IconButton
            onClick={onZoomIn}
            disabled={zoom >= 3}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'black',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
            }}
          >
            <ZoomInIcon />
          </IconButton>
          <IconButton
            onClick={onClose}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'black',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          ref={containerRef}
          sx={{
            overflow: 'hidden',
            width: '100vw',
            height: '100vh',
            cursor: zoom > 1 ? 'grab' : 'default',
            // Allow gesture library to receive touch events
            touchAction: 'none'
          }}
          onMouseMove={onMouseMove}
        >
          <img
            src={imageUrl}
            alt={altText}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `scale(${zoom}) translate(${-position.x}px, ${-position.y}px)`,
              transition: zoom === 1 ? 'transform 0.3s ease' : 'none',
              transformOrigin: 'center center',
              cursor: zoom > 1 ? 'zoom-out' : 'zoom-in'
            }}
            onClick={onImageClick}
          />
        </Box>

        {/* Zoom Level Indicator and Instructions */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {zoom > 1 && (
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'black',
                padding: '4px 12px',
                borderRadius: 1,
                fontSize: '0.875rem'
              }}
            >
              {Math.round(zoom * 100)}%
            </Box>
          )}
          <Box
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: 1,
              fontSize: '0.75rem',
              maxWidth: '200px'
            }}
          >
            Double-click to zoom in
            {zoom > 1 && <br />}
            {zoom > 1 && 'Click to zoom out'}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.open === nextProps.open &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y
  );
});

ProductImageModal.displayName = 'ProductImageModal';

export default ProductImageModal;