import { notFound } from 'next/navigation';
import { Header, Footer, FAQ } from '@/components';
import CollectionViewTracker from '@/components/analytics/CollectionViewTracker';
import {
  fetchCategories,
  fetchProducts,
  fetchProductsByCategoryPage,
  fetchProductsForCollectionSlugs,
  transformProduct,
  extractFilterOptions,
  paginateApiProducts,
  sortApiProducts,
  CatalogSortOption,
  PaginationMeta,
} from '@/lib/api';
import { Product, ApiProduct } from '@/types';
import CategoryHero from '@/components/collection/CategoryHero';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';
import ComingSoon from '@/components/collection/ComingSoon';
import {
  ALL_COLLECTION_SLUGS,
  COLLECTION_DISPLAY_NAMES,
  COLLECTION_DESCRIPTIONS,
  CUSTOM_COLLECTION_FILTERS,
  NAVIGATION_CATEGORY_FILTERS,
  NAVIGATION_SLUG_MAPPING,
  NAVIGATION_TAG_FILTERS,
} from '@/data/navigation';

export const revalidate = 3_600;

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ page?: string; sort?: string }>;
}

function matchesCustomCollection(product: ApiProduct, categorySlug: string) {
  const filter = CUSTOM_COLLECTION_FILTERS[categorySlug];
  if (!filter) return false;

  const productTagSlugs = product.tags.map((tag) => tag.slug.toLowerCase());
  const productCategorySlugs = product.categories.map((cat) => cat.slug.toLowerCase());
  const productSlug = product.slug.toLowerCase();

  if (filter.productSlugsAny?.includes(productSlug)) {
    return true;
  }

  if (filter.tagsAll && !filter.tagsAll.every((tag) => productTagSlugs.includes(tag.toLowerCase()))) {
    return false;
  }

  if (filter.tagsAny && !filter.tagsAny.some((tag) => productTagSlugs.includes(tag.toLowerCase()))) {
    return false;
  }

  if (
    filter.categorySlugsAll &&
    !filter.categorySlugsAll.every((category) => productCategorySlugs.includes(category.toLowerCase()))
  ) {
    return false;
  }

  if (
    filter.categorySlugsAny &&
    !filter.categorySlugsAny.some((category) => productCategorySlugs.includes(category.toLowerCase()))
  ) {
    return false;
  }

  return true;
}

// Generate static params from all possible collection slugs
export async function generateStaticParams() {
  // Combine backend categories with frontend-defined slugs
  const slugs = new Set(ALL_COLLECTION_SLUGS);

  try {
    const categories = await fetchCategories();
    categories.forEach((cat) => slugs.add(cat.slug));
  } catch (error) {
    // Silently fail during build - backend may be unavailable
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching categories for static params:', error);
    }
  }

  return Array.from(slugs).map((category) => ({ category }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { category } = await params;

  // Try to get name from backend categories first
  try {
    const categories = await fetchCategories();
    const categoryData = categories.find((c) => c.slug === category);

    if (categoryData) {
      return {
        title: `${categoryData.name} | Online Blinds`,
        description: categoryData.description || `Browse our collection of ${categoryData.name.toLowerCase()}. Find the perfect blinds for your home.`,
      };
    }
  } catch {
    // Fall through to use display names
  }

  // Use frontend display names
  const displayName = COLLECTION_DISPLAY_NAMES[category] || category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    title: `${displayName} | Online Blinds`,
    description: `Browse our collection of ${displayName.toLowerCase()}. Find the perfect blinds for your home.`,
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { category: categorySlug } = await params;
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({} as { page?: string; sort?: string }));
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const sortBy = (resolvedSearchParams.sort as CatalogSortOption) || 'best-selling';
  const pageSize = 24;

  // Map frontend slug to backend slug if needed
  const mapCategorySlug = (slug: string): string => {
    let mappedSlug = slug;
    
    // First, check if this is a custom navigation slug
    if (NAVIGATION_SLUG_MAPPING[slug]) {
      mappedSlug = NAVIGATION_SLUG_MAPPING[slug];
    }

    // Backend uses 'day-and-night-blinds' (with 'and'), no conversion needed
    return mappedSlug;
  };

  // Validate the slug exists in our defined collections
  const isValidSlug = ALL_COLLECTION_SLUGS.includes(categorySlug);

  // Fetch categories from backend
  let backendCategories: Awaited<ReturnType<typeof fetchCategories>> = [];
  try {
    backendCategories = await fetchCategories();
  } catch (error) {
    // Silently fail during build - backend may be unavailable
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching categories:', error);
    }
  }

  // Find matching backend category using mapped slug
  const backendSlug = mapCategorySlug(categorySlug);
  const backendCategory = backendCategories.find((c) => c.slug === backendSlug);
  const hasCustomFilter = Boolean(CUSTOM_COLLECTION_FILTERS[categorySlug]);

  // If slug is not in our defined list AND not in backend, show 404
  if (!isValidSlug && !backendCategory && !hasCustomFilter) {
    notFound();
  }

  // Get display name (use custom name from COLLECTION_DISPLAY_NAMES if available)
  const categoryName = COLLECTION_DISPLAY_NAMES[categorySlug] || backendCategory?.name ||
    categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const categoryDescription = COLLECTION_DESCRIPTIONS[categorySlug]
    ?? backendCategory?.description
    ?? `Explore our beautiful collection of ${categoryName.toLowerCase()} for your home.`;

  // Fetch products if we have a backend category
  let apiProducts: ApiProduct[] = [];
  let products: Product[] = [];
  let pagination: PaginationMeta = {
    page,
    limit: pageSize,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  if (hasCustomFilter) {
    try {
      const customFilter = CUSTOM_COLLECTION_FILTERS[categorySlug];
      const canUseScopedCollectionFetch =
        Boolean(customFilter?.categorySlugsAny?.length) &&
        !customFilter?.tagsAny?.length &&
        !customFilter?.tagsAll?.length &&
        !customFilter?.productSlugsAny?.length &&
        !customFilter?.categorySlugsAll?.length;

      const sourceProducts = canUseScopedCollectionFetch
        ? await fetchProductsForCollectionSlugs(customFilter!.categorySlugsAny!)
        : (await fetchProducts()).data;

      const filteredProducts = sourceProducts.filter((product) => matchesCustomCollection(product, categorySlug));
      const sortedProducts = sortApiProducts(filteredProducts, sortBy);
      const paginated = paginateApiProducts(sortedProducts, page, pageSize);
      apiProducts = paginated.items;
      pagination = paginated.pagination;
      products = apiProducts.map(transformProduct);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching custom collection products:', error);
      }
    }
  } else if (backendCategory) {
    try {
      // Get required tags and categories for this navigation slug
      const requiredTags = NAVIGATION_TAG_FILTERS[categorySlug];
      const requiredCategories = NAVIGATION_CATEGORY_FILTERS[categorySlug];

      const response = await fetchProductsByCategoryPage({
        categorySlug: backendSlug,
        page,
        limit: pageSize,
        sortBy,
        requiredTags,
        requiredCategories,
      });
      apiProducts = response.data;
      pagination = response.pagination ?? pagination;
      products = apiProducts.map(transformProduct);
    } catch (error) {
      // Silently fail during build - backend may be unavailable
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching products:', error);
      }
    }
  }

  // Extract filter options from products
  const filterOptions = extractFilterOptions(apiProducts);

  // Check if we should show coming soon (no backend category or no products)
  const showComingSoon = (!backendCategory && !hasCustomFilter) || pagination.total === 0;

  // Pre-select motorization when browsing motorised collections
  const preselectedMotorization =
    categorySlug === 'motorised-roller-shades' ||
    categorySlug === 'motorised-dual-zebra-shades' ||
    categorySlug === 'motorised-eclipsecore' ||
    categorySlug === 'motorised-blinds';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <CollectionViewTracker
          collectionId={backendCategory?.id ? `gid://shopify/Collection/${backendCategory.id}` : `gid://shopify/Collection/${categorySlug}`}
          collectionHandle={categorySlug}
        />
        <CategoryHero
          title={categoryName}
          slug={categorySlug}
          description={categoryDescription}
          productCount={pagination.total}
        />

        <div className="flex flex-col gap-[32px] items-start max-w-[1280px] px-[24px] py-[40px] mx-auto w-full">
          {showComingSoon ? (
            <ComingSoon categoryName={categoryName} />
          ) : (
            <ProductGridWithFilters
              products={products}
              filterOptions={filterOptions}
              categoryName={categoryName}
              preselectedMotorization={preselectedMotorization}
              pagination={pagination}
              currentSort={sortBy}
              basePath={`/collections/${categorySlug}`}
            />
          )}
        </div>

        <FAQ />
      </main>

      <Footer />
    </div>
  );
}

