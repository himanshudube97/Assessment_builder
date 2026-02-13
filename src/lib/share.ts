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
 * Generate the embed URL for an assessment (stripped-down, iframe-friendly)
 */
export function getEmbedUrl(assessmentId: string): string {
  if (typeof window === 'undefined') {
    return `/embed/${assessmentId}`;
  }
  return `${window.location.origin}/embed/${assessmentId}`;
}

/**
 * Generate an inline iframe embed snippet
 */
export function getIframeEmbedCode(assessmentId: string): string {
  const url = getEmbedUrl(assessmentId);
  return `<iframe src="${url}" width="100%" height="600" style="border: 0; border-radius: 8px;"></iframe>`;
}

/**
 * Generate a popup embed snippet (button that opens assessment in a modal overlay)
 */
export function getPopupEmbedCode(assessmentId: string): string {
  const embedUrl = getEmbedUrl(assessmentId);
  return `<script>
(function() {
  var btn = document.createElement('button');
  btn.textContent = 'Take Assessment';
  btn.style.cssText = 'padding:12px 24px;background:#6366F1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-family:system-ui,sans-serif;';
  btn.onclick = function() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    var iframe = document.createElement('iframe');
    iframe.src = '${embedUrl}';
    iframe.style.cssText = 'width:90%;max-width:640px;height:80vh;border:none;border-radius:12px;';
    overlay.appendChild(iframe);
    overlay.onclick = function(e) { if(e.target===overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  };
  document.currentScript.parentNode.insertBefore(btn, document.currentScript);
})();
</script>`;
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
