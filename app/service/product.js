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
    logger.info('链接: ', listUrl);
    const result = await page.evaluate(() => {
      const noResultHTML = document.querySelectorAll('.no-result');
      const productInfos = [];
      if (noResultHTML.length !== 0) {
        console.log(`查询没有对应结果`);
        return {
          productInfos,
        };
      }

      const productsHTML = document.querySelectorAll('.order-result-list.clearfix .ahover .tit a');

      console.log('productsHTML: ', productsHTML);

      for (const productHTML of productsHTML) {
        productInfos.push({
          name: productHTML.innerText,
          productUrl: productHTML.href,
          webId: productHTML.href.split(/products?\//)[1].split('.html')[0],
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

    let rows;
    try {
      rows = await model.Product.create(products);
    } catch (e) {
      logger.error('开始单个添加');
      for (const product of products) {
        try {
          await model.Product.create(product);
          logger.info(`${product.name} 添加成功`);
        } catch (e) {
          logger.error(`${product.name} 添加失败`);
        }
      }
    }
    const count = await model.Product.countDocuments();
    await browser.close();

    return {
      rows: rows ? rows : [],
      count,
    };
  }

  async completeInfo({ $product }) {
    const { ctx, logger } = this;
    const { model } = ctx;
    const browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      headless: false,
    });

    const page = await browser.newPage();
    await page.goto($product.productUrl, {
      timeout: 0,
      waitUntil: ['domcontentloaded'],
    });
    logger.info('链接: ', $product.productUrl);
    const result = await page.evaluate(() => {
      const productInfo = {
        imgUrls: [],
      };

      // 获取价格
      const priceInfos = [];
      const pricesHTML = document.querySelectorAll('.goods-price .price-current');
      console.log('pricesHTML: ', pricesHTML);
      const qplsHTML = document.querySelectorAll('.goods-price .qpl dd');
      console.log('qplsHTML: ', qplsHTML);

      for (let i = 0; i < pricesHTML.length; i++) {
        const priceHTML = pricesHTML[i];
        if (!priceInfos[i]) {
          priceInfos[i] = { price: parseFloat(priceHTML.innerText) };
        } else {
          priceInfos[i].price = parseFloat(priceHTML.innerText);
        }
      }
      for (let i = 0; i < qplsHTML.length; i++) {
        const qplHTML = qplsHTML[i];
        if (!priceInfos[i]) {
          priceInfos[i] = { 起批量: qplHTML.innerText };
        } else {
          priceInfos[i].起批量 = qplHTML.innerText;
        }
      }
      productInfo.prices = priceInfos;

      // 获取图片、单位、公司
      const imgsHTML = document.querySelectorAll('#thumblist li img');
      console.log('imgsHTML: ', imgsHTML);
      for (const imgHTML of imgsHTML) {
        productInfo.imgUrls.push(imgHTML.src.replace('100X100', '300X300'));
      }

      const unitHTML = document.querySelector('.total dd em');
      console.log('unitHTML: ', unitHTML);
      productInfo.unit = unitHTML.innerText;

      const companyHTML = document.querySelector('.nav [data-code=introduce] a');
      console.log('companyHTML: ', companyHTML);
      productInfo.companyUrl = companyHTML.href;

      const addressHTML = document.querySelector('.delivery dd');
      console.log('valuesHTML: ', addressHTML);
      productInfo.address = addressHTML.innerText.split(' |')[0];

      // 获取参数信息
      const args = [];
      const namesHTML = document.querySelectorAll('.comshop_table th');
      console.log('namesHTML: ', namesHTML);
      for (const nameHTML of namesHTML) {

      }
      // productInfo.address = namesHTML.innerText.split(' |')[0];

      const valuesHTML = document.querySelectorAll('.comshop_table td');
      console.log('valuesHTML: ', valuesHTML);
      // productInfo.address = valuesHTML.innerText.split(' |')[0];

      return {
        productInfo,
      };
    });

    logger.info('更新信息: ', result.productInfo);

    // await model.Product.update(
    //   {
    //     _id: $product._id,
    //   },
    //   {
    //     ...result.productInfo,
    //     webId: $product.replace('/', ''),
    //     status: 1,
    //   },
    // );
    logger.info(`${$product.name} 数据已更新`);
    await browser.close();
  }
}

module.exports = ProductService;
