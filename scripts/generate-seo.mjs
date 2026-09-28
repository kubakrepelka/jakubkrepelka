import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contactMarkup } from '../shared/contact-markup.js';
import { dict } from '../src/i18n.js';
import { SITE_URL, seoPages, structuredData } from '../src/seo.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// Write Czech copy into the source documents too: direct HTML and production
// builds both work without JavaScript. Translation targets must be leaf nodes.
for (const page of seoPages) {
  const path = resolve(root, page.file);
  let html = await readFile(path, 'utf8');
  html = html.replace(/(<([\w-]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (match, start, tag, key, old, end) => {
      if (!(key in dict.cs)) throw new Error(`Missing Czech translation: ${key}`);
      return start + escape(dict.cs[key]) + end;
    });
  html = html.replace(/<meta\b[^>]*data-i18n-content="([^"]+)"[^>]*>/g,
    (tag, key) => tag.replace(/\scontent="[^"]*"/, ` content="${escape(dict.cs[key])}"`));
  const description = escape(dict.cs[page.key + '.desc']);
  const url = SITE_URL + page.path;
  const head = `<!-- SEO:generated -->
<link rel="canonical" href="${url}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Jakub Křepelka" />
<meta property="og:locale" content="cs_CZ" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="Jakub Křepelka" />
<meta property="og:description" data-i18n-content="${page.key}.desc" content="${description}" />
<meta property="og:image" content="${SITE_URL}/icon-512.png" />
<meta property="og:image:width" content="512" />
<meta property="og:image:height" content="512" />
<meta property="og:image:alt" content="Jakub Křepelka" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="Jakub Křepelka" />
<meta name="twitter:description" data-i18n-content="${page.key}.desc" content="${description}" />
<meta name="twitter:image" content="${SITE_URL}/icon-512.png" />
<script type="application/ld+json" id="structured-data">${JSON.stringify(structuredData(page, dict.cs)).replaceAll('<', '\\u003c')}</script>
<!-- /SEO:generated -->`;
  html = html.replace(/\n?<!-- SEO:generated -->[\s\S]*?<!-- \/SEO:generated -->\n?/g, '\n');
  html = html.replace('</head>', head + '\n</head>');
  html = html.replace(/\n?<!-- CONTACT:generated -->[\s\S]*?<!-- \/CONTACT:generated -->\n?/g, '\n');
  html = html.replace(/(<script type="module" src="\/src\/)/, `<!-- CONTACT:generated -->${contactMarkup}\n<!-- /CONTACT:generated -->\n$1`);
  await writeFile(path, html);
}

await writeFile(resolve(root, 'public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${seoPages.map(page => `  <url><loc>${SITE_URL}${page.path}</loc></url>`).join('\n')}
</urlset>\n`);
await writeFile(resolve(root, 'public/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`SEO HTML and sitemap generated for ${seoPages.length} pages.`);
