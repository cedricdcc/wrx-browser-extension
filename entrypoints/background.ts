import { defineBackground } from 'wxt/sandbox';

const normalizeTargetUrl = (text: string): string | null => {
  const trimmedText = text.trim();
  const withProtocol =
    trimmedText.startsWith('http://') || trimmedText.startsWith('https://')
      ? trimmedText
      : `https://${trimmedText}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export default defineBackground(() => {
  browser.omnibox.onInputEntered.addListener((text) => {
    const targetUrl = normalizeTargetUrl(text);
    if (!targetUrl) {
      return;
    }

    const viewerUrl = browser.runtime.getURL(`/viewer.html?target=${encodeURIComponent(targetUrl)}`);

    browser.tabs.create({ url: viewerUrl });
  });
});
