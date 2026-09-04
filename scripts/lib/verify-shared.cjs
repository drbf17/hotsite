// Shared boilerplate for this repo's Playwright-direct e2e verify scripts
// (scripts/verify-hero-pan.cjs, scripts/verify-agentic-first-sdlc.cjs,
// scripts/verify-mudanca-negocio-slide-deck.cjs).
//
// Extracted to close a Watchdog hard-fail (verify-mudanca-negocio-slide-deck.cjs
// was 837 LOC against a 600 ceiling) via genuine deduplication rather than an
// arbitrary file split: every one of these scripts independently reimplemented
// the same require block, repoRoot resolution, presentation file:// URL
// construction, PASS/FAIL/NOTE recorder, and launch/run-checks/report/exit
// driver. That shape now lives in exactly one place.
//
// CommonJS (require, not import) for the same reason as its callers — only
// CJS `require` honors NODE_PATH, which is how these scripts find the
// globally-installed `playwright` package without a local install/package.json
// (see CLAUDE.md: build-free by design).

const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repoRoot = path.resolve(__dirname, '..', '..');

// Builds the file:// URL for a presentation's index.html the same way every
// caller here already did by hand: path.join(repoRoot, 'presentations', slug,
// 'index.html') through pathToFileURL(...).href.
function presentationUrl(slug) {
  return pathToFileURL(path.join(repoRoot, 'presentations', slug, 'index.html')).href;
}

// Creates the PASS/FAIL/NOTE recorder every script here reimplemented
// identically (module-local `failures`/`notes` arrays plus a `record`/`note`
// closure over them). Returned as an object instead of module-level state so
// each script keeps its own independent tally.
function createReporter() {
  const failures = [];
  const notes = [];
  const record = (label, ok, detail) => {
    const line = `${ok ? 'PASS' : 'FAIL'} - ${label}${detail ? ` (${detail})` : ''}`;
    console.log(line);
    if (!ok) failures.push(line);
  };
  const note = (text) => {
    console.log(`NOTE - ${text}`);
    notes.push(text);
  };
  return { record, note, failures, notes };
}

// Opens a page (in a fresh context when `contextOptions` is given, e.g. for
// viewport/reducedMotion/javaScriptEnabled/hasTouch overrides), runs `fn`
// against it, and guarantees the context/page is closed afterwards — the
// open/goto/act/close shape every check block in these suites repeats.
// Returns whatever `fn` returns, so callers can still pull values out.
// `options.beforeGoto`, when given, runs against the freshly created page
// BEFORE the navigation below — the one hook callers actually need pre-nav
// setup for (e.g. page.addInitScript to instrument/stub browser APIs so the
// stub is in place before the target page's own scripts run).
async function withPage(browser, url, fn, options) {
  const opts = options || {};
  const context = opts.contextOptions ? await browser.newContext(opts.contextOptions) : null;
  const page = context ? await context.newPage() : await browser.newPage();
  try {
    if (opts.beforeGoto) {
      await opts.beforeGoto(page);
    }
    if (url !== null) {
      // nosemgrep: javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection
      await page.goto(url, opts.gotoOptions);
    }
    return await fn(page);
  } finally {
    if (context) {
      await context.close();
    } else {
      await page.close();
    }
  }
}

// The launch -> run every check -> report -> exit driver every one of these
// scripts' trailing IIFE reimplemented identically.
async function runSuite(suiteName, checks, reporter) {
  const browser = await chromium.launch();
  try {
    for (const check of checks) {
      await check(browser);
    }
  } finally {
    await browser.close();
  }

  console.log('');
  if (reporter.notes.length) {
    console.log(`${reporter.notes.length} note(s) - not failures, see NOTE lines above for manual-check items.`);
  }
  if (reporter.failures.length) {
    console.log(`${reporter.failures.length} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${suiteName} checks passed.`);
    process.exitCode = 0;
  }
}

module.exports = {
  chromium,
  repoRoot,
  presentationUrl,
  createReporter,
  withPage,
  runSuite,
};
