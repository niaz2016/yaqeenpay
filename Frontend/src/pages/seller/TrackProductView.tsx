import React from 'react';
import { usePageViewTracking } from '../../hooks/usePageViewTracking';

interface TrackProductViewProps {
  productId: string;
  sellerId: string;
}

const TrackProductView: React.FC<TrackProductViewProps> = ({ productId, sellerId }) => {
  usePageViewTracking({
    pageType: 'Product',
    productId,
    sellerId
  });
  return null;
};

export default TrackProductView;