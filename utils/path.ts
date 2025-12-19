export const sanitizePageName = (name: string): string => {
  if (!name) return 'home';
  
  // Strip leading/trailing slashes, hashes and whitespace
  const trimmed = name.trim().replace(/^[#\/]+|[#\/]+$/g, '');
  
  if (!trimmed || trimmed.toLowerCase() === 'home') return 'home';

  // Firebase Realtime Database forbidden characters: . $ # [ ] /
  // We replace them with dashes and lowercase everything for consistency
  return trimmed.replace(/[.#$[\]\s/]/g, '-').toLowerCase();
};

export const getPageFromPath = (): string => {
  const hash = window.location.hash;
  
  // Remove the # and any leading slashes to get the clean page name
  // This handles both #/page and #page formats gracefully
  const cleanPath = hash.replace(/^#\/?/, '');
  
  if (!cleanPath || cleanPath.toLowerCase() === 'home') {
    return 'home';
  }
  
  return sanitizePageName(cleanPath);
};

export const setPathPage = (page: string) => {
  const sanitized = sanitizePageName(page);
  const newHash = sanitized === 'home' ? '#/' : `#/${sanitized}`;
  
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }
};

export const generateRandomPage = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const getCurrentURL = (): string => {
  return window.location.href;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Fallback for non-secure contexts or older browsers
    if (!navigator.clipboard) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};