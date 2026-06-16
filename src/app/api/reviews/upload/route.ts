import { NextResponse } from 'next/server';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;
const GQL = `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/graphql.json`;

async function shopifyGql(query: string, variables: Record<string, unknown>) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const mimeType = file.type;
    const filename = file.name;
    const bytes = await file.arrayBuffer();
    const size = bytes.byteLength;

    // 1. Request a staged upload target from Shopify
    const stageRes = await shopifyGql(
      `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters { name value }
          }
          userErrors { field message }
        }
      }`,
      {
        input: [{
          filename,
          mimeType,
          httpMethod: 'POST',
          resource: 'IMAGE',
          fileSize: String(size),
        }],
      }
    );

    const target = stageRes?.data?.stagedUploadsCreate?.stagedTargets?.[0];
    if (!target) {
      return NextResponse.json({ error: 'Failed to get upload target' }, { status: 500 });
    }

    // 2. Upload the file to the staged target (Google Cloud Storage)
    const upload = new FormData();
    for (const { name, value } of target.parameters) {
      upload.append(name, value);
    }
    upload.append('file', new Blob([bytes], { type: mimeType }), filename);

    const uploadRes = await fetch(target.url, { method: 'POST', body: upload });
    if (!uploadRes.ok) {
      return NextResponse.json({ error: 'Upload to storage failed' }, { status: 500 });
    }

    // 3. Create the file in Shopify so it gets a CDN URL
    const createRes = await shopifyGql(
      `mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            ... on MediaImage {
              image { url }
            }
          }
          userErrors { field message }
        }
      }`,
      { files: [{ originalSource: target.resourceUrl, contentType: 'IMAGE' }] }
    );

    const cdnUrl: string | undefined =
      createRes?.data?.fileCreate?.files?.[0]?.image?.url;

    // Shopify sometimes takes a moment to process — fall back to resourceUrl which is also public
    const publicUrl = cdnUrl ?? target.resourceUrl;

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
