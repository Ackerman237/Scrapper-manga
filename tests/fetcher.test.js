import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJSON } from '../lib/scraper/fetcher.js';

describe('fetchJSON', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns response on success', async () => {
    const mockResponse = { ok: true, status: 200 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await fetchJSON('https://example.com/api');
    expect(result).toBe(mockResponse);
  });

  it('retries on timeout (AbortError)', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    const successResponse = { ok: true, status: 200 };

    const mockFetch = vi.fn()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValue(successResponse);
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchJSON('https://example.com/api', { retries: 2 });
    expect(result).toBe(successResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 502/503/504', async () => {
    const successResponse = { ok: true, status: 200 };

    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('HTTP 502'))
      .mockResolvedValue(successResponse);
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchJSON('https://example.com/api', { retries: 2 });
    expect(result).toBe(successResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 400', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('HTTP 400'));
    vi.stubGlobal('fetch', mockFetch);

    await expect(fetchJSON('https://example.com/api', { retries: 2 }))
      .rejects.toThrow('HTTP 400');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 401', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('HTTP 401'));
    vi.stubGlobal('fetch', mockFetch);

    await expect(fetchJSON('https://example.com/api', { retries: 2 }))
      .rejects.toThrow('HTTP 401');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('gives up after max retries', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    const mockFetch = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal('fetch', mockFetch);

    await expect(fetchJSON('https://example.com/api', { retries: 2 }))
      .rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
