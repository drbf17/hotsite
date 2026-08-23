// Validates the "agentic-first-sdlc" presentation against the acceptance
// criteria in agent-handoffs/specs/agentic-first-sdlc/agentic-first-sdlc.v0.raw.md,
// plus the editorial invariants agreed during review (no exact numeric claims,
// no em-dashes, only Uncle Bob and Matt Pocock named as sources).
//
// NOTE ON PROVENANCE: that spec is the v0 RAW spec, not a sealed one — the
// spec-judge grilling stopped at iteration 1 (avg 0.41 / max 0.70, above the
// avg<0.15 / max<=0.4 seal thresholds). These checks therefore encode the
// requirements as agreed with the PO in review, and this file must be revisited
// if/when the spec is actually sealed.
//
// Uses Playwright directly — no @playwright/test runner, no package.json, no
// node_modules committed to this repo (see CLAUDE.md: build-free by design).
//
// Prerequisite (documented once, same pattern as this repo's semgrep check):
//   npm install -g playwright && npx --yes playwright install chromium
//
// Invoke via:
//   NODE_PATH="$(npm root -g)" node scripts/verify-agentic-first-sdlc.cjs
//
// CommonJS (require, not import) because Node's ESM resolver ignores NODE_PATH
// by design — only CJS `require` honors it, which is what lets this script find
// the globally-installed `playwright` package without a local install.

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repoRoot = path.resolve(__dirname, '..');
const SLUG = 'agentic-first-sdlc';

const presentationUrl = pathToFileURL(
  path.join(repoRoot, 'presentations', SLUG, 'index.html')
).href;
const homeUrl = pathToFileURL(path.join(repoRoot, 'index.html')).href;

// Section order mirrors the source document's thematic sequence: intro,
// the seven themes, the disagreements table, and the closing statement.
const EXPECTED_SECTIONS = [
  'hero',
  'fio-condutor',
  'tema-1',
  'tema-2',
  'tema-3',
  'tema-4',
  'tema-5',
  'tema-6',
  'tema-7',
  'tensoes',
  'fechamento',
];

// Sections that reveal on scroll (every one except the hero, which animates
// on load via its own headline-in keyframes).
const IN_VIEW_SECTIONS = EXPECTED_SECTIONS.filter((id) => id !== 'hero');

const failures = [];
const record = (label, ok, detail) => {
  const line = `${ok ? 'PASS' : 'FAIL'} - ${label}${detail ? ` (${detail})` : ''}`;
  console.log(line);
  if (!ok) failures.push(line);
};

// --- AC1: the presentation is reachable from the home listing ---
async function checkHomeListing(browser) {
  const page = await browser.newPage();
  await page.goto(homeUrl); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

  const card = page.locator(`.presentation-card[href$="${SLUG}/index.html"]`);
  const count = await card.count();
  record('home listing renders a card for this presentation', count === 1, `found ${count}`);

  if (count === 1) {
    const title = (await card.locator('.presentation-card__title').textContent()) || '';
    record('card has a non-empty title', title.trim().length > 0, title.trim());

    const desc = (await card.locator('.presentation-card__desc').textContent()) || '';
    record('card has a non-empty description', desc.trim().length > 0);

    // The description is PO-facing copy: it must not reintroduce the
    // "seven sources" framing that was deliberately removed.
    record(
      'card description avoids the removed "sete fontes" framing',
      !/sete fontes/i.test(desc),
      desc.trim()
    );
  }

  await page.close();
}

// --- AC2/AC3: hero renders, sections present and in order ---
async function checkStructure(browser) {
  const page = await browser.newPage();
  await page.goto(presentationUrl); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

  const webpSourceCount = await page
    .locator('.hero__photo source[type="image/webp"]')
    .count();
  record('hero <picture> has a webp <source>', webpSourceCount === 1, `found ${webpSourceCount}`);

  const img = page.locator('.hero__photo-img');
  const imgSrc = await img.getAttribute('src');
  record('hero fallback <img> points at a .jpeg', !!imgSrc && imgSrc.endsWith('.jpeg'), imgSrc || 'no src');

  const imgLoaded = await img.evaluate((el) => el.complete && el.naturalWidth > 0);
  record('hero image actually finished loading', imgLoaded);

  const headline = (await page.locator('.hero__headline').textContent()) || '';
  record('hero has a non-empty headline', headline.trim().length > 0, headline.trim());

  // Section presence and DOM order in one pass.
  const actual = await page.evaluate(
    (ids) =>
      ids
        .map((id) => ({ id, el: document.getElementById(id) }))
        .filter((x) => x.el)
        .map((x) => x.id),
    EXPECTED_SECTIONS
  );
  record(
    'all expected sections present, in order',
    actual.length === EXPECTED_SECTIONS.length &&
      actual.every((id, i) => id === EXPECTED_SECTIONS[i]),
    `expected ${EXPECTED_SECTIONS.length}, got ${actual.length}: ${actual.join(',')}`
  );

  // The "cinco perguntas" section was cut; it must not come back silently.
  const removedCount = await page.locator('#implicacoes').count();
  record('removed "implicacoes" section stays removed', removedCount === 0, `found ${removedCount}`);

  // AC: back link resolves to the home page (guards against a 404 path typo).
  const backHref = await page.locator('.back-to-menu').getAttribute('href');
  record('back link points at ../../index.html', backHref === '../../index.html', backHref || 'missing');
  const backTargetExists = fs.existsSync(path.join(repoRoot, 'index.html'));
  record('back link target file exists on disk', backTargetExists);

  // Closing positioning statement (AC5).
  const statement = (await page.locator('#fechamento .positioning__statement').textContent()) || '';
  record('closing positioning statement is present', statement.trim().length > 0);

  await page.close();
}

// --- Content requirements agreed in review ---
async function checkContentInvariants(browser) {
  const page = await browser.newPage();
  await page.goto(presentationUrl); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

  const visibleText = await page.evaluate(() => document.body.innerText);

  // Em-dash / en-dash are banned in visible copy.
  const dashes = (visibleText.match(/[–—]/g) || []).length;
  record('no em-dash or en-dash in visible copy', dashes === 0, `found ${dashes}`);

  // Exact, non-reproducible figures were removed as unreliable.
  const numericClaims = [
    /\b\d{1,3}\s*%/, // "35%"
    /\b0,\d+\b/, // "0,95"
    /\b\d+\s*min\b/i, // "43 min"
    /\bum ter[çc]o\b/i, // "um terço"
  ]
    .filter((re) => re.test(visibleText))
    .map((re) => re.source);
  record('no exact numeric claims in visible copy', numericClaims.length === 0, numericClaims.join(' | '));

  // Only these two sources may be named; the others were generalised.
  // Plain lowercased substring match rather than a constructed RegExp: the
  // dynamic-regex form trips the SAST non-literal-regexp rule, and a literal
  // includes() is both safer and sufficient for fixed names.
  const haystack = visibleText.toLowerCase();
  const forbiddenSources = ['Waldemar', 'Galego', 'Anthropic', 'Cognition', 'Ousterhout']
    .filter((name) => haystack.includes(name.toLowerCase()));
  record('only Uncle Bob and Matt Pocock are named', forbiddenSources.length === 0, forbiddenSources.join(', '));

  record('Uncle Bob is still cited', /Uncle Bob/.test(visibleText));
  record('Matt Pocock is still cited', /Matt Pocock/.test(visibleText));

  // Blocks added on request.
  const evalPanel = await page.locator('#tema-2 .eval-panel').count();
  record('tema 2 carries the evals panel', evalPanel === 1, `found ${evalPanel}`);

  const sliceNote = await page.locator('#tema-4 .slice-note').count();
  record('tema 4 carries the vertical-slice block', sliceNote === 1, `found ${sliceNote}`);

  const tema5Text = (await page.locator('#tema-5').innerText()) || '';
  record(
    'tema 5 frames the optimum as something to be found, not a fixed value',
    /ponto [oó]timo/i.test(tema5Text) && !/\b3 subagentes\b/i.test(tema5Text),
    tema5Text.includes('3 subagentes') ? 'still names a fixed agent count' : 'ok'
  );

  await page.close();
}

// --- AC4: scroll reveal actually fires, and degrades under reduced motion ---
async function checkScrollReveal(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(presentationUrl); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

  for (const id of IN_VIEW_SECTIONS) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  }

  let allInView = true;
  let pending = [];
  try {
    await page.waitForFunction(
      (ids) => ids.every((id) => document.getElementById(id)?.classList.contains('in-view')),
      IN_VIEW_SECTIONS,
      { timeout: 5000 }
    );
  } catch {
    allInView = false;
    pending = await page.evaluate(
      (ids) => ids.filter((id) => !document.getElementById(id)?.classList.contains('in-view')),
      IN_VIEW_SECTIONS
    );
  }
  record('every section gets .in-view after being scrolled to', allInView, pending.join(','));

  // Animated children must actually end up visible, not stuck at opacity 0.
  // Polled rather than sampled once: the reveal is a 600ms (--duration-slow)
  // opacity transition, so an instantaneous read right after scrolling races
  // the animation and reports every element as still faded.
  let allVisible = true;
  let stillFaded = 0;
  try {
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('[data-animate]')].every(
          (el) => Number(getComputedStyle(el).opacity) >= 0.9
        ),
      { timeout: 5000 }
    );
  } catch {
    allVisible = false;
    stillFaded = await page.evaluate(
      () =>
        [...document.querySelectorAll('[data-animate]')].filter(
          (el) => Number(getComputedStyle(el).opacity) < 0.9
        ).length
    );
  }
  record('no [data-animate] element is left invisible', allVisible, `${stillFaded} still faded`);

  await context.close();
}

async function checkReducedMotion(browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(presentationUrl); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

  const animName = await page
    .locator('.hero__photo-frame')
    .evaluate((el) => getComputedStyle(el).animationName);
  record('reduced motion freezes the hero pan', animName === 'none', animName);

  await context.close();
}

// --- Image-load failure falls back without breaking the hero ---
async function checkImageFallback(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route('**/assets/hero.{jpeg,webp}', (route) => route.abort());
  await page.goto(presentationUrl); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

  let errorClassAppeared = true;
  try {
    await page.waitForFunction(
      () => document.querySelector('.hero__photo')?.classList.contains('hero__photo--error'),
      { timeout: 5000 }
    );
  } catch {
    errorClassAppeared = false;
  }
  record('image load failure adds hero__photo--error', errorClassAppeared);

  const headlineVisible = await page.locator('.hero__headline').isVisible();
  record('hero headline stays readable when the image fails', headlineVisible);

  await context.close();
}

// --- Responsive: no horizontal overflow at a narrow viewport ---
async function checkNoHorizontalOverflow(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await context.newPage();
  await page.goto(presentationUrl); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

  const { scrollW, clientW } = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  record('no horizontal overflow at 375px', scrollW <= clientW, `scrollWidth=${scrollW} clientWidth=${clientW}`);

  // The 4-column table is the densest block; it must scroll inside its own
  // container rather than pushing the page wide.
  const tableScrolls = await page
    .locator('.tension-table-wrap')
    .evaluate((el) => getComputedStyle(el).overflowX);
  record('tensions table scrolls within its own container', tableScrolls === 'auto', tableScrolls);

  await context.close();
}

(async () => {
  const browser = await chromium.launch();
  try {
    await checkHomeListing(browser);
    await checkStructure(browser);
    await checkContentInvariants(browser);
    await checkScrollReveal(browser);
    await checkReducedMotion(browser);
    await checkImageFallback(browser);
    await checkNoHorizontalOverflow(browser);
  } finally {
    await browser.close();
  }

  console.log('');
  if (failures.length) {
    console.log(`${failures.length} check(s) failed.`);
    process.exit(1);
  } else {
    console.log('All agentic-first-sdlc checks passed.');
    process.exit(0);
  }
})();
