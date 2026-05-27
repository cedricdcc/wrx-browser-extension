export const normalizeTargetUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export const updateTargetHistory = (url: string) => {
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('target', url);
  window.history.pushState({ path: newUrl.toString() }, '', newUrl.toString());
};
