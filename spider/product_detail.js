const puppeteer = require('puppeteer');
const model = require('./model');
const helper = require('./helper');

update();

async function update() {
  async function run() {
    let go = true;
    let sum = 0;

    await model.Product.update(
      {
        status: 3,
      },
      {
        status: 2,
      },
      {
        multi: true,
      },
    );

    while (go) {
      const $product = await model.Product.findOneAndUpdate(
        {
          status: 2,
        },
        {
          status: 3,
        },
        {
          new: true,
        },
      );

      if (!$product) {
        go = false;
        break;
      }

      await completeInfo({ $product });
      sum++;
      await helper.sleep(500);
    }

    console.log(`总共插入 ${sum} 条数据`);
    console.log('安全结束进程\n');
    process.exit();
  }

  return run();
}

async function completeInfo({ $product }) {
  console.log(`开始更新 ${$product.name}`);

  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto($product.productUrl, {
    timeout: 0,
    waitUntil: ['domcontentloaded'],
  });
  console.log('链接: ', $product.productUrl);
  const result = await page.evaluate(() => {
    const productInfo = {
      imgUrls: [],
      Company: {
        status: 2,
      },
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

    const addressHTML = document.querySelector('.delivery dd');
    console.log('valuesHTML: ', addressHTML);
    productInfo.address = addressHTML.innerText.split(' |')[0];

    // 获取列表参数信息
    const args = [];
    const namesHTML = document.querySelectorAll('.comshop_table th');
    console.log('namesHTML: ', namesHTML);

    for (let i = 0; i < namesHTML.length; i++) {
      const nameHTML = namesHTML[i];
      if (!args[i]) {
        args[i] = {
          name: nameHTML.innerText,
        };
      } else args[i].name = nameHTML.innerText;
    }

    // productInfo.address = namesHTML.innerText.split(' |')[0];

    const valuesHTML = document.querySelectorAll('.comshop_table td');
    console.log('valuesHTML: ', valuesHTML);

    for (let i = 0; i < valuesHTML.length; i++) {
      const valueHTML = valuesHTML[i];
      if (!args[i]) {
        args[i] = {
          value: valueHTML.innerText,
        };
      } else args[i].value = valueHTML.innerText;
    }

    console.log('args: ', args);
    args.forEach(item => (productInfo[item.name] = item.value));
    console.log('列表参数获取完成');

    // 获取公司信息
    const companyHTML = document.querySelector('.jbxx_zt');
    console.log('companyHTML: ', companyHTML);
    productInfo.Company.name = companyHTML.innerText;

    const companyURLHTML = document.querySelector('.nav [data-code=introduce] a');
    console.log('companyURLHTML: ', companyURLHTML);
    productInfo.Company.companyUrl = companyURLHTML.href;

    return {
      productInfo,
    };
  });

  console.log('更新信息: ', result.productInfo);

  result.productInfo.Company = await insertCompany(result.productInfo.Company);

  await model.Product.updateOne(
    {
      _id: $product._id,
    },
    {
      ...result.productInfo,
      webId: $product.webId.replace('/', ''),
      status: 1,
    },
  );
  console.log(`${$product.name} 数据已更新`);
  await browser.close();
}

async function insertCompany(Company) {
  let $company = await model.Company.findOne({
    companyUrl: Company.companyUrl,
  });

  if (!$company) {
    $company = await model.Company.create(Company);
    console.log(`插入新的公司 ${Company.name}`);
  }
  return $company._id;
}

process.on('SIGINT', async function() {
  console.log('\n正在进行安全退出');
});
