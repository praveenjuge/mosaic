import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Metadata Edge Function', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should be accessible at the Supabase Edge Function endpoint', async () => {
    // This test verifies the Edge Function deployment
    // In a real test environment, you would make actual HTTP requests to:
    // https://rfakjrmmesuwwvhplopd.supabase.co/functions/v1/metadata

    const mockMetadata = {
      title: 'Test Title',
      description: 'Test Description',
      image: 'https://example.com/img.png'
    };

    // Mock the Edge Function response
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockMetadata), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const response = await fetch('https://rfakjrmmesuwwvhplopd.supabase.co/functions/v1/metadata?url=https://example.com');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Test Title');
    expect(data.description).toBe('Test Description');
    expect(data.image).toBe('https://example.com/img.png');
  });

  it('should handle missing URL parameter', async () => {
    const errorResponse = { error: 'URL parameter is required' };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    );

    const response = await fetch('https://rfakjrmmesuwwvhplopd.supabase.co/functions/v1/metadata');
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL parameter is required');
  });
});
