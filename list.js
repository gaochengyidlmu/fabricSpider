'use strict';
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto('https://ml.tnc.com.cn/index.html', {
    timeout: 0,
    waitUntil: ['domcontentloaded'],
  });
  await page.evaluate(() => {
    console.log(123);
    let itemList = document.querySelectorAll('.cate-bd.clearfix');
    console.log('itemList: ', itemList);
  });

  // const pageInput = await page.$(`.cate-bd.clearfix`);
  //
  // console.log(123);
  // console.log('pageInput: ', pageInput);

  // browser.close();
}

main();
