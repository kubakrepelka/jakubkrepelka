/* ═══════════════════════════════════════════════════════════════
   i18n — čeština / English
   ═══════════════════════════════════════════════════════════════

   Every visible string on both pages lives here, so the two languages
   can't drift apart. The markup is authored in Czech and carries the
   key that reaches back into this table:

     data-i18n           textContent
     data-i18n-content   content=""      (meta tags)
     data-i18n-href      href=""         (mailto subjects)
     data-i18n-label     aria-label=""
     data-i18n-suffix    dataset.suffix   ─┐ stat counters, read by
     data-i18n-scramble  dataset.scramble ─┘ the animation in main.js

   Switching fires a `langchange` event on `document` — main.js listens
   for it and re-splits the headlines it took apart for animation.
   ═══════════════════════════════════════════════════════════════ */

export const LANGS = ['cs', 'en'];
const STORE = 'jk-lang';

export const dict = {
  cs: {
    /* ── head ─────────────────────────────────────────────── */
    'meta.title': 'Jakub Křepelka — weby, aplikace a AI řešení',
    'meta.desc': 'Jakub Křepelka — tvořím weby, aplikace a AI řešení pro firmy i jednotlivce. Návrh, závazná cena předem, spuštění na vaší doméně a starost o web i potom.',
    'ref.meta.title': 'Reference — Jakub Křepelka',
    'ref.meta.desc': 'Připravuji první projekty. Tady bude jejich místo.',

    /* ── nav ──────────────────────────────────────────────── */
    'nav.focus': 'Zaměření',
    'nav.lang': 'Volba jazyka',
    'nav.lang.cs': 'Přepnout do češtiny',
    'nav.lang.en': 'Switch to English',

    /* ── 01 hero — the mark and the byline are names, so both languages
       carry them unchanged; only the pitch below them translates ─ */
    'hero.byline': 'Jakub Křepelka',
    'hero.sub': 'Tvorba webových stránek, aplikací a AI řešení',
    'hero.scroll': 'Scroll',

    /* ── 02 stats — sliby, ne reference ───────────────────── */
    'stat.1.suffix': ' h',
    'stat.1.label': 'první odpověď na poptávku',
    'stat.2.scramble': '0 Kč',
    'stat.2.label': 'úvodní konzultace a návrh',
    'stat.3.suffix': ' dní',
    'stat.3.label': 'typicky od zadání ke spuštění',
    'stat.4.suffix': ' %',
    'stat.4.label': 'kód na míru, žádné šablony',

    /* ── marquee ──────────────────────────────────────────── */
    'mq.1': 'Statické weby',
    'mq.2': 'Parallax',
    'mq.3': 'Scroll-cinematic',
    'mq.4': 'E-shopy',
    'mq.5': 'Rezervace',
    'mq.6': 'AI agenti',
    'mq.7': 'Automatizace',

    /* ── 02 zaměření ──────────────────────────────────────── */
    'focus.eyebrow': '02 — Digitální partner',
    'focus.title': 'Zaměření',
    'focus.soon': 'Již brzy',
    'focus.1.h': 'Webové stránky',
    'focus.1.p': 'pro firmy i jednotlivce',
    'focus.2.h': 'Aplikace',
    'focus.2.p': 'e-shopy, rezervace, objednávky nebo katalog',
    'focus.3.h': 'AI automatizace',
    'focus.3.p': 'ušetření času na opakujících se úkolech',
    'focus.4.h': 'AI školení',
    'focus.4.p': 'připravuji',

    /* ── 03 postup ────────────────────────────────────────── */
    'process.eyebrow': '03 — Postup',
    'process.title': 'Spolupráce',
    'process.1.h': 'Krátký hovor nebo schůzka',
    'process.1.p': 'V klidu probereme, co potřebujete a co od webu čekáte. Nezávazně a bez závazků.',
    'process.2.h': 'Připravím návrh',
    'process.2.p': 'Řešení, obsah i struktura a závazná cena předem.',
    'process.3.h': 'Postavíme',
    'process.3.p': 'Web nebo aplikace na míru. Vy se zatím věnujete své práci.',
    'process.4.h': 'Společně doladíme',
    'process.4.p': 'Ukážeme si hotové řešení a doladíme detaily, dokud nebudete spokojení.',
    'process.5.h': 'Spustíme',
    'process.5.p': 'Web na vaší doméně, hotový k použití.',
    'process.6.h': 'Postaráme se',
    'process.6.p': 'Zůstávám s vámi. Hosting, zálohy i budoucí úpravy jedou dál, ať máte klid.',

    /* ── 04 finále ────────────────────────────────────────── */
    'finale.eyebrow': '04 — Kontakt',
    'finale.title': 'Váš web nemusí být jen představa!',
    'finale.cta1': 'Pojďme do toho',
    'finale.cta2': 'Reference',
    'finale.mail': 'mailto:jk.krepjak@gmail.com?subject=Popt%C3%A1vka%20webu&body=Dobr%C3%BD%20den%2C%20r%C3%A1d%20bych%20probral...',

    /* ── footer ───────────────────────────────────────────── */
    'footer.email': 'E-mail',
    'footer.cookies': 'Cookies',
    'footer.built': 'Postaveno scrollem, ne slidy.',

    /* ── cookies ──────────────────────────────────────────── */
    'cookie.title': 'Cookies',
    'cookie.text': 'Měřím jen anonymní návštěvnost, bez cookies a bez reklamních skriptů. Když zvolíte jen nutné, neměřím ani to.',
    'cookie.accept': 'Souhlasím',
    'cookie.decline': 'Jen nutné',

    /* ── stránka reference ────────────────────────────────── */
    'ref.eyebrow': 'Portfolio',
    'ref.title': 'Reference',
    'ref.lead': 'Právě stavím první projekty. Zatím tu žádnou hotovou zakázku nenajdete — a vymýšlet si nebudu. Místa níže jsou volná a čekají na první klienty.',
    'ref.slot': 'Volné místo',
    'ref.placeholder': 'Místo pro váš projekt',
    'ref.1.h': 'Webové stránky',
    'ref.2.h': 'E-shop',
    'ref.3.h': 'Rezervační aplikace',
    'ref.4.h': 'AI automatizace',
    'ref.5.h': 'Scroll-cinematic web',
    'ref.prev': 'Předchozí',
    'ref.next': 'Další',
    'ref.cta.title': 'Chcete tu být první?',
    'ref.cta.text': 'První projekty beru s péčí, kterou si zaslouží — a s cenou, která to zohledňuje.',
    'ref.cta.btn': 'Pojďme do toho',
    'ref.cta.back': 'Zpět na web',

    /* ── navigace ─────────────────────────────────────────── */
    'nav.home': 'Domů',
    'nav.blog': 'Blog',
    'nav.faq': 'FAQ',

    /* ── stránka blog ─────────────────────────────────────── */
    'blog.meta.title': 'Blog — Jakub Křepelka',
    'blog.meta.desc': 'Zápisky o tom, jak weby vznikají — co funguje, co ne a proč.',
    'blog.eyebrow': 'Zápisky',
    'blog.title': 'Blog',
    'blog.lead': 'Jak weby vznikají — co funguje, co ne a proč. Bez marketingové omáčky.',
    'blog.empty.title': 'První článek se píše',
    'blog.empty.text': 'Zatím tu nic není. Až první text vyjde, objeví se přesně tady.',
    'blog.cta.title': 'Chcete vědět, až něco vyjde?',
    'blog.cta.text': 'Napište mi a dám vám vědět. Žádný spam, jen když bude co číst.',

    /* ── stránka FAQ ──────────────────────────────────────── */
    'faq.meta.title': 'Časté dotazy — Jakub Křepelka',
    'faq.meta.desc': 'Kolik to stojí, jak dlouho to trvá a co se děje po spuštění.',
    'faq.eyebrow': 'Časté dotazy',
    'faq.title': 'FAQ',
    'faq.lead': 'Otázky, které dostávám nejčastěji. Kdyby tu ta vaše nebyla, napište — odpovím do 24 hodin.',

    'faq.1.q': 'Kolik to stojí?',
    'faq.1.a': 'Ceník nemám, protože každý web je jinak velký. Po krátkém hovoru dostanete závaznou cenu předem a písemně — a ta platí až do konce. Hovor i návrh jsou zdarma a nezávazné.',
    'faq.2.q': 'Jak dlouho to trvá?',
    'faq.2.a': 'Typicky dva týdny od zadání ke spuštění. Jednoduchý web bývá hotový dřív, e-shop nebo aplikace potřebují víc času. Termín znáte předem, ne až během práce.',
    'faq.3.q': 'Co když nemám texty ani fotky?',
    'faq.3.a': 'Nevadí, to je běžné. Se strukturou i texty pomůžu a u fotek poradím, co zafunguje a co web spíš shodí.',
    'faq.4.q': 'Budu si to moct upravovat sám?',
    'faq.4.a': 'Podle toho, co budete chtít měnit. Když chcete spravovat obsah sami, postavím to tak a ukážu vám, jak na to — bez volání programátorovi kvůli každé větě.',
    'faq.5.q': 'Kdo se stará o hosting a zálohy?',
    'faq.5.a': 'Můžu se o to postarat. Hosting, zálohy i budoucí úpravy běží dál i po spuštění — rozsah si dohodneme dopředu, ať víte, do čeho jdete.',
    'faq.6.q': 'Potřebuju vlastní doménu?',
    'faq.6.a': 'Ano, web poběží na vaší doméně. Pokud ji ještě nemáte, vybereme ji spolu a zařídím ji za vás.',
    'faq.7.q': 'Děláte i e-shopy a aplikace?',
    'faq.7.a': 'Ano — e-shopy, rezervace, objednávkové systémy i katalogy. Co všechno stavím, je vypsané v sekci Zaměření.',
    'faq.8.q': 'Co když nebudu spokojený?',
    'faq.8.a': 'Hotové řešení si spolu projdeme a ladíme detaily, dokud sedět nebude. Proto se rozsah i cena domlouvají předem — víte, co dostanete, ještě než začnu.',

    'faq.cta.title': 'Nenašli jste svoji otázku?',
    'faq.cta.text': 'Zeptejte se rovnou. Odpovím do 24 hodin a nic vás to nestojí.',

    /* ── navigace ─────────────────────────────────────────── */
    'nav.refs': 'Reference',
    'nav.cta': 'Nezávazná poptávka',
    'nav.menu': 'Menu',
    'nav.menu.open': 'Otevřít menu',

    /* ── kontaktní formulář ───────────────────────────────── */
    'form.eyebrow': 'Kontakt',
    'form.title': 'Pojďme do toho',
    'form.text': 'Napište mi pár vět o tom, co potřebujete. Ozvu se do 24 hodin.',
    'form.name': 'Jméno',
    'form.name.ph': 'Jan Novák',
    'form.email': 'E-mail',
    'form.email.ph': 'jan@firma.cz',
    'form.msg': 'Co potřebujete?',
    'form.msg.ph': 'Potřebuji web pro…',
    'form.send': 'Odeslat',
    'form.or': 'Nebo mi napište přímo:',
    'form.close': 'Zavřít',
    'form.sent.eyebrow': 'Skoro hotovo',
    'form.sent.title': 'Otevřel se váš e-mail',
    'form.sent.text': 'Zpráva je předvyplněná ve vašem e-mailovém klientovi — stačí ji odeslat. Kdyby se nic neotevřelo, napište mi rovnou na adresu níž.',

    /* ── stránka zaměření ─────────────────────────────────── */
    'zam.meta.title': 'Zaměření — Jakub Křepelka',
    'zam.meta.desc': 'Weby, aplikace, AI automatizace a školení — co konkrétně stavím a kdy co dává smysl.',
    'zam.eyebrow': 'Co stavím',
    'zam.title': 'Zaměření',
    'zam.lead': 'Čtyři oblasti. U každé najdete, co konkrétně umím postavit — ať víte, do čeho jdete, ještě než se ozvete.',

    'zam.web.title': 'Webové stránky',
    'zam.web.lead': 'Od jednoduché vizitky po filmový zážitek. Vždycky na míru, bez šablon.',
    'zam.web.1.h': 'Jednoduchý statický web',
    'zam.web.1.p': 'Vizitka, služby, kontakt. Rychlý, levný a hotový během pár dní.',
    'zam.web.2.h': 'Animované weby s parallaxem',
    'zam.web.2.p': 'Vrstvy, které se hýbou se scrollem. Web, který působí draze.',
    'zam.web.3.h': '3D weby (Three.js, WebGL)',
    'zam.web.3.p': 'Skutečný prostor přímo v prohlížeči — produkt, který si návštěvník otočí v ruce.',
    'zam.web.4.h': 'Cinematic scroll weby',
    'zam.web.4.p': 'Filmová režie ve scrollu. Přesně jako tenhle web.',

    'zam.app.title': 'Aplikace',
    'zam.app.lead': 'Když web nestačí a potřebujete, aby něco doopravdy fungovalo.',
    'zam.app.1.h': 'E-shop',
    'zam.app.1.p': 'Prodej, sklad, platby i doprava. Napojený na to, co už používáte.',
    'zam.app.2.h': 'Rezervační systém',
    'zam.app.2.p': 'Kalendář, obsazenost, potvrzení e-mailem. Bez telefonování tam a zpět.',
    'zam.app.3.h': 'Objednávkový systém',
    'zam.app.3.p': 'Objednávka skončí tam, kde ji najdete — ne v přeplněné schránce.',
    'zam.app.4.h': 'Katalog',
    'zam.app.4.p': 'Produkty nebo služby, které si spravujete sami, bez volání programátorovi.',

    'zam.ai.title': 'AI automatizace',
    'zam.ai.lead': 'Opakující se práci zvládne stroj. Vy zůstanete u toho, co má smysl.',
    'zam.ai.1.h': 'Zpracování poptávek a e-mailů',
    'zam.ai.1.p': 'Roztřídit, shrnout, připravit odpověď k odeslání.',
    'zam.ai.2.h': 'Generování nabídek a dokumentů',
    'zam.ai.2.p': 'Z pár údajů hotový dokument — pokaždé stejně a bez překlepů.',
    'zam.ai.3.h': 'Napojení na tabulky a nástroje',
    'zam.ai.3.p': 'Data si putují sama mezi tím, co už ve firmě máte.',
    'zam.ai.4.h': 'Asistent na webu',
    'zam.ai.4.p': 'Odpovídá na časté dotazy vašimi slovy, ne obecnými frázemi.',

    'zam.edu.title': 'AI školení',
    'zam.edu.lead': 'Připravuji. Až bude hotové, najdete tady obsah i termíny.',

    'zam.cta.title': 'Nevíte, do které škatulky patříte?',
    'zam.cta.text': 'Nevadí. Napište mi, co potřebujete, a vymyslím, jak na to.',
  },

  en: {
    /* ── head ─────────────────────────────────────────────── */
    'meta.title': 'Jakub Křepelka — websites, apps and AI solutions',
    'meta.desc': 'Jakub Křepelka — I build websites, apps and AI solutions for companies and individuals. A proposal, a fixed price up front, launch on your domain and care for the site afterwards.',
    'ref.meta.title': 'References — Jakub Křepelka',
    'ref.meta.desc': "I'm building the first projects right now. This is where they'll live.",

    /* ── nav ──────────────────────────────────────────────── */
    'nav.focus': 'Focus',
    'nav.lang': 'Language',
    'nav.lang.cs': 'Přepnout do češtiny',
    'nav.lang.en': 'Switch to English',

    /* ── 01 hero ──────────────────────────────────────────── */
    'hero.byline': 'Jakub Křepelka',
    'hero.sub': 'Web development, apps and AI solutions',
    'hero.scroll': 'Scroll',

    /* ── 02 stats — promises, not a track record ──────────── */
    'stat.1.suffix': ' h',
    'stat.1.label': 'to my first reply',
    'stat.2.scramble': 'Free',
    'stat.2.label': 'first call and proposal',
    'stat.3.suffix': ' days',
    'stat.3.label': 'typical brief-to-launch time',
    'stat.4.suffix': '%',
    'stat.4.label': 'custom built, no templates',

    /* ── marquee ──────────────────────────────────────────── */
    'mq.1': 'Static sites',
    'mq.2': 'Parallax',
    'mq.3': 'Scroll-cinematic',
    'mq.4': 'E-shops',
    'mq.5': 'Bookings',
    'mq.6': 'AI agents',
    'mq.7': 'Automation',

    /* ── 02 focus ─────────────────────────────────────────── */
    'focus.eyebrow': '02 — Digital partner',
    'focus.title': 'Focus',
    'focus.soon': 'Coming soon',
    'focus.1.h': 'Websites',
    'focus.1.p': 'for companies and individuals alike',
    'focus.2.h': 'Apps',
    'focus.2.p': 'e-shops, bookings, orders or a catalogue',
    'focus.3.h': 'AI automation',
    'focus.3.p': 'time saved on the tasks that keep repeating',
    'focus.4.h': 'AI training',
    'focus.4.p': 'in preparation',

    /* ── 03 process ───────────────────────────────────────── */
    'process.eyebrow': '03 — Process',
    'process.title': 'How we work',
    'process.1.h': 'A short call or meeting',
    'process.1.p': "We'll talk through what you need and what you expect from the site. No strings attached.",
    'process.2.h': 'I put together a proposal',
    'process.2.p': 'The solution, the content and structure, and a fixed price up front.',
    'process.3.h': 'We build it',
    'process.3.p': 'A site or app made to measure. You get on with your own work.',
    'process.4.h': 'We fine-tune it together',
    'process.4.p': "We go through the finished thing and polish the details until you're happy.",
    'process.5.h': 'We launch',
    'process.5.p': 'Your site on your domain, ready to use.',
    'process.6.h': 'We look after it',
    'process.6.p': "I stay with you. Hosting, backups and future changes keep running, so you don't have to think about them.",

    /* ── 04 finale ────────────────────────────────────────── */
    'finale.eyebrow': '04 — Contact',
    'finale.title': "Your website doesn't have to stay an idea!",
    'finale.cta1': "Let's do it",
    'finale.cta2': 'References',
    'finale.mail': 'mailto:jk.krepjak@gmail.com?subject=Website%20enquiry&body=Hi%20Jakub%2C%20I%27d%20like%20to%20talk%20about...',

    /* ── footer ───────────────────────────────────────────── */
    'footer.email': 'Email',
    'footer.cookies': 'Cookies',
    'footer.built': 'Built with scroll, not slides.',

    /* ── cookies ──────────────────────────────────────────── */
    'cookie.title': 'Cookies',
    'cookie.text': 'I measure anonymous traffic only — no cookies, no advertising scripts. Choose essential only and I do not measure at all.',
    'cookie.accept': 'Accept',
    'cookie.decline': 'Essential only',

    /* ── references page ──────────────────────────────────── */
    'ref.eyebrow': 'Portfolio',
    'ref.title': 'References',
    'ref.lead': "I'm building the first projects right now. There's no finished client work here yet — and I'm not going to invent any. The slots below are open and waiting for the first clients.",
    'ref.slot': 'Open slot',
    'ref.placeholder': 'Room for your project',
    'ref.1.h': 'Website',
    'ref.2.h': 'E-shop',
    'ref.3.h': 'Booking app',
    'ref.4.h': 'AI automation',
    'ref.5.h': 'Scroll-cinematic site',
    'ref.prev': 'Previous',
    'ref.next': 'Next',
    'ref.cta.title': 'Want to be the first?',
    'ref.cta.text': 'The first projects get the care they deserve — and a price that reflects it.',
    'ref.cta.btn': "Let's do it",
    'ref.cta.back': 'Back to site',

    /* ── nav ──────────────────────────────────────────────── */
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.faq': 'FAQ',

    /* ── blog page ────────────────────────────────────────── */
    'blog.meta.title': 'Blog — Jakub Křepelka',
    'blog.meta.desc': 'Notes on how websites actually get made — what works, what doesn\'t, and why.',
    'blog.eyebrow': 'Notes',
    'blog.title': 'Blog',
    'blog.lead': "How websites actually get made — what works, what doesn't, and why. No marketing filler.",
    'blog.empty.title': 'The first piece is being written',
    'blog.empty.text': "Nothing here yet. When the first one lands, it'll show up right here.",
    'blog.cta.title': 'Want to know when something lands?',
    'blog.cta.text': "Drop me a line and I'll tell you. No spam — only when there's something worth reading.",

    /* ── FAQ page ─────────────────────────────────────────── */
    'faq.meta.title': 'FAQ — Jakub Křepelka',
    'faq.meta.desc': 'What it costs, how long it takes, and what happens after launch.',
    'faq.eyebrow': 'Common questions',
    'faq.title': 'FAQ',
    'faq.lead': "The questions I get asked most. If yours isn't here, write to me — I answer within 24 hours.",

    'faq.1.q': 'What does it cost?',
    'faq.1.a': "There's no price list, because no two sites are the same size. After a short call you get a fixed price up front and in writing — and it holds to the end. The call and the proposal are free and carry no obligation.",
    'faq.2.q': 'How long does it take?',
    'faq.2.a': 'Typically two weeks from brief to launch. A simple site is usually quicker; an e-shop or an app needs longer. You know the date up front, not halfway through.',
    'faq.3.q': "What if I don't have copy or photos?",
    'faq.3.a': "That's normal. I'll help with the structure and the copy, and I'll tell you which photos will work and which will drag the site down.",
    'faq.4.q': 'Will I be able to edit it myself?',
    'faq.4.a': "Depends what you want to change. If you want to manage the content yourself, I'll build it that way and show you how — no calling a developer over every sentence.",
    'faq.5.q': 'Who looks after hosting and backups?',
    'faq.5.a': "I can. Hosting, backups and future changes keep running after launch — we agree the scope up front so you know what you're getting.",
    'faq.6.q': 'Do I need my own domain?',
    'faq.6.a': "Yes, the site runs on your domain. If you don't have one yet, we'll pick it together and I'll sort it out for you.",
    'faq.7.q': 'Do you build e-shops and apps too?',
    'faq.7.a': "Yes — e-shops, bookings, order systems and catalogues. Everything I build is spelled out under Focus.",
    'faq.8.q': "What if I'm not happy with it?",
    'faq.8.a': "We go through the finished thing together and keep polishing until it sits right. That's why the scope and price are agreed up front — you know what you're getting before I start.",

    'faq.cta.title': "Didn't find your question?",
    'faq.cta.text': "Just ask. You'll have an answer within 24 hours and it costs you nothing.",

    /* ── nav ──────────────────────────────────────────────── */
    'nav.refs': 'References',
    'nav.cta': 'Start a project',
    'nav.menu': 'Menu',
    'nav.menu.open': 'Open menu',

    /* ── contact form ─────────────────────────────────────── */
    'form.eyebrow': 'Contact',
    'form.title': "Let's do it",
    'form.text': "Tell me a few sentences about what you need. I'll get back to you within 24 hours.",
    'form.name': 'Name',
    'form.name.ph': 'Jane Doe',
    'form.email': 'Email',
    'form.email.ph': 'jane@company.com',
    'form.msg': 'What do you need?',
    'form.msg.ph': 'I need a website for…',
    'form.send': 'Send',
    'form.or': 'Or email me directly:',
    'form.close': 'Close',
    'form.sent.eyebrow': 'Almost there',
    'form.sent.title': 'Your email app is open',
    'form.sent.text': "The message is waiting there, filled in — just hit send. If nothing opened, write to the address below instead.",

    /* ── focus page ───────────────────────────────────────── */
    'zam.meta.title': 'Focus — Jakub Křepelka',
    'zam.meta.desc': 'Websites, apps, AI automation and training — what I actually build, and when each one makes sense.',
    'zam.eyebrow': 'What I build',
    'zam.title': 'Focus',
    'zam.lead': "Four areas. Each one spells out what I can actually build — so you know what you're getting into before you get in touch.",

    'zam.web.title': 'Websites',
    'zam.web.lead': 'From a simple calling card to a full cinematic ride. Always custom, never a template.',
    'zam.web.1.h': 'Simple static site',
    'zam.web.1.p': 'Who you are, what you do, how to reach you. Fast, affordable, done in days.',
    'zam.web.2.h': 'Animated sites with parallax',
    'zam.web.2.p': 'Layers that move as you scroll. A site that feels expensive.',
    'zam.web.3.h': '3D sites (Three.js, WebGL)',
    'zam.web.3.p': 'Real space in the browser — a product the visitor can turn over in their hands.',
    'zam.web.4.h': 'Cinematic scroll sites',
    'zam.web.4.p': 'Film direction driven by the scrollbar. Exactly like this site.',

    'zam.app.title': 'Apps',
    'zam.app.lead': "For when a site isn't enough and something has to actually work.",
    'zam.app.1.h': 'E-shop',
    'zam.app.1.p': 'Selling, stock, payments and delivery. Wired into what you already use.',
    'zam.app.2.h': 'Booking system',
    'zam.app.2.p': 'Calendar, availability, confirmation emails. No more phone tag.',
    'zam.app.3.h': 'Order system',
    'zam.app.3.p': "Orders land where you'll find them — not in an overflowing inbox.",
    'zam.app.4.h': 'Catalogue',
    'zam.app.4.p': 'Products or services you keep up to date yourself, without calling a developer.',

    'zam.ai.title': 'AI automation',
    'zam.ai.lead': 'A machine can handle the work that repeats. You stay on the work that matters.',
    'zam.ai.1.h': 'Enquiries and email',
    'zam.ai.1.p': 'Sorted, summarised, and a reply drafted ready to send.',
    'zam.ai.2.h': 'Quotes and documents',
    'zam.ai.2.p': 'A few fields in, a finished document out — the same every time, no typos.',
    'zam.ai.3.h': 'Wiring up your tools',
    'zam.ai.3.p': 'Data moves itself between the systems you already have.',
    'zam.ai.4.h': 'Assistant on your site',
    'zam.ai.4.p': 'Answers the usual questions in your words, not in generic filler.',

    'zam.edu.title': 'AI training',
    'zam.edu.lead': "In the works. Once it's ready, the content and dates will be here.",

    'zam.cta.title': "Not sure which box you're in?",
    'zam.cta.text': "Doesn't matter. Tell me what you need and I'll work out how to do it.",
  },
};

/* ── storage is optional: private mode and locked-down browsers throw ── */
const store = {
  get() { try { return localStorage.getItem(STORE); } catch { return null; } },
  set(v) { try { localStorage.setItem(STORE, v); } catch { /* fine */ } },
};

/* stored choice → browser language → Czech */
export function preferredLang() {
  const saved = store.get();
  if (LANGS.includes(saved)) return saved;
  const nav = (navigator.languages || [navigator.language || '']).map(l => l.toLowerCase());
  return nav.some(l => l.startsWith('cs') || l.startsWith('sk')) ? 'cs'
    : nav.some(l => l.startsWith('en')) ? 'en'
    : 'cs';
}

export let lang = 'cs';

const attrs = [
  ['data-i18n-content', (el, v) => el.setAttribute('content', v)],
  ['data-i18n-href', (el, v) => el.setAttribute('href', v)],
  ['data-i18n-label', (el, v) => el.setAttribute('aria-label', v)],
  ['data-i18n-ph', (el, v) => el.setAttribute('placeholder', v)],
  ['data-i18n-suffix', (el, v) => { el.dataset.suffix = v; }],
  ['data-i18n-scramble', (el, v) => { el.dataset.scramble = v; }],
];

export function setLang(next, { persist = true } = {}) {
  if (!LANGS.includes(next)) next = 'cs';
  lang = next;
  const t = dict[next];

  document.documentElement.lang = next;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t[el.dataset.i18n];
    if (v != null) el.textContent = v;
  });
  for (const [attr, apply] of attrs) {
    document.querySelectorAll(`[${attr}]`).forEach(el => {
      const v = t[el.getAttribute(attr)];
      if (v != null) apply(el, v);
    });
  }

  document.querySelectorAll('[data-lang]').forEach(btn => {
    const on = btn.dataset.lang === next;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
  });

  if (persist) store.set(next);
  document.dispatchEvent(new CustomEvent('langchange', { detail: next }));
}

/* wires the CS / EN buttons and paints the first language */
export function initI18n() {
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  setLang(preferredLang(), { persist: false });
}
