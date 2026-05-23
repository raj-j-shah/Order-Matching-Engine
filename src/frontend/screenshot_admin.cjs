const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // Wait for load
  await new Promise(r => setTimeout(r, 2000));
  
  // Switch to System Admin
  await page.select('.nav-right select:nth-of-type(2)', (await page.$$eval('.nav-right select:nth-of-type(2) option', opts => opts.find(o => o.textContent === 'System Admin').value)));
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: '../../e2e-admin.png' });
  
  await browser.close();
})();
