import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  browser.omnibox.onInputEntered.addListener((text) => {
    let targetUrl = text.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const viewerUrl = browser.runtime.getURL(`/viewer.html?target=${encodeURIComponent(targetUrl)}`);

    browser.tabs.create({ url: viewerUrl });
  });
});
