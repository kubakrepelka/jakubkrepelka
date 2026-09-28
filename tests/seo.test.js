import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { dict, preferredLang } from '../src/i18n.js';
import { SITE_URL, seoPages } from '../src/seo.js';

const root = resolve(import.meta.dirname, '..');
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const text = html => decode(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const htmlPages = async directory => Promise.all(seoPages.map(async page => ({ ...page, html: (await readFile(resolve(root, directory, page.file), 'utf8')).replace(/<!--[\s\S]*?-->/g, '') })));
const metadata = (html, attribute, value) => {
  const tag = html.match(new RegExp(`<meta\\b[^>]*${attribute}="${value}"[^>]*>`))?.[0];
  return decode(tag?.match(/\scontent="([^"]*)"/)?.[1] || '');
};

for (const directory of ['.', 'dist']) {
  test(`${directory}: every public page has unique SEO and complete static copy`, async () => {
    const pages = await htmlPages(directory);
    const titles = new Set(), descriptions = new Set(), headings = new Set();
    for (const page of pages) {
      const { html } = page;
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
      assert.equal(h1s.length, 1, page.path + ': one H1');
      const heading = text(h1s[0][1]);
      assert.equal(heading, dict.cs[page.heading]);
      headings.add(heading);
      const title = text(html.match(/<title\b[^>]*>(.*?)<\/title>/s)[1]);
      const desc = metadata(html, 'name', 'description');
      assert.equal(title, dict.cs[page.key + '.title']);
      assert.ok(desc.length > 70 && desc.length < 200, page.path + ': useful description');
      titles.add(title); descriptions.add(desc);
      assert.equal([...html.matchAll(/<link\b[^>]*rel="canonical"/g)].length, 1);
      assert.ok(html.includes(`rel="canonical" href="${SITE_URL}${page.path}"`));
      assert.equal(metadata(html, 'property', 'og:url'), SITE_URL + page.path);
      assert.equal(metadata(html, 'property', 'og:title'), 'Jakub Křepelka');
      assert.equal(metadata(html, 'property', 'og:description'), desc);
      assert.ok(metadata(html, 'property', 'og:image').startsWith(SITE_URL + '/'));
      assert.equal([...html.matchAll(/<meta\b[^>]*name="robots"/g)].length, 1);
      assert.match(metadata(html, 'name', 'robots'), /^index, follow/);
      assert.doesNotMatch(html, /\bnoindex\b|\bnofollow\b|javascript:/i);
      assert.doesNotMatch(html, /data-i18n="[^"]+"[^>]*>\s*—\s*</);
      for (const match of html.matchAll(/<([\w-]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>([^<]*)<\/\1>/g)) {
        assert.equal(decode(match[3]), dict.cs[match[2]], `${page.path}: ${match[2]} available without JS`);
      }
      let previous = 0;
      for (const match of html.matchAll(/<h([1-6])\b/g)) {
        const level = Number(match[1]);
        assert.ok(level <= previous + 1, `${page.path}: heading level ${previous} → ${level}`);
        previous = level;
      }
      assert.equal([...html.matchAll(/<dialog\b[^>]*id="contact"/g)].length, 1);
      assert.ok(html.includes('href="/#finale"'), page.path + ': crawlable contact');
      const graph = JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1])['@graph'];
      assert.ok(graph.some(entity => entity['@type'] === 'Organization' && entity.email === 'info@jkweby.cz'));
      if (page.path === '/faq/') {
        const faq = graph.find(entity => entity['@type'] === 'FAQPage');
        assert.equal(faq.mainEntity.length, 8);
        const questions = [...html.matchAll(/class="qa__q"[^>]*>([\s\S]*?)<\/summary>/g)].map(match => text(match[1]));
        const answers = [...html.matchAll(/class="qa__a"[^>]*>([\s\S]*?)<\/p>/g)].map(match => text(match[1]));
        assert.deepEqual(questions, faq.mainEntity.map(entry => entry.name));
        assert.deepEqual(answers, faq.mainEntity.map(entry => entry.acceptedAnswer.text));
      }
      for (const target of seoPages) {
        if (target.path === page.path) continue;
        assert.ok(html.includes(`href="${target.path}"`), `${page.path} links to ${target.path}`);
      }
      for (const match of html.matchAll(/\bhref="(\/[^\"]*)"/g)) {
        const url = new URL(decode(match[1]), SITE_URL);
        const target = pages.find(page => page.path === url.pathname);
        if (target) {
          if (url.hash) assert.ok(target.html.includes(`id="${url.hash.slice(1)}"`), 'existing anchor ' + match[1]);
        } else {
          await access(resolve(root, directory === '.' && !url.pathname.startsWith('/src/') ? 'public' : directory, '.' + url.pathname));
        }
      }
    }
    assert.equal(titles.size, pages.length);
    assert.equal(descriptions.size, pages.length);
    assert.equal(headings.size, pages.length);
    const home = pages.find(page => page.path === '/').html;
    assert.equal(text(home.match(/<title\b[^>]*>(.*?)<\/title>/s)[1]), 'Jakub Křepelka');
    assert.deepEqual([...home.matchAll(/class="stat__final">([^<]+)</g)].map(match => match[1]), ['24 h', '0 Kč', '14 dní', '100 %']);
    assert.ok(home.includes('<h1 class="hero__name"'), 'brand retains its visual class');
    assert.match(home, /<noscript><style>#loader\s*\{\s*display:\s*none;?\s*\}<\/style><\/noscript>/, 'no-JS fallback overrides loader class');
  });
  test(`${directory}: sitemap includes only canonical public pages and robots permits crawling`, async () => {
    const folder = directory === '.' ? 'public' : directory;
    const xml = await readFile(resolve(root, folder, 'sitemap.xml'), 'utf8');
    assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), seoPages.map(page => SITE_URL + page.path));
    const robots = await readFile(resolve(root, folder, 'robots.txt'), 'utf8');
    assert.match(robots, /User-agent: \*\nAllow: \/\n/);
    assert.ok(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
    assert.doesNotMatch(robots, /Disallow:\s*\/\s*$/m);
  });
}

test('English browser language does not replace the canonical Czech content', () => {
  assert.equal(preferredLang(), 'cs');
});

test('contact is a permanent alias, not a duplicate page', async () => {
  const config = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
  assert.equal(config.trailingSlash, true);
  assert.ok(config.redirects.some(rule => rule.source === '/kontakt' && rule.destination === '/#finale' && rule.permanent));
  assert.ok(!seoPages.some(page => page.path === '/kontakt'));
});
