/**
 * Theme utility functions for the respondent-facing assessment UI
 */

/**
 * Normalize a hex color to 6-digit format and append an alpha byte.
 * e.g. hexWithAlpha('#6366F1', 0.08) → 'rgba(99,102,241,0.08)'
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Determine if a hex color is "light" (luminance > 0.5).
 * Used to decide text color on arbitrary backgrounds.
 */
export function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;
  // Relative luminance (sRGB)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5;
}

/**
 * Get Tailwind classes for question option cards based on cardStyle.
 */
export function getCardClasses(style: string): string {
  switch (style) {
    case 'elevated':
      return 'shadow-md border-0';
    case 'flat':
      return 'border border-slate-200 dark:border-slate-700';
    case 'bordered':
    default:
      return 'border-2';
  }
}

/**
 * Map font family name to CSS font-family value.
 */
export function getFontFamilyCSS(fontFamily: string): string {
  switch (fontFamily) {
    case 'Inter':
      return 'var(--font-inter), system-ui, sans-serif';
    case 'Merriweather':
      return 'var(--font-merriweather), Georgia, serif';
    case 'Geist Sans':
    default:
      return 'var(--font-geist-sans), system-ui, sans-serif';
  }
}
