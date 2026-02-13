/**
 * Share Utilities
 * Helper functions for generating share links and copying to clipboard
 */

/**
 * Generate the public share URL for an assessment
 */
export function getShareUrl(assessmentId: string): string {
  if (typeof window === 'undefined') {
    return `/a/${assessmentId}`;
  }
  return `${window.location.origin}/a/${assessmentId}`;
}

/**
 * Copy text to clipboard
 * Returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr);
      return false;
    }
  }
}
