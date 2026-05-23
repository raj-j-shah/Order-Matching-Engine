const puppeteer = require('puppeteer');

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to frontend...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  console.log('Waiting for initial data load...');
  await delay(2000); 

  await page.screenshot({ path: 'e2e-initial.png' });
  console.log('Saved e2e-initial.png');

  console.log('Placing orders...');
  
  await page.type('input[placeholder="0.00"]', '100'); 
  await page.keyboard.press('Tab');
  await page.type('input[placeholder="0.00"]:focus', '1'); 
  await page.click('.btn-sell');
  await delay(500);

  await page.click('input[placeholder="0.00"]', { clickCount: 3 });
  await page.type('input[placeholder="0.00"]', '101');
  await page.keyboard.press('Tab');
  await page.type('input[placeholder="0.00"]:focus', '0.5');
  await page.click('.btn-sell');
  await delay(500);

  await page.click('input[placeholder="0.00"]', { clickCount: 3 });
  await page.type('input[placeholder="0.00"]', '98');
  await page.keyboard.press('Tab');
  await page.type('input[placeholder="0.00"]:focus', '2');
  await page.click('.btn-buy');
  await delay(1500); 

  await page.screenshot({ path: 'e2e-orderbook.png' });
  console.log('Saved e2e-orderbook.png');

  console.log('Triggering trade...');
  await page.click('input[placeholder="0.00"]', { clickCount: 3 });
  await page.type('input[placeholder="0.00"]', '100');
  await page.keyboard.press('Tab');
  await page.type('input[placeholder="0.00"]:focus', '0.5');
  await page.click('.btn-buy');
  await delay(2000); 

  await page.screenshot({ path: 'e2e-trade.png' });
  console.log('Saved e2e-trade.png');

  console.log('Closing browser...');
  await browser.close();
  console.log('Done end-to-end testing.');
})();
