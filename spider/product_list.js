const puppeteer = require('puppeteer');
const model = require('./model');
const helper = require('./helper');

create();

async function create() {
  async function run() {
    let go = true;
    let sum = 0;
    while (go) {
      let $list;
      const $runningList = await model.List.findOne({
        status: 2,
      });

      if ($runningList) {
        console.log('寻找到 $runningList');
        $list = $runningList;
      } else {
        const $toRunList = await model.List.findOne({
          status: 0,
        });

        if ($toRunList) {
          console.log('寻找到 $toRunList');
          $list = $toRunList;
        } else {
          go = false;
          break;
        }
      }

      for (let i = $list.pageNum; i <= $list.maxPageNum; i++) {
        console.log(`开始插入 ${$list.keyword} 的第 ${i} 页数据`);
        await helper.sleep(1500);
        const { rows } = await insert({ $list, i });

        $list.pageNum = i + 1;
        $list.productNum += rows.length;
        await $list.save();

        console.log(`插入 ${$list.keyword} 的第 ${i} 页成功\n\n`);
        sum += rows.length;
      }

      $list.status = 1;
      await $list.save();
      console.log(`${$list.keyword} 的数据插入完成\n\n`);
      await helper.sleep(5000);
    }

    console.log(`总共插入 ${sum} 条数据`);

    return sum;
  }

  await run();
}

async function insert({ $list, i }) {
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
  console.log('链接: ', listUrl);
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
        console.log('创建产品: ', productInfo.name);
      }
    }),
  );

  console.log('插入产品的条数: ', products.length);

  let rows;
  try {
    rows = await model.Product.create(products);
  } catch (e) {
    console.log('开始单个添加');
    for (const product of products) {
      try {
        await model.Product.create(product);
        console.log(`${product.name} 添加成功`);
      } catch (e) {
        console.log(`${product.name} 添加失败`);
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
