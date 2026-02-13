import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getShareUrl,
  getEmbedUrl,
  getIframeEmbedCode,
  getPopupEmbedCode,
  getInviteShareUrl,
} from './share';

describe('getShareUrl', () => {
  it('returns relative path /a/:id when window is undefined (SSR)', () => {
    // In node env, window is undefined
    expect(getShareUrl('abc-123')).toBe('/a/abc-123');
  });
});

describe('getEmbedUrl', () => {
  it('returns relative path /embed/:id when window is undefined (SSR)', () => {
    expect(getEmbedUrl('abc-123')).toBe('/embed/abc-123');
  });
});

describe('getIframeEmbedCode', () => {
  it('returns iframe HTML with correct src URL', () => {
    const code = getIframeEmbedCode('test-id');
    expect(code).toContain('<iframe');
    expect(code).toContain('/embed/test-id');
  });

  it('includes width, height, and style attributes', () => {
    const code = getIframeEmbedCode('test-id');
    expect(code).toContain('width="100%"');
    expect(code).toContain('height="600"');
    expect(code).toContain('border: 0');
  });
});

describe('getPopupEmbedCode', () => {
  it('returns script tag with button creation code', () => {
    const code = getPopupEmbedCode('test-id');
    expect(code).toContain('<script>');
    expect(code).toContain('Take Assessment');
    expect(code).toContain('/embed/test-id');
  });

  it('uses provided primaryColor in button style', () => {
    const code = getPopupEmbedCode('test-id', '#FF0000');
    expect(code).toContain('#FF0000');
  });

  it('defaults to #6366F1 when no color provided', () => {
    const code = getPopupEmbedCode('test-id');
    expect(code).toContain('#6366F1');
  });
});

describe('getInviteShareUrl', () => {
  it('appends ?invite=TOKEN to the share URL', () => {
    const url = getInviteShareUrl('assess-1', 'tok-abc');
    expect(url).toContain('/a/assess-1');
    expect(url).toContain('?invite=tok-abc');
  });
});
