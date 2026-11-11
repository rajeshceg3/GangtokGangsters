// Guided-tour journey check for GangtokGangsters (390px, real Chromium).
// Usage: node tour-journey.mjs <baseUrl> <screenshotDir>
// Deps: puppeteer-core resolvable from VERIFY_DEPS (a dir with node_modules).
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(process.env.VERIFY_DEPS
  ? path.join(process.env.VERIFY_DEPS, 'x.js')
  : import.meta.url);
const puppeteer = require('puppeteer-core');

const [, , baseUrl, shotDir = '/tmp'] = process.argv;
const failures = [];
const check = (name, ok, detail = '') => {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (ok ? '' : ' :: ' + String(detail).slice(0, 300)));
  if (!ok) failures.push(name);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(String(e)));

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#explore-btn', { timeout: 10000 });
  await page.click('#explore-btn');
  await sleep(1200);

  // Start the auto tour from the dock
  await page.click('#tour-mode');
  await page.waitForSelector('#tour-bar:not([hidden])', { timeout: 8000 });
  await sleep(300);

  const state = () => page.evaluate(() => ({
    counter: document.getElementById('tour-counter')?.textContent,
    name: document.getElementById('info-name')?.textContent,
    autoActive: document.getElementById('tour-auto')?.classList.contains('active'),
    autoIconPause: document.getElementById('tour-auto')?.querySelector('i')?.classList.contains('ph-pause'),
    prevDisabled: document.getElementById('tour-prev')?.disabled,
    nextLabel: document.getElementById('tour-next')?.querySelector('span')?.textContent,
    barHidden: document.getElementById('tour-bar')?.hidden,
    touring: document.getElementById('info-panel')?.classList.contains('touring'),
  }));

  let s = await state();
  check('tour starts in auto mode', s.autoActive === true && s.autoIconPause === true, JSON.stringify(s));
  check('place card shows stop 1 (MG Marg)', s.counter === '1 / 11' && s.name === 'MG Marg', JSON.stringify(s));
  check('prev disabled on first stop', s.prevDisabled === true, JSON.stringify(s));
  check('panel in touring mode', s.touring === true, JSON.stringify(s));
  await page.screenshot({ path: path.join(shotDir, 'tour-1-auto.png') });

  // Touch Next -> pauses auto, steps to stop 2
  await page.click('#tour-next');
  await sleep(400);
  s = await state();
  check('next pauses auto into manual', s.autoActive === false, JSON.stringify(s));
  check('next steps to stop 2 (Rumtek Monastery)', s.counter === '2 / 11' && s.name === 'Rumtek Monastery', JSON.stringify(s));
  check('prev enabled on second stop', s.prevDisabled === false, JSON.stringify(s));
  await page.screenshot({ path: path.join(shotDir, 'tour-2-manual.png') });

  // Prev back to stop 1, stays manual
  await page.click('#tour-prev');
  await sleep(400);
  s = await state();
  check('prev steps back to stop 1, still manual', s.counter === '1 / 11' && s.autoActive === false, JSON.stringify(s));

  // Auto resumes from current stop
  await page.click('#tour-auto');
  await sleep(300);
  s = await state();
  check('auto resumes from current stop', s.autoActive === true && s.counter === '1 / 11', JSON.stringify(s));

  // Walk to the last stop manually: pause then next x10
  await page.click('#tour-next'); // -> manual, stop 2
  for (let i = 0; i < 9; i++) await page.click('#tour-next');
  await sleep(400);
  s = await state();
  check('last stop shows Finish (Hanuman Tok)', s.counter === '11 / 11' && s.name === 'Hanuman Tok' && s.nextLabel === 'Finish', JSON.stringify(s));
  await page.screenshot({ path: path.join(shotDir, 'tour-3-finish.png') });

  // Finish ends the session
  await page.click('#tour-next');
  await sleep(300);
  s = await state();
  check('finish ends the tour session', s.barHidden === true && s.touring === false, JSON.stringify(s));

  check('no uncaught js errors during journey', jsErrors.length === 0, jsErrors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}
console.log('TOUR_FAILURES=' + failures.length);
process.exit(failures.length ? 1 : 0);
