import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
} from '@mui/material';
import {
  Share as ShareIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

interface ShareMenuProps {
  title: string;
  description?: string;
  image?: string;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ title, description }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const currentUrl = window.location.href;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || '');

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedDesc}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&description=${encodedDesc}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%0A${encodedDesc}%0A${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    handleClose();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setShowCopiedMessage(true);
      handleClose();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <IconButton onClick={handleClick} aria-label="share">
        <ShareIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleShare('facebook')}>
          <ListItemIcon>
            <FacebookIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleShare('twitter')}>
          <ListItemIcon>
            <TwitterIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Twitter</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleShare('whatsapp')}>
          <ListItemIcon>
            <WhatsAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={copyToClipboard}>
          <ListItemIcon>
            <LinkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar
        open={showCopiedMessage}
        autoHideDuration={2000}
        onClose={() => setShowCopiedMessage(false)}
        message="Link copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default ShareMenu;