import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'WRX Triple Viewer',
    version: '1.0.0',
    description: 'View the RDF source data of any URI.',
    omnibox: { keyword: 'wrx' },
    permissions: ['tabs'],
    host_permissions: ['<all_urls>'],
    browser_specific_settings: {
      gecko: {
        id: 'wrx-viewer@cedricdcc.com',
        strict_min_version: '109.0'
      }
    }
  }
});
