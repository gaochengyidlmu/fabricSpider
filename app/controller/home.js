'use strict';
const puppeteer = require('puppeteer');
const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx, logger } = this;
    const { model } = ctx;

    async function run() {
      const url = 'https://ml.tnc.com.cn/index.html';
      const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: false,
      });

      const page = await browser.newPage();
      await page.goto(url, {
        timeout: 0,
        waitUntil: ['domcontentloaded'],
      });
      const result = await page.evaluate(() => {
        const keywordsHTML = document.querySelectorAll('.cate-bd.clearfix a');
        console.log('keywordsHTML: ', keywordsHTML);
        let SysInfos = [];

        for (const keywordHTML of keywordsHTML) {
          SysInfos.push({
            keyword: keywordHTML.innerText,
            href: keywordHTML.href,
            pageNum: 1,
            maxPageNum: 30,
            status: 0,
          });
        }

        return {
          SysInfos,
        };
      });

      await Promise.all(
        result.SysInfos.map(async SysInfo => {
          SysInfo.website = url;
          const $old = await model.SysInfo.findOne({
            website: SysInfo.website,
            keyword: SysInfo.keyword,
          });

          if (!$old) {
            await model.SysInfo.create(SysInfo);
            logger.info('创建数据：', SysInfo.keyword);
          }
        }),
      );

      const rows = await model.SysInfo.find();
      const count = await model.SysInfo.countDocuments();
      return {
        rows,
        count,
      };
    }

    return run()
      .then(data => ctx.helper.success(data, true))
      .catch(error => ctx.helper.fail(error));
  }
}

module.exports = HomeController;
