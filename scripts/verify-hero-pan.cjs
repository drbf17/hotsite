// Validates the hero "travelling lateral" photo (sealed spec:
// hero-lateral-travelling-photos) against its acceptance criteria, using
// Playwright directly — no @playwright/test runner, no package.json, no
// node_modules committed to this repo (see CLAUDE.md: build-free by design).
//
// Prerequisite (documented once, same pattern as this repo's semgrep check):
//   npm install -g playwright && npx --yes playwright install chromium
//
// Invoke via:
//   NODE_PATH="$(npm root -g)" node scripts/verify-hero-pan.cjs
//
// Written as CommonJS (require, not import) specifically because Node's ESM
// resolver ignores NODE_PATH by design — only CJS `require` honors it, which
// is what lets this script find the globally-installed `playwright` package
// without a local install or npx's zero-install trick (which only resolves
// bare specifiers for files inside its own temp-installed package tree, not
// for external scripts like this one).

const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repoRoot = path.resolve(__dirname, '..');

const PRESENTATIONS = ['mudanca-para-negocio', 'template-driven-ui'];
const EXPECTED_ERROR_BG = 'rgb(10, 26, 60)'; // --color-blue-900: #0a1a3c

const failures = [];
const record = (label, ok, detail) => {
  const line = `${ok ? 'PASS' : 'FAIL'} — ${label}${detail ? ` (${detail})` : ''}`;
  console.log(line);
  if (!ok) failures.push(line);
};

async function checkPresentation(browser, slug) {
  const url = pathToFileURL(
    path.join(repoRoot, 'presentations', slug, 'index.html')
  ).href;

  // --- A. Default load: photo present, SVG/starfield gone, ping-pong animation wired up ---
  {
    const page = await browser.newPage();
    await page.goto(url);

    const sceneCount = await page.locator('.hero__scene').count();
    record(`[${slug}] .hero__scene removed`, sceneCount === 0, `found ${sceneCount}`);

    const starfieldCount = await page.locator('.hero__starfield').count();
    record(`[${slug}] .hero__starfield removed`, starfieldCount === 0, `found ${starfieldCount}`);

    const webpSourceCount = await page
      .locator('.hero__photo source[type="image/webp"]')
      .count();
    record(`[${slug}] <picture> has a webp <source>`, webpSourceCount === 1, `found ${webpSourceCount}`);

    const img = page.locator('.hero__photo-img');
    const imgSrc = await img.getAttribute('src');
    record(`[${slug}] fallback <img> points at a .jpeg`, !!imgSrc && imgSrc.endsWith('.jpeg'), imgSrc || 'no src');

    const objectFit = await img.evaluate((el) => getComputedStyle(el).objectFit);
    record(`[${slug}] hero__photo-img uses object-fit: cover`, objectFit === 'cover', objectFit);

    const anim = await page.locator('.hero__photo-frame').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        name: cs.animationName,
        duration: cs.animationDuration,
        iteration: cs.animationIterationCount,
        direction: cs.animationDirection,
      };
    });
    record(`[${slug}] animation-name is hero-pan`, anim.name === 'hero-pan', anim.name);
    record(`[${slug}] animation-duration is 20s`, anim.duration === '20s', anim.duration);
    record(`[${slug}] animation-iteration-count is infinite`, anim.iteration === 'infinite', anim.iteration);
    record(`[${slug}] animation-direction is alternate (ping-pong)`, anim.direction === 'alternate', anim.direction);

    await page.close();
  }

  // --- B. prefers-reduced-motion: reduce -> animation frozen, no JS required ---
  {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(url);

    const animName = await page
      .locator('.hero__photo-frame')
      .evaluate((el) => getComputedStyle(el).animationName);
    record(`[${slug}] reduced-motion freezes the pan (animation: none)`, animName === 'none', animName);

    await context.close();
  }

  // --- C. Image load failure -> solid --color-blue-900 fallback, no old SVG resurrected ---
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route('**/assets/hero.{jpeg,webp}', (route) => route.abort());
    await page.goto(url);

    const photo = page.locator('.hero__photo');
    await photo
      .evaluate(
        (el) =>
          new Promise((resolve) => {
            if (el.classList.contains('hero__photo--error')) return resolve(undefined);
            new MutationObserver((_, obs) => {
              if (el.classList.contains('hero__photo--error')) {
                obs.disconnect();
                resolve(undefined);
              }
            }).observe(el, { attributes: true, attributeFilter: ['class'] });
            setTimeout(resolve, 3000);
          })
      )
      .catch(() => {});

    const hasErrorClass = await photo.evaluate((el) => el.classList.contains('hero__photo--error'));
    record(`[${slug}] image load failure adds hero__photo--error`, hasErrorClass);

    const bg = await photo.evaluate((el) => getComputedStyle(el).backgroundColor);
    record(`[${slug}] error fallback background is --color-blue-900`, bg === EXPECTED_ERROR_BG, bg);

    const sceneCountOnError = await page.locator('.hero__scene').count();
    record(`[${slug}] old SVG scene is not resurrected on error`, sceneCountOnError === 0, `found ${sceneCountOnError}`);

    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const slug of PRESENTATIONS) {
      await checkPresentation(browser, slug);
    }
  } finally {
    await browser.close();
  }

  console.log('');
  if (failures.length) {
    console.log(`${failures.length} check(s) failed.`);
    process.exit(1);
  } else {
    console.log('All hero-pan checks passed.');
    process.exit(0);
  }
})();
