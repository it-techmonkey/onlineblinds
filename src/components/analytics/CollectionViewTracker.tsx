'use client';

import { useEffect } from 'react';
import { trackShopifyCollectionView } from '@/lib/shopify-analytics';

interface CollectionViewTrackerProps {
  collectionId: string;
  collectionHandle: string;
}

const CollectionViewTracker = ({ collectionId, collectionHandle }: CollectionViewTrackerProps) => {
  useEffect(() => {
    trackShopifyCollectionView(collectionId, collectionHandle);
  }, [collectionId, collectionHandle]);

  return null;
};

export default CollectionViewTracker;
