// One route inventory for Vite, metadata, structured data and the sitemap.
export const SITE_URL = 'https://jkweby.cz';
export const seoPages = [
  { path: '/', file: 'index.html', key: 'meta', heading: 'hero.sub' },
  { path: '/tvorba-webovych-stranek/', file: 'tvorba-webovych-stranek/index.html', key: 'web.meta', heading: 'web.title' },
  { path: '/webove-aplikace/', file: 'webove-aplikace/index.html', key: 'app.meta', heading: 'app.title' },
  { path: '/ai-automatizace/', file: 'ai-automatizace/index.html', key: 'ai.meta', heading: 'ai.title' },
  { path: '/ai-skoleni/', file: 'ai-skoleni/index.html', key: 'edu.meta', heading: 'edu.title' },
  { path: '/reference/', file: 'reference/index.html', key: 'ref.meta', heading: 'ref.title' },
  { path: '/blog/', file: 'blog/index.html', key: 'blog.meta', heading: 'blog.title' },
  { path: '/faq/', file: 'faq/index.html', key: 'faq.meta', heading: 'faq.title' },
];

export function structuredData(page, translations, language = 'cs') {
  const url = SITE_URL + page.path;
  const organization = {
    '@type': 'Organization', '@id': SITE_URL + '/#organization',
    name: 'JK WEBY', url: SITE_URL + '/',
    logo: SITE_URL + '/icon-512.png', email: 'info@jkweby.cz',
    founder: { '@type': 'Person', name: 'Jakub Křepelka' },
    sameAs: ['https://www.instagram.com/jk_weby/'],
  };
  const webpage = {
    '@type': page.path === '/faq/' ? 'FAQPage' : 'WebPage',
    '@id': url + '#webpage', url,
    name: translations[page.key + '.title'],
    description: translations[page.key + '.desc'],
    inLanguage: language,
    isPartOf: { '@id': SITE_URL + '/#website' },
    about: { '@id': organization['@id'] },
  };
  if (page.path === '/faq/') {
    webpage.mainEntity = Object.keys(translations)
      .filter(key => /^faq\.\d+\.q$/.test(key))
      .map(key => ({
        '@type': 'Question', name: translations[key],
        acceptedAnswer: { '@type': 'Answer', text: translations[key.replace(/\.q$/, '.a')] },
      }));
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [organization, {
      '@type': 'WebSite', '@id': SITE_URL + '/#website',
      url: SITE_URL + '/', name: 'JK WEBY',
      publisher: { '@id': organization['@id'] },
    }, webpage],
  };
}
