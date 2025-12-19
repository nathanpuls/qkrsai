
export const sanitizePageName = (name: string): string => {
  if (!name) return 'home';
  
  // First, strip leading and trailing slashes and whitespace
  // This makes "/a", "a/", and "a" all point to the same page "a"
  const trimmed = name.trim().replace(/^\/+|\/+$/g, '');
  
  if (!trimmed || trimmed.toLowerCase() === 'home') return 'home';

  // Firebase Realtime Database forbidden characters: . $ # [ ] /
  // We replace these with - to maintain a flat DB structure
  return trimmed.replace(/[.#$[\]\s/]/g, '-').toLowerCase();
};

export const getPageFromHash = (): string => {
  const hash = window.location.hash;
  // Handle empty hash, #, #/, or #/home
  if (!hash || hash === '#' || hash === '#/') return 'home';
  
  // Support both #/page and #page
  const rawPath = hash.startsWith('#/') ? hash.substring(2) : hash.substring(1);
  return sanitizePageName(rawPath);
};

export const setHashPage = (page: string) => {
  const sanitized = sanitizePageName(page);
  // We use / prefix for a cleaner look in the URL: #/page-name
  window.location.hash = `/${sanitized === 'home' ? '' : sanitized}`;
};

export const generateRandomPage = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const getCurrentURL = (): string => {
  try {
    return window.top?.location.href || window.location.href;
  } catch (e) {
    return window.location.href;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};
