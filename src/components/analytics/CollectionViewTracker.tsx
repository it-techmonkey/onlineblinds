'use client';

import { useEffect } from 'react';
import { trackShopifyCollectionView } from '@/lib/shopify-analytics';
import { trackViewCollection, trackViewItemList } from '@/lib/gtm';
import type { Product } from '@/types';

interface CollectionViewTrackerProps {
  collectionId: string;
  collectionHandle: string;
  collectionName?: string;
  /** Products rendered in the listing, emitted as a GA4 `view_item_list`. */
  products?: Product[];
}

const CollectionViewTracker = ({
  collectionId,
  collectionHandle,
  collectionName,
  products,
}: CollectionViewTrackerProps) => {
  useEffect(() => {
    trackShopifyCollectionView(collectionId, collectionHandle);
    trackViewCollection(collectionHandle, collectionName || collectionHandle);
  }, [collectionId, collectionHandle, collectionName]);

  useEffect(() => {
    if (!products || products.length === 0) return;
    trackViewItemList(products, collectionHandle, collectionName || collectionHandle);
  }, [products, collectionHandle, collectionName]);

  return null;
};

export default CollectionViewTracker;
