import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'STITCH - Site Topology & Interconnectivity Trace CHain',
    version: '1.0.0',
    description: 'A premium Site Topology & Interconnectivity Trace CHain framework.',
    omnibox: { keyword: 'stitch' },
    permissions: ['tabs', 'scripting'],
    host_permissions: ['<all_urls>'],
    browser_specific_settings: {
      gecko: {
        id: 'stitch-viewer@cedricdcc.com',
        strict_min_version: '109.0'
      }
    }
  }
});
