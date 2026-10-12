// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// `site` is the deployed origin: GitHub Pages user site, served at the root,
// so no `base` and none of the absolute "/…" hrefs need rewriting. It feeds
// every page's canonical URL and og:url (Workspace.astro).
export default defineConfig({
  site: 'https://viceatlas.github.io',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
