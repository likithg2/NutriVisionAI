const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
  await page.type('input[placeholder="you@example.com or phone"]', 'likithg2@gmail.com');
  await page.type('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({waitUntil: 'networkidle2'});
  await page.goto('http://localhost:5173/calories', {waitUntil: 'networkidle2'});
  
  await page.screenshot({path: 'calories_test_success.png'});
  await browser.close();
  console.log('Done screenshot');
})();
