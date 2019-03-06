const puppeteer = require('puppeteer');
const model = require('./model');
const helper = require('./helper');

update();

async function update() {
  async function run() {
    let sum = 0;
    let go = true;
    let times = 0;
    while (go) {
      const $company = await model.Company.findOne({
        status: 2,
      });

      if (!$company) {
        if (times < 30) {
          console.log(`第 ${++times} 次暂停`);
          await helper.sleep(times * 15 * 1000);
          continue;
        } else {
          go = false;
          break;
        }
      }

      times = 0;

      try {
        await completeInfo({ $company });
      } catch (e) {
        console.error(e);
        await model.Company.update(
          {
            _id: $company._id,
          },
          {
            status: 4,
          },
        );
      }
      sum++;
      await helper.sleep(500);
    }

    console.log(`总共插入 ${sum} 条数据`);
    console.log('安全结束进程');
    process.exit();
  }

  return run();
}

async function completeInfo({ $company }) {
  console.log(`开始更新 ${$company.name}`);

  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto($company.companyUrl, {
    timeout: 0,
    waitUntil: ['domcontentloaded'],
  });
  console.log('链接: ', $company.companyUrl);
  const result = await page.evaluate(() => {
    const companyInfo = {};

    // 获取列表参数信息
    const args = [];
    const namesHTML = document.querySelectorAll('.table .c3');
    console.log('namesHTML: ', namesHTML);

    for (let i = 0; i < namesHTML.length; i++) {
      const nameHTML = namesHTML[i];
      if (!args[i]) {
        args[i] = {
          name: nameHTML.innerText,
        };
      } else args[i].name = nameHTML.innerText;
    }

    const valuesHTML = document.querySelectorAll('.table tr td:nth-child(2)');
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
    args.forEach(item => (companyInfo[item.name] = item.value));
    console.log('列表参数获取完成');

    // 获取boss信息
    const bossHTML = document.querySelector('.jbxx_in_lxr');
    console.log('bossHTML: ', bossHTML);
    companyInfo.bossName = bossHTML.innerText;

    return {
      companyInfo,
    };
  });

  console.log('更新信息: ', result.companyInfo);

  await model.Company.updateOne(
    {
      _id: $company._id,
    },
    {
      ...result.companyInfo,
      status: 1,
    },
  );
  console.log(`${$company.name} 数据已更新`);
  await browser.close();
}

process.on('SIGINT', async function() {
  console.log('\n正在进行安全退出');
});
