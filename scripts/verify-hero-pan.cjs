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

const failures = [];
const record = (label, ok, detail) => {
  const line = `${ok ? 'PASS' : 'FAIL'} — ${label}${detail ? ` (${detail})` : ''}`;
  console.log(line);
  if (!ok) failures.push(line);
};

// Resolves a CSS custom property to its computed color the same way the
// browser would, instead of hardcoding an rgb() literal that would silently
// stop meaning anything the day tokens.css changes --color-blue-900.
async function resolveColorToken(page, token) {
  // `token` is always a hardcoded literal passed by this file's own callers
  // (e.g. '--color-blue-900'), never external/user-controlled input.
  return page.evaluate((t) => { // nosemgrep: javascript.playwright.security.audit.playwright-evaluate-arg-injection.playwright-evaluate-arg-injection
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${t})`;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return resolved;
  }, token);
}

async function checkPresentation(browser, slug) {
  const url = pathToFileURL(
    path.join(repoRoot, 'presentations', slug, 'index.html')
  ).href;

  // --- A. Default load: photo present, SVG/starfield gone, ping-pong animation wired up ---
  {
    const page = await browser.newPage();
    await page.goto(url); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

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

    // Closes a real hole: without this, block A would still pass even if
    // both the webp and jpeg 404'd, since object-fit/animation are computed
    // styles that exist regardless of whether the image actually rendered.
    const imgLoaded = await img.evaluate((el) => el.complete && el.naturalWidth > 0);
    record(`[${slug}] hero__photo-img actually finished loading`, imgLoaded);

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

    // AC5 — .hero__scrim keeps hero text legible over the pan, not removed/weakened.
    const scrimCount = await page.locator('.hero__scrim').count();
    record(`[${slug}] .hero__scrim is present`, scrimCount === 1, `found ${scrimCount}`);

    const scrim = await page.locator('.hero__scrim').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        backgroundImage: cs.backgroundImage,
        zIndex: Number(cs.zIndex) || 0,
        height: el.getBoundingClientRect().height,
      };
    });
    record(
      `[${slug}] scrim has a real gradient background (not removed)`,
      scrim.backgroundImage.includes('gradient'),
      scrim.backgroundImage
    );
    record(`[${slug}] scrim has non-zero height`, scrim.height > 0, `${scrim.height}px`);

    const photoZIndex = await page
      .locator('.hero__photo')
      .evaluate((el) => Number(getComputedStyle(el).zIndex) || 0);
    record(
      `[${slug}] scrim layers above the photo (z-index)`,
      scrim.zIndex > photoZIndex,
      `scrim=${scrim.zIndex} photo=${photoZIndex}`
    );

    await page.close();
  }

  // --- B. prefers-reduced-motion: reduce -> animation frozen, no JS required ---
  {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(url); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

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
    await page.goto(url); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

    // Playwright's built-in polling (auto-retry with a real timeout, no
    // manual MutationObserver/setTimeout race, no swallowed errors).
    let errorClassAppeared = true;
    try {
      await page.waitForFunction(
        () => document.querySelector('.hero__photo')?.classList.contains('hero__photo--error'),
        { timeout: 5000 }
      );
    } catch {
      errorClassAppeared = false;
    }
    record(`[${slug}] image load failure adds hero__photo--error`, errorClassAppeared);

    const expectedBg = await resolveColorToken(page, '--color-blue-900');
    const bg = await page.locator('.hero__photo').evaluate((el) => getComputedStyle(el).backgroundColor);
    record(`[${slug}] error fallback background is --color-blue-900`, bg === expectedBg, `${bg} vs token ${expectedBg}`);

    const sceneCountOnError = await page.locator('.hero__scene').count();
    record(`[${slug}] old SVG scene is not resurrected on error`, sceneCountOnError === 0, `found ${sceneCountOnError}`);

    await context.close();
  }

  // --- D. AC7 — no layout shift: #hero's box is stable before/after the image finishes loading ---
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' }); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection

    const heightBefore = await page.locator('#hero').evaluate((el) => el.getBoundingClientRect().height);
    await page.waitForLoadState('load');
    const heightAfter = await page.locator('#hero').evaluate((el) => el.getBoundingClientRect().height);

    record(
      `[${slug}] no CLS: #hero height stable across image load`,
      Math.abs(heightBefore - heightAfter) < 1,
      `before=${heightBefore.toFixed(1)}px after=${heightAfter.toFixed(1)}px`
    );

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
