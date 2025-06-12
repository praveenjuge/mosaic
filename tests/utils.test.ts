import { describe, it, expect } from 'vitest';
import { cleanUrl, parseBytes, formatBytes, extractUrlPartsConsistent } from '@/lib/utils';

// Tests for utility functions in lib/utils.ts

describe('cleanUrl', () => {
  it('returns hostname for full URL', () => {
    expect(cleanUrl('https://example.com/path')).toBe('example.com');
  });

  it('handles missing protocol', () => {
    expect(cleanUrl('example.com/test')).toBe('example.com');
  });

  it('trims whitespace', () => {
    expect(cleanUrl('  https://example.com  ')).toBe('example.com');
  });

  it('returns input for invalid url', () => {
    expect(cleanUrl('not a url')).toBe('not a url');
  });

  it('returns empty string when given empty input', () => {
    expect(cleanUrl('')).toBe('');
  });
});

describe('parseBytes', () => {
  it('parses various units correctly', () => {
    expect(parseBytes('1 KB')).toBe(1024);
    expect(parseBytes('1.5 MB')).toBe(1572864);
    expect(parseBytes('2 gb')).toBe(2147483648);
  });

  it('returns null for empty input', () => {
    expect(parseBytes('')).toBeNull();
  });

  it('throws on invalid format', () => {
    expect(() => parseBytes('abc')).toThrow();
    expect(() => parseBytes('10 XB')).toThrow();
  });
});

describe('formatBytes', () => {
  it('formats bytes with default decimals', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('handles zero bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('respects decimals parameter', () => {
    expect(formatBytes(1500, 0)).toBe('1 KB');
  });
});

describe('extractUrlPartsConsistent', () => {
  it('parses full URL into parts', () => {
    const parts = extractUrlPartsConsistent('https://example.com/path?x=1#y');
    expect(parts).toEqual({
      urlBase: 'example.com',
      path: '/path?x=1#y',
      hostname: 'example.com',
    });
  });

  it('falls back when protocol is missing', () => {
    const parts = extractUrlPartsConsistent('example.com/path');
    expect(parts).toEqual({
      urlBase: 'example.com',
      path: '/',
      hostname: 'example.com',
    });
  });

  it('handles completely invalid url', () => {
    const parts = extractUrlPartsConsistent('not a url');
    expect(parts).toEqual({
      urlBase: 'not a url',
      path: '/',
      hostname: 'not a url',
    });
  });
});
