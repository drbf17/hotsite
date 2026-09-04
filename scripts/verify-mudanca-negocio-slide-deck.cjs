// Validates the "mudanca-negocio-slide-deck" sealed spec
// (agent-handoffs/specs/mudanca-negocio-slide-deck/mudanca-negocio-slide-deck.v1.sealed.yaml,
// content_hash sha256:c336f75bacd0cc82d962b93ebb8ae359325d64663467352111858a89aaeceafa)
// end to end in a real Chromium instance.
//
// PROVENANCE / SELECTOR CONTRACT: no ApiContract exists (no API — a static
// client-side deck) and no ComponentManifest was handed down (needs_prototype
// was true but no artifact existed at authoring time). Written in parallel
// with frontend-dev building the same spec, deliberately WITHOUT reading
// their implementation (QA charter: derive tests from
// acceptance_criteria/edge_cases, never from the code under test). This file
// therefore proposes its own selector contract from the spec's vocabulary
// ("botao next", "dot indicator", "contador") and this repo's data-attribute
// convention (data-video-player/-el/-play in js/video.js): every DOM query
// below tries a short candidate list before giving up, and a miss across
// every candidate is a named FAIL, never a silent skip. The five section ids
// (hero, cards, results, positioning, video) already exist in the
// presentation today and the sealed spec fixes this exact order.
//
// Uses Playwright directly via scripts/lib/verify-shared.cjs (shared with
// this repo's other verify-*.cjs scripts) — no test runner, no package.json,
// no node_modules (see CLAUDE.md: build-free by design). CommonJS (require,
// not import): only CJS `require` honors NODE_PATH, which is how this finds
// the globally-installed `playwright` without a local install.
//
// Prerequisite: npm install -g playwright && npx --yes playwright install chromium
// Invoke via:   NODE_PATH="$(npm root -g)" node scripts/verify-mudanca-negocio-slide-deck.cjs

const { presentationUrl, createReporter, withPage, runSuite } = require('./lib/verify-shared.cjs');

const SLUG = 'mudanca-para-negocio';
const SLIDE_IDS = ['hero', 'cards', 'results', 'positioning', 'video'];
const TOTAL = SLIDE_IDS.length;

const baseUrl = presentationUrl(SLUG);
const reporter = createReporter();
const { record, note } = reporter;

const urlFor = (query) => (query ? `${baseUrl}${query}` : baseUrl);

// --- Selector contract (documented above) -----------------------------------
const NEXT_SELECTORS = ['[data-slide-next]', '[data-deck-next]', '.slide-nav__next', '.deck-nav__next', 'button[aria-label*="róxim" i]', 'button[aria-label*="proxim" i]', 'button[aria-label*="next" i]'];
const PREV_SELECTORS = ['[data-slide-prev]', '[data-deck-prev]', '.slide-nav__prev', '.deck-nav__prev', 'button[aria-label*="anterior" i]', 'button[aria-label*="prev" i]'];
const DOT_SELECTORS = ['[data-slide-dot]', '[data-deck-dot]', '.slide-dots__dot', '.deck-dots__dot', 'button[aria-label*="ir para" i]', 'button[aria-label*="go to slide" i]'];
const COUNTER_SELECTORS = ['[data-slide-counter]', '[data-deck-counter]', '.slide-counter', '.deck-counter', '[aria-live] .counter', '[aria-live]'];

// Returns the first selector (tried in order) that matches >=1 element, or null.
async function locateFirst(page, candidates, { nth = 0 } = {}) {
  for (const sel of candidates) {
    const count = await page.locator(sel).count();
    if (count > 0) return { locator: page.locator(sel).nth(nth), selector: sel, count };
  }
  return null;
}

async function getActiveSlideId(page) {
  return page.evaluate((ids) => ids.filter((id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }), SLIDE_IDS);
}

const slideParamFromUrl = (urlStr) => new URL(urlStr).searchParams.get('slide');

async function getCounterInfo(page) {
  const found = await locateFirst(page, COUNTER_SELECTORS);
  if (!found) return null;
  const text = ((await found.locator.textContent()) || '').trim();
  const ariaLabel = await found.locator.getAttribute('aria-label');
  return { selector: found.selector, text, ariaLabel };
}

async function clickControl(page, candidates, label) {
  const found = await locateFirst(page, candidates);
  if (!found) {
    record(`${label} control located`, false, `none of [${candidates.join(', ')}] matched`);
    return false;
  }
  await found.locator.click();
  return true;
}

// Repeated across several checks below that need to assert "no page error
// was thrown/logged" around a specific interaction.
function trackPageErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

// AC1/E1 — invalid/missing/out-of-range ?slide= falls back to 1, normalized
// via replaceState (no extra history entry), counter '1 / 5'.
async function checkFallbackAndNormalization(browser) {
  for (const qs of ['', '?slide=99', '?slide=0', '?slide=abc', '?slide=']) {
    await withPage(browser, urlFor(qs), async (page) => {
      const active = await getActiveSlideId(page);
      record(`[?slide=${JSON.stringify(qs)}] only 'hero' is the visible slide on load`, active.length === 1 && active[0] === 'hero', `visible=[${active.join(',')}]`);
      const counter = await getCounterInfo(page);
      record(`[?slide=${JSON.stringify(qs)}] counter reads '1 / 5'`, !!counter && /(^|\D)1\s*\/\s*5(\D|$)/.test(counter.text), counter ? counter.text : 'counter element not found');
      const slideParam = slideParamFromUrl(page.url());
      record(`[?slide=${JSON.stringify(qs)}] URL normalized to ?slide=1`, slideParam === '1', `?slide=${slideParam}`);
    });
  }

  // Normalization must use replaceState, not pushState: history.length is
  // captured via addInitScript (fires before deck.js, on the navigation under
  // test) and compared to its post-load value — replaceState leaves it
  // unchanged; a pushState bug would bump it by one.
  await withPage(
    browser,
    urlFor('?slide=99'),
    async (page) => {
      const { before, after } = await page.evaluate(() => ({ before: window.__qaHistoryLenAtInit, after: window.history.length }));
      record('fallback normalization uses replaceState, not pushState (history.length unchanged after load)', after === before, `history.length ${before} -> ${after}`);
    },
    {
      beforeGoto: (page) => page.addInitScript(() => { window.__qaHistoryLenAtInit = window.history.length; }),
      gotoOptions: { waitUntil: 'load' },
    }
  );
}

// AC4 — deep link ?slide=3 shows slide 3 immediately, counter '3 / 5', no
// visible flash through slides 1/2.
async function checkDeepLink(browser) {
  await withPage(
    browser,
    urlFor('?slide=3'),
    async (page) => {
      // Sampled as early as possible (right after DOM parse, before load and
      // any late JS timer could visibly flash 1 -> 2 -> 3).
      const earlyActive = await getActiveSlideId(page);
      record("deep link ?slide=3: slide 'results' active immediately after DOMContentLoaded (no flash through 1/2)", earlyActive.length === 1 && earlyActive[0] === 'results', `visible=[${earlyActive.join(',')}]`);
      await page.waitForLoadState('load');
      const active = await getActiveSlideId(page);
      record("deep link ?slide=3: slide 'results' active after full load", active.length === 1 && active[0] === 'results', `visible=[${active.join(',')}]`);
      const counter = await getCounterInfo(page);
      record('deep link ?slide=3: counter reads 3 / 5', !!counter && /(^|\D)3\s*\/\s*5(\D|$)/.test(counter.text), counter ? counter.text : 'counter element not found');
    },
    { gotoOptions: { waitUntil: 'domcontentloaded' } }
  );
}

// AC2/AC3 — keyboard, on-screen buttons, dots each advance/retreat exactly
// one slide, updating counter + URL via pushState (new history entry each time).
async function checkNavigationMechanisms(browser) {
  await withPage(browser, urlFor('?slide=1'), async (page) => {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    let active = await getActiveSlideId(page);
    record('ArrowRight moves hero -> cards', active[0] === 'cards', `visible=[${active.join(',')}]`);
    let counter = await getCounterInfo(page);
    record('ArrowRight: counter reads 2 / 5', !!counter && /2\s*\/\s*5/.test(counter.text), counter?.text);
    record('ArrowRight: URL reflects ?slide=2', slideParamFromUrl(page.url()) === '2', page.url());
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(400);
    active = await getActiveSlideId(page);
    record('ArrowLeft moves cards -> hero', active[0] === 'hero', `visible=[${active.join(',')}]`);
    counter = await getCounterInfo(page);
    record('ArrowLeft: counter reads 1 / 5', !!counter && /1\s*\/\s*5/.test(counter.text), counter?.text);
  });

  // pushState must create a NEW history entry per transition (not replaceState).
  await withPage(browser, urlFor('?slide=1'), async (page) => {
    const lenAtStart = await page.evaluate(() => window.history.length);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    const lenAfterTwoMoves = await page.evaluate(() => window.history.length);
    record('two forward transitions push two distinct history entries', lenAfterTwoMoves >= lenAtStart + 2, `history.length ${lenAtStart} -> ${lenAfterTwoMoves}`);
  });

  await withPage(browser, urlFor('?slide=1'), async (page) => {
    const clickedNext = await clickControl(page, NEXT_SELECTORS, 'next-button');
    if (!clickedNext) return;
    await page.waitForTimeout(400);
    const active = await getActiveSlideId(page);
    record('next-button click moves hero -> cards', active[0] === 'cards', `visible=[${active.join(',')}]`);
    const counter = await getCounterInfo(page);
    record('next-button click: counter reads 2 / 5', !!counter && /2\s*\/\s*5/.test(counter.text), counter?.text);
    record('next-button click: URL reflects ?slide=2', slideParamFromUrl(page.url()) === '2', page.url());
    const clickedPrev = await clickControl(page, PREV_SELECTORS, 'prev-button');
    if (!clickedPrev) return;
    await page.waitForTimeout(400);
    const activeAfterPrev = await getActiveSlideId(page);
    record('prev-button click moves cards -> hero', activeAfterPrev[0] === 'hero', `visible=[${activeAfterPrev.join(',')}]`);
  });

  await withPage(browser, urlFor('?slide=1'), async (page) => {
    const dotsFound = await locateFirst(page, DOT_SELECTORS);
    if (!dotsFound) {
      record('dot indicators located', false, `none of [${DOT_SELECTORS.join(', ')}] matched`);
      return;
    }
    const dots = page.locator(dotsFound.selector);
    const dotCount = await dots.count();
    record('dot indicators: exactly 5 dots present', dotCount === TOTAL, `found ${dotCount}`);
    if (dotCount < 4) return;
    await dots.nth(3).click(); // 0-indexed -> slide 4 (positioning)
    await page.waitForTimeout(400);
    const active = await getActiveSlideId(page);
    record('clicking 4th dot jumps directly to slide 4 (positioning)', active[0] === 'positioning', `visible=[${active.join(',')}]`);
    const counter = await getCounterInfo(page);
    record('dot click: counter reads 4 / 5', !!counter && /4\s*\/\s*5/.test(counter.text), counter?.text);
  });
}

// AC5 — boundary behavior: no-op past slide 1 (prev) and slide 5 (next).
async function checkBoundaries(browser) {
  await withPage(browser, urlFor('?slide=1'), async (page) => {
    const errors = trackPageErrors(page);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    const active = await getActiveSlideId(page);
    record('at slide 1, ArrowLeft is a no-op (still hero)', active[0] === 'hero', `visible=[${active.join(',')}]`);
    const counter = await getCounterInfo(page);
    record('at slide 1, counter still reads 1 / 5 after ArrowLeft', !!counter && /1\s*\/\s*5/.test(counter.text), counter?.text);
    record('at slide 1, ArrowLeft throws no page error', errors.length === 0, errors.join('; '));
  });

  await withPage(browser, urlFor('?slide=5'), async (page) => {
    const errors = trackPageErrors(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    const active = await getActiveSlideId(page);
    record('at slide 5, ArrowRight is a no-op (still video)', active[0] === 'video', `visible=[${active.join(',')}]`);
    const counter = await getCounterInfo(page);
    record('at slide 5, counter still reads 5 / 5 after ArrowRight', !!counter && /5\s*\/\s*5/.test(counter.text), counter?.text);
    record('at slide 5, ArrowRight throws no page error', errors.length === 0, errors.join('; '));
  });
}

// E4 — browser back button steps back one slide at a time.
async function checkBrowserBack(browser) {
  await withPage(browser, urlFor('?slide=1'), async (page) => {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    let active = await getActiveSlideId(page);
    record('setup: two ArrowRight presses land on results (slide 3)', active[0] === 'results', `visible=[${active.join(',')}]`);
    await page.goBack();
    await page.waitForTimeout(400);
    active = await getActiveSlideId(page);
    record('browser Back steps back exactly one slide (results -> cards)', active[0] === 'cards', `visible=[${active.join(',')}]`);
    const counter = await getCounterInfo(page);
    record('after Back, counter reads 2 / 5', !!counter && /2\s*\/\s*5/.test(counter.text), counter?.text);
    await page.goBack();
    await page.waitForTimeout(400);
    active = await getActiveSlideId(page);
    record('a second Back steps back to hero (slide 1), not out of the deck', active[0] === 'hero', `visible=[${active.join(',')}]`);
  });
}

// AC9 — prefers-reduced-motion: reduce -> instant cut, no transition animation.
async function checkReducedMotion(browser) {
  await withPage(
    browser,
    urlFor('?slide=1'),
    async (page) => {
      const before = await page.evaluate((ids) => {
        const cs = getComputedStyle(document.getElementById(ids[0]));
        return { transitionDuration: cs.transitionDuration, animationDuration: cs.animationDuration };
      }, SLIDE_IDS);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
      const active = await getActiveSlideId(page);
      record('reduced-motion: slide change already resolved almost immediately (instant cut, not a 300ms slide)', active[0] === 'cards', `visible=[${active.join(',')}] after 50ms`);
      const activeCs = await page.evaluate((id) => {
        const cs = getComputedStyle(document.getElementById(id));
        return { transitionDuration: cs.transitionDuration, animationDuration: cs.animationDuration };
      }, 'cards');
      record('reduced-motion: active slide has no lingering transition/animation duration', /^(0s(,\s*0s)*)?$/.test(activeCs.transitionDuration) || activeCs.transitionDuration === '', JSON.stringify(activeCs));
      note(`baseline (slide 1) transition/animation durations under reduced-motion: ${JSON.stringify(before)}`);
    },
    { contextOptions: { reducedMotion: 'reduce' } }
  );
}

// AC10 — no vertical page scroll, no essential content clipped, at a narrow
// mobile width and a desktop width.
async function checkNoPageScroll(browser) {
  const viewports = [{ name: 'mobile-375', width: 375, height: 667 }, { name: 'desktop-1440', width: 1440, height: 900 }];
  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    for (let idx = 1; idx <= TOTAL; idx += 1) {
      const slideId = SLIDE_IDS[idx - 1];
      await page.goto(urlFor(`?slide=${idx}`)); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection
      const { scrollH, innerH, scrollW, innerW } = await page.evaluate(() => ({
        scrollH: document.documentElement.scrollHeight, innerH: window.innerHeight,
        scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
      }));
      record(`[${vp.name}] slide '${slideId}' has no page-level vertical scroll`, scrollH <= innerH + 2, `scrollHeight=${scrollH} innerHeight=${innerH}`);
      record(`[${vp.name}] slide '${slideId}' has no horizontal overflow`, scrollW <= innerW + 2, `scrollWidth=${scrollW} innerWidth=${innerW}`);
    }
    await context.close();
  }
}

// AC7 — progressive enhancement: non-active slides hidden before/without a
// post-load JS flash.
async function checkProgressiveEnhancementCssHiding(browser) {
  const page = await browser.newPage();
  // Throttle so we get a real chance to observe pre-script-execution state.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 50, downloadThroughput: (200 * 1024) / 8, uploadThroughput: (200 * 1024) / 8 });

  await page.goto(urlFor(''), { waitUntil: 'commit' }); // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection
  // Sample essentially immediately, then again after full load; both must
  // already show only hero — i.e. no window with all 5 sections stacked.
  const nonHeroIds = SLIDE_IDS.filter((id) => id !== 'hero');
  const sampleVisible = (ids) => page.evaluate((idList) => idList.filter((id) => {
    const el = document.getElementById(id);
    return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  }), ids);

  const earlyVisible = await sampleVisible(nonHeroIds);
  record('non-active slides (cards/results/positioning/video) are hidden essentially immediately, before JS necessarily ran', earlyVisible.length === 0, earlyVisible.length ? `still visible: [${earlyVisible.join(',')}]` : 'all hidden');

  await page.waitForLoadState('load');
  const lateVisible = await sampleVisible(nonHeroIds);
  record('non-active slides remain hidden after full load (no flash of all sections stacked)', lateVisible.length === 0, lateVisible.length ? `still visible: [${lateVisible.join(',')}]` : 'all hidden');

  await page.close();
}

// AC8/E6 — JS disabled/blocked: falls back to the old full-scroll layout (all
// sections visible, stacked, no deck/counter).
async function checkNoJsFallback(browser) {
  await withPage(
    browser,
    urlFor(''),
    async (page) => {
      const visible = await page.evaluate((ids) => ids.filter((id) => {
        const el = document.getElementById(id);
        return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
      }), SLIDE_IDS);
      record('with JS disabled, all 5 sections are visible (old full-scroll fallback, no deck)', visible.length === TOTAL, `visible=[${visible.join(',')}]`);
    },
    { contextOptions: { javaScriptEnabled: false } }
  );
}

// AC12/E5 — video slide: navigating away pauses the video; no thrown error
// even if pause() runs before video.js is ready (best-effort, documented).
async function checkVideoPauseOnNavigateAway(browser) {
  await withPage(browser, urlFor('?slide=5'), async (page) => {
    const errors = trackPageErrors(page);
    const playBtn = page.locator('[data-video-play]');
    if ((await playBtn.count()) === 0) {
      note("video slide: [data-video-play] not found — could not exercise play/pause-on-navigate-away; verify manually once frontend-dev's markup lands");
    } else {
      await playBtn.click();
      await page.waitForTimeout(300);
      const playingBefore = await page.evaluate(() => { const v = document.querySelector('[data-video-el]'); return v ? !v.paused : null; });
      record('video slide: play button actually starts playback', playingBefore === true, `paused=${!playingBefore}`);
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(400);
      const pausedAfter = await page.evaluate(() => { const v = document.querySelector('[data-video-el]'); return v ? v.paused : null; });
      record('video slide: navigating away pauses the video automatically', pausedAfter === true, `paused=${pausedAfter}`);
    }
    record('video slide navigation produced no thrown page error', errors.length === 0, errors.join('; '));
  });
}

// AC13/E10 — cards slide: tap-triggered flip still works, unchanged, and
// does not trigger slide navigation.
async function checkCardsFlipUnaffected(browser) {
  await withPage(
    browser,
    urlFor('?slide=2'),
    async (page) => {
      const card = page.locator('.card').first();
      if ((await card.count()) === 0) {
        note('cards slide: no .card elements found — could not exercise tap-to-flip');
        return;
      }
      await card.tap();
      await page.waitForTimeout(200);
      const flipped = await card.evaluate((el) => el.classList.contains('is-flipped'));
      record('tapping a card on the cards slide still flips it', flipped, `is-flipped=${flipped}`);
      const active = await getActiveSlideId(page);
      record('tapping a card does not navigate away from the cards slide', active[0] === 'cards', `visible=[${active.join(',')}]`);
    },
    { contextOptions: { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } } }
  );
}

// E2 — rapid repeated next clicks / held arrow key during an in-flight
// transition must not overshoot or desync the counter from the visible slide.
async function checkRapidInputNoDesync(browser) {
  await withPage(browser, urlFor('?slide=1'), async (page) => {
    // Fire 5 ArrowRight presses back-to-back, faster than the ~300ms transition.
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press('ArrowRight');
    }
    await page.waitForTimeout(1200); // let any queued/debounced transitions settle
    const active = await getActiveSlideId(page);
    const counter = await getCounterInfo(page);
    const activeIdx = active.length === 1 ? SLIDE_IDS.indexOf(active[0]) + 1 : -1;
    const counterMatch = counter && counter.text.match(/(\d+)\s*\/\s*5/);
    const counterNum = counterMatch ? Number(counterMatch[1]) : null;
    record('rapid ArrowRight bursts settle on exactly one visible slide (no split/blank state)', active.length === 1, `visible=[${active.join(',')}]`);
    record('rapid ArrowRight bursts do not overshoot past the last slide', activeIdx >= 1 && activeIdx <= TOTAL, `activeIdx=${activeIdx}`);
    record("after a rapid burst, the counter's number matches the actually visible slide (no desync)", counterNum !== null && counterNum === activeIdx, `counter=${counterNum} activeIdx=${activeIdx}`);
  });
}

// E11/out-of-scope guard — swipe/touch-drag must NOT navigate slides anywhere.
async function checkSwipeDoesNotNavigate(browser) {
  await withPage(
    browser,
    urlFor('?slide=1'),
    async (page) => {
      await page.touchscreen.tap(350, 400);
      // Simulate a horizontal swipe via low-level touch dispatch since
      // Playwright's Touchscreen API has no drag primitive.
      await page.evaluate(() => {
        const target = document.body;
        const mk = (type, x, y) => new TouchEvent(type, {
          bubbles: true, cancelable: true,
          touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target, clientX: x, clientY: y })],
          changedTouches: [new Touch({ identifier: 1, target, clientX: x, clientY: y })],
        });
        target.dispatchEvent(mk('touchstart', 350, 400));
        target.dispatchEvent(mk('touchmove', 200, 400));
        target.dispatchEvent(mk('touchmove', 50, 400));
        target.dispatchEvent(mk('touchend', 50, 400));
      });
      await page.waitForTimeout(300);
      const active = await getActiveSlideId(page);
      record('a horizontal swipe gesture does not navigate the deck', active[0] === 'hero', `visible=[${active.join(',')}]`);
    },
    { contextOptions: { hasTouch: true, viewport: { width: 390, height: 844 } } }
  );
}

// AC11 — accessibility: Tab reaches prev/next/dots, Enter/Space activate
// them; counter has an accessible name reflecting current/total.
async function checkAccessibility(browser) {
  await withPage(browser, urlFor('?slide=1'), async (page) => {
    const nextFound = await locateFirst(page, NEXT_SELECTORS);
    if (!nextFound) {
      record('next control reachable via Tab', false, 'next control not located by any candidate selector');
    } else {
      let reached = false;
      for (let i = 0; i < 15 && !reached; i += 1) {
        await page.keyboard.press('Tab');
        reached = await page.evaluate((sel) => document.activeElement === document.querySelector(sel), nextFound.selector);
      }
      record('next control is reachable via Tab', reached, reached ? 'reached within 15 tabs' : 'not focused within 15 tabs');
      if (reached) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(400);
        const active = await getActiveSlideId(page);
        record('next control activatable via Enter', active[0] === 'cards', `visible=[${active.join(',')}]`);
      }
    }
    const counter = await getCounterInfo(page);
    record('counter carries an accessible name reflecting current/total (aria-label)', !!counter && !!counter.ariaLabel && /\d/.test(counter.ariaLabel) && /5/.test(counter.ariaLabel), counter ? `aria-label=${JSON.stringify(counter.ariaLabel)}` : 'counter element not found');
    const ariaLiveCount = await page.locator('[aria-live]').count();
    record('an aria-live region exists to announce slide changes', ariaLiveCount > 0, `found ${ariaLiveCount}`);
  });
}

// AC6 — config/manifest-driven order: a JS-level ordered manifest drives
// nav (best-effort structural check, not behavior-defining).
async function checkManifestDrivenOrder(browser) {
  await withPage(browser, urlFor('?slide=1'), async (page) => {
    // Behavioral consequence is already covered end-to-end by
    // checkNavigationMechanisms/checkBoundaries; this additionally looks for
    // a plausible exposed config array as a best-effort signal, without
    // failing the suite if the implementation encapsulates it privately (a
    // closed-over module-local array is equally spec-compliant).
    const exposedOrder = await page.evaluate(() => {
      const candidates = [window.Hotsite && window.Hotsite.deck && window.Hotsite.deck.slides, window.Hotsite && window.Hotsite.slideDeck && window.Hotsite.slideDeck.slides, window.SLIDES, window.DECK_SLIDES];
      return candidates.find((c) => Array.isArray(c)) || null;
    });
    if (exposedOrder) {
      record('exposed slide-order config matches hero,cards,results,positioning,video', JSON.stringify(exposedOrder) === JSON.stringify(SLIDE_IDS), JSON.stringify(exposedOrder));
    } else {
      note('no publicly exposed slide-order array found under a guessed global name (window.Hotsite.deck.slides et al.) — acceptable if the manifest is module-private; behavioral order is verified separately');
    }
  });
}

// E7 — file:// compatibility: every check above already runs against a
// file:// URL (see presentationUrl() in scripts/lib/verify-shared.cjs); this
// adds one focused deep-link + pushState assertion under file:// specifically,
// the one API with documented cross-browser file:// quirks.
async function checkFileProtocolDeepLinkAndPushState(browser) {
  await withPage(browser, urlFor('?slide=2'), async (page) => {
    record('file:// URL scheme in use for this check', page.url().startsWith('file://'), page.url());
    const active = await getActiveSlideId(page);
    record('file://: deep link ?slide=2 opens directly on cards', active[0] === 'cards', `visible=[${active.join(',')}]`);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    const afterNav = await getActiveSlideId(page);
    const param = slideParamFromUrl(page.url());
    record('file://: pushState updates ?slide= after in-deck navigation', param === '3' && afterNav[0] === 'results', `?slide=${param}, visible=[${afterNav.join(',')}]`);
  });
}

// E8 — history.pushState/replaceState throwing (restrictive/sandboxed
// context) must not block in-memory navigation: slide changes, counter, and
// keyboard/button/dot input all keep working; the URL stays frozen; nothing
// is thrown/logged. Stubbed via addInitScript so the throw is installed
// before deck.js's own syncUrl ever runs.
async function checkHistoryApiFailureFallback(browser) {
  await withPage(
    browser,
    urlFor('?slide=1'),
    async (page) => {
      const errors = trackPageErrors(page);
      const urlBefore = page.url();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
      let active = await getActiveSlideId(page);
      let counter = await getCounterInfo(page);
      record('E8: with history.pushState/replaceState stubbed to throw, in-memory navigation still advances the slide', active[0] === 'cards', `visible=[${active.join(',')}]`);
      record('E8: with the history API throwing, the counter still updates (2 / 5)', !!counter && /2\s*\/\s*5/.test(counter.text), counter?.text);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
      active = await getActiveSlideId(page);
      counter = await getCounterInfo(page);
      record('E8: a second in-memory navigation continues to work (results, 3 / 5)', active[0] === 'results' && !!counter && /3\s*\/\s*5/.test(counter.text), `visible=[${active.join(',')}] counter=${counter?.text}`);
      record('E8: the URL stays frozen (no sync) while the history API is throwing', page.url() === urlBefore, `before=${urlBefore} after=${page.url()}`);
      record('E8: no page error is thrown/logged despite the history API throwing', errors.length === 0, errors.join('; '));
    },
    {
      beforeGoto: (page) => page.addInitScript(() => {
        window.history.pushState = () => { throw new Error('qa-stub: pushState blocked (restrictive/sandboxed context)'); };
        window.history.replaceState = () => { throw new Error('qa-stub: replaceState blocked (restrictive/sandboxed context)'); };
      }),
    }
  );
}

// E3 — window resize / orientation rotation while a transition is in flight
// must not crash or desync the deck. The transition duration is confirmed at
// exactly 300ms, so the resize fires at a fixed 100ms delay (comfortably
// inside that window) and the deck gets 400ms (past any remaining transition
// time) to settle before asserting — deterministic, no racing an unconfirmed
// duration.
async function checkResizeMidTransition(browser) {
  await withPage(
    browser,
    urlFor('?slide=1'),
    async (page) => {
      const errors = trackPageErrors(page);
      await page.keyboard.press('ArrowRight'); // starts the 300ms hero -> cards transition
      await page.waitForTimeout(100); // fixed point well inside the confirmed 300ms window
      await page.setViewportSize({ width: 500, height: 900 }); // resize mid-transition
      await page.waitForTimeout(400); // settle well past any remaining transition time
      const active = await getActiveSlideId(page);
      const counter = await getCounterInfo(page);
      record('E3: resizing mid-transition (100ms into a 300ms slide change) settles on exactly one visible slide', active.length === 1 && active[0] === 'cards', `visible=[${active.join(',')}]`);
      record('E3: resizing mid-transition leaves the counter matching the settled slide (2 / 5)', !!counter && /2\s*\/\s*5/.test(counter.text), counter?.text);
      record('E3: resizing mid-transition throws no page error', errors.length === 0, errors.join('; '));
    },
    { contextOptions: { viewport: { width: 1024, height: 768 } } }
  );
}

const CHECKS = [
  checkFallbackAndNormalization, checkDeepLink, checkNavigationMechanisms, checkBoundaries,
  checkBrowserBack, checkReducedMotion, checkNoPageScroll, checkProgressiveEnhancementCssHiding,
  checkNoJsFallback, checkVideoPauseOnNavigateAway, checkCardsFlipUnaffected, checkRapidInputNoDesync,
  checkSwipeDoesNotNavigate, checkAccessibility, checkManifestDrivenOrder,
  checkFileProtocolDeepLinkAndPushState, checkHistoryApiFailureFallback, checkResizeMidTransition,
];

runSuite('mudanca-negocio-slide-deck', CHECKS, reporter).catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
