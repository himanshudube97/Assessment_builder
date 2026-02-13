import { describe, it, expect } from 'vitest';
import { hexWithAlpha, isLightColor, getCardClasses, getFontFamilyCSS } from './theme';

describe('hexWithAlpha', () => {
  it('converts 6-digit hex to rgba string', () => {
    expect(hexWithAlpha('#6366F1', 0.08)).toBe('rgba(99,102,241,0.08)');
  });

  it('converts 3-digit shorthand hex to rgba string', () => {
    expect(hexWithAlpha('#FFF', 1)).toBe('rgba(255,255,255,1)');
  });

  it('handles hex without # prefix', () => {
    expect(hexWithAlpha('000000', 0.5)).toBe('rgba(0,0,0,0.5)');
  });

  it('produces correct RGB values for known colors', () => {
    expect(hexWithAlpha('#FF0000', 1)).toBe('rgba(255,0,0,1)');
    expect(hexWithAlpha('#00FF00', 1)).toBe('rgba(0,255,0,1)');
    expect(hexWithAlpha('#0000FF', 1)).toBe('rgba(0,0,255,1)');
  });

  it('handles alpha of 0', () => {
    expect(hexWithAlpha('#000', 0)).toBe('rgba(0,0,0,0)');
  });
});

describe('isLightColor', () => {
  it('returns true for white (#FFFFFF)', () => {
    expect(isLightColor('#FFFFFF')).toBe(true);
  });

  it('returns true for light colors (#F8FAFC)', () => {
    expect(isLightColor('#F8FAFC')).toBe(true);
  });

  it('returns false for black (#000000)', () => {
    expect(isLightColor('#000000')).toBe(false);
  });

  it('returns false for dark colors (#0F172A)', () => {
    expect(isLightColor('#0F172A')).toBe(false);
  });

  it('handles 3-digit shorthand', () => {
    expect(isLightColor('#FFF')).toBe(true);
    expect(isLightColor('#000')).toBe(false);
  });

  it('correctly classifies indigo (#6366F1) as dark', () => {
    // Luminance: 0.2126*(99/255) + 0.7152*(102/255) + 0.0722*(241/255) ≈ 0.38
    expect(isLightColor('#6366F1')).toBe(false);
  });
});

describe('getCardClasses', () => {
  it('returns shadow classes for "elevated" style', () => {
    expect(getCardClasses('elevated')).toBe('shadow-md border-0');
  });

  it('returns border classes for "flat" style', () => {
    expect(getCardClasses('flat')).toContain('border');
  });

  it('returns border-2 for "bordered" style', () => {
    expect(getCardClasses('bordered')).toBe('border-2');
  });

  it('defaults to bordered for unknown style', () => {
    expect(getCardClasses('something-else')).toBe('border-2');
  });
});

describe('getFontFamilyCSS', () => {
  it('returns Inter CSS variable for "Inter"', () => {
    const result = getFontFamilyCSS('Inter');
    expect(result).toContain('--font-inter');
    expect(result).toContain('sans-serif');
  });

  it('returns Merriweather CSS variable for "Merriweather"', () => {
    const result = getFontFamilyCSS('Merriweather');
    expect(result).toContain('--font-merriweather');
    expect(result).toContain('serif');
  });

  it('returns Geist Sans CSS variable for "Geist Sans"', () => {
    const result = getFontFamilyCSS('Geist Sans');
    expect(result).toContain('--font-geist-sans');
  });

  it('defaults to Geist Sans for unknown font', () => {
    expect(getFontFamilyCSS('Comic Sans')).toBe(getFontFamilyCSS('Geist Sans'));
  });
});
