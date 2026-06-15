import { NextResponse } from 'next/server';

const JUDGEME_API = 'https://judge.me/api/v1';
const API_TOKEN = process.env.JUDGEME_API_TOKEN!;
const SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN!;

async function getJudgeMeExternalId(handle: string): Promise<number | null> {
  const res = await fetch(
    `${JUDGEME_API}/products/-1?api_token=${API_TOKEN}&shop_domain=${SHOP_DOMAIN}&handle=${encodeURIComponent(handle)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  // Judge.me review creation needs the Shopify product ID (external_id), not the Judge.me internal id
  return data?.product?.external_id ?? null;
}

export async function POST(req: Request) {
  try {
    const { handle, name, email, rating, title, body, pictureUrls } = await req.json();

    if (!handle || !name || !email || !rating || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const externalId = await getJudgeMeExternalId(handle);
    if (!externalId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const res = await fetch(`${JUDGEME_API}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_token: API_TOKEN,
        shop_domain: SHOP_DOMAIN,
        platform: 'shopify',
        id: externalId,
        email,
        name,
        rating,
        title: title || '',
        body,
        picture_urls: Array.isArray(pictureUrls) ? pictureUrls : [],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to submit review' }, { status: res.status });
    }

    return NextResponse.json({ success: true, review: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
