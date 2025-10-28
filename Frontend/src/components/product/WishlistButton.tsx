import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useWishlist } from '../../context/WishlistContext';
import type { ProductDetail } from '../../types/product';

interface WishlistButtonProps {
  product: ProductDetail;
  initialState?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ product, initialState }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isWishlisted, setIsWishlisted] = useState(initialState ?? isInWishlist(product.id));
  
  useEffect(() => {
    setIsWishlisted(isInWishlist(product.id));
  }, [product.id, isInWishlist]);

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <Tooltip title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}>
      <IconButton
        onClick={handleToggleWishlist}
        color={isWishlisted ? 'primary' : 'default'}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {isWishlisted ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default WishlistButton;