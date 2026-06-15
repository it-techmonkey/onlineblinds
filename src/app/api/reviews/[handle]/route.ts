import { NextResponse } from 'next/server';

const JUDGEME_API = 'https://judge.me/api/v1';
const API_TOKEN = process.env.JUDGEME_API_TOKEN!;
const SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN!;

export interface JudgeMeReview {
  id: number;
  title: string;
  body: string;
  rating: number;
  reviewer: { name: string; email: string };
  created_at: string;
  pictures: { urls: { original: string; small: string } }[];
  verified: boolean;
}

export interface JudgeMeReviewsResponse {
  averageRating: number;
  totalReviews: number;
  ratingCounts: { rating: number; count: number }[];
  reviews: JudgeMeReview[];
}

async function getJudgeMeProduct(handle: string): Promise<{ id: number; external_id: number } | null> {
  const res = await fetch(
    `${JUDGEME_API}/products/-1?api_token=${API_TOKEN}&shop_domain=${SHOP_DOMAIN}&handle=${encodeURIComponent(handle)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const p = data?.product;
  if (!p?.id) return null;
  return { id: p.id, external_id: p.external_id };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  const product = await getJudgeMeProduct(handle);
  if (!product) {
    return NextResponse.json<JudgeMeReviewsResponse>({
      averageRating: 0,
      totalReviews: 0,
      ratingCounts: [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: 0 })),
      reviews: [],
    });
  }

  // Fetch up to 150 reviews (paginate two pages of 75)
  const fetchPage = async (page: number) => {
    const res = await fetch(
      `${JUDGEME_API}/reviews?api_token=${API_TOKEN}&shop_domain=${SHOP_DOMAIN}&product_id=${product.id}&per_page=75&page=${page}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.reviews ?? []) as JudgeMeReview[];
  };

  const [page1, page2] = await Promise.all([fetchPage(1), fetchPage(2)]);
  const allReviews = [...page1, ...page2];

  const totalReviews = allReviews.length;
  const averageRating =
    totalReviews === 0
      ? 0
      : Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10;

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: allReviews.filter((r) => r.rating === rating).length,
  }));

  return NextResponse.json<JudgeMeReviewsResponse>({
    averageRating,
    totalReviews,
    ratingCounts,
    reviews: allReviews,
  });
}
