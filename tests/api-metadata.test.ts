import { GET } from '../app/api/demo/metadata/route';
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const makeRequest = (url: string) => new NextRequest(url);

describe('GET /api/demo/metadata', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 if url param missing', async () => {
    const req = makeRequest('https://test.com/api/demo/metadata');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('extracts metadata from page', async () => {
    const html = `<html><head>
      <meta property="og:title" content="Test Title" />
      <meta property="og:description" content="Test Description" />
      <meta property="og:image" content="/img.png" />
    </head></html>`;
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(html, { status: 200, headers: { 'content-type': 'text/html' } })
    );

    const req = makeRequest('https://test.com/api/demo/metadata?url=https://example.com');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Test Title');
    expect(data.description).toBe('Test Description');
    expect(data.image).toBe('https://example.com/img.png');
  });
});
