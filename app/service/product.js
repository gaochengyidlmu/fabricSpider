const Service = require('egg').Service;
const puppeteer = require('puppeteer');

class ProductService extends Service {
  async insert({ $list, i }) {
    const { ctx, logger } = this;
    const { model } = ctx;

    const browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      headless: true,
    });

    const page = await browser.newPage();
    const listUrl = $list.href.replace(/-k--p\d+/, '-k--p' + i);
    await page.goto(listUrl, {
      timeout: 0,
      waitUntil: ['domcontentloaded'],
    });
    const result = await page.evaluate(() => {
      const noResultHTML = document.querySelectorAll('.no-result');
      if (noResultHTML.length !== 0) {
        console.log(`查询没有对应结果`);
        return;
      }

      const productsHTML = document.querySelectorAll('.order-result-list.clearfix .ahover .tit a');

      console.log('productsHTML: ', productsHTML);
      const productInfos = [];

      for (const productHTML of productsHTML) {
        productInfos.push({
          name: productHTML.innerText,
          productUrl: productHTML.href,
          webId: productHTML.href.split('/product/')[1].split('.html')[0],
        });
      }

      return {
        productInfos,
      };
    });

    const products = [];
    await Promise.all(
      result.productInfos.map(async productInfo => {
        const count = await model.Product.countDocuments({
          webId: productInfo.webId,
        });

        if (count === 0) {
          products.push(productInfo);
          logger.info('创建产品: ', productInfo.name);
        }
      }),
    );

    logger.info('插入产品的条数: ', products.length);
    logger.info('链接: ', listUrl);

    const rows = await model.Product.create(products);
    const count = await model.Product.countDocuments();

    return {
      rows: rows ? rows : [],
      count,
    };
  }
}

module.exports = ProductService;
