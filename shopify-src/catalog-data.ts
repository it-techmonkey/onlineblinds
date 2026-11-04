let catalogPromise: Promise<any> | undefined;
export function catalogData() {
  return catalogPromise ||= fetch(window.OnlineBlinds.catalogData).then(r => {
    if (!r.ok) throw new Error('Catalog unavailable');
    return r.json();
  }).then(data => {
    // Collection/search/related cards share this older content snapshot. Resolve
    // prices from the current Liquid map, also used by product pages, before any
    // consumer sorts or renders products. A price sync need not refresh content.
    for (const handle of Object.keys(data.products)) {
      const price = window.OnlineBlinds?.minimumPrices?.[handle];
      if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
        data.products[handle].price = price;
      }
    }
    return data;
  }).catch(error => { catalogPromise = undefined; throw error; });
}
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {status, headers: {'Content-Type': 'application/json'}});

// Same checks and fields as the live site's POST /api/reviews. Judge.me's public
// review endpoint (the one its own widget uses) needs no private token. It is sent
// form-encoded because Judge.me does not answer CORS preflight requests.
async function submitReview({handle, name, email, rating, title, body}: any) {
  if (!handle || !name || !email || !rating || !body) return json({error: 'Missing required fields'}, 400);
  if (rating < 1 || rating > 5) return json({error: 'Rating must be between 1 and 5'}, 400);
  const productId = String((await catalogData()).products[handle]?.id || '').split('/').pop();
  if (!productId) return json({error: 'Product not found'}, 404);
  const form = new URLSearchParams({shop_domain: window.Shopify?.shop || 'online-blinds-express.myshopify.com', platform: 'shopify', id: productId, email, name, rating: String(rating), title: title || '', body});
  const res = await fetch('https://judge.me/api/v1/reviews', {method: 'POST', body: form});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({error: data?.message ?? 'Failed to submit review'}, res.status);
  return json({success: true, review: data});
}

let reviewsPromise: Promise<any> | undefined;
export async function reviewFetch(input: string, init?: RequestInit) {
  if (input === '/api/reviews' && init?.method === 'POST') return submitReview(JSON.parse(String(init.body)));
  if (!input.startsWith('/api/reviews/')) throw new Error('Unsupported endpoint in the Shopify theme');
  const data = await (reviewsPromise ||= fetch(window.OnlineBlinds.reviewsData).then(r => {
    if (!r.ok) throw new Error('Reviews unavailable');
    return r.json();
  }).catch(error => { reviewsPromise = undefined; throw error; }));
  const handle = decodeURIComponent(input.slice('/api/reviews/'.length));
  return json(data.products[handle] || {averageRating:0,totalReviews:0,ratingCounts:[5,4,3,2,1].map(rating=>({rating,count:0})),reviews:[]});
}
