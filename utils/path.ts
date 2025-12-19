
export const sanitizePageName = (name: string): string => {
  // Firebase Realtime Database forbidden characters: . $ # [ ] /
  // We replace / with - to support visual routes like /x/shortcuts while maintaining flat DB structure
  return name.replace(/[.#$[\]\s/]/g, '-').toLowerCase() || 'home';
};

export const getPageFromHash = (): string => {
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') return 'home';
  const rawPath = hash.replace(/^#\//, '');
  return sanitizePageName(rawPath);
};

export const setHashPage = (page: string) => {
  const sanitized = sanitizePageName(page);
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
