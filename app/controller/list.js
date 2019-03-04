'use strict';
const puppeteer = require('puppeteer');
const Controller = require('egg').Controller;

class ListController extends Controller {
  async create() {
    const { ctx, logger, config } = this;
    const { model } = ctx;

    async function run() {
      const url = config.url;
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
        let Lists = [];

        for (const keywordHTML of keywordsHTML) {
          Lists.push({
            keyword: keywordHTML.innerText,
            href: keywordHTML.href,
            pageNum: 1,
            maxPageNum: 30,
            status: 0,
          });
        }

        return {
          Lists,
        };
      });

      const listArr = [];

      await Promise.all(
        result.Lists.map(async List => {
          List.website = url;
          const $old = await model.List.findOne({
            website: List.website,
            keyword: List.keyword,
          });

          if (!$old) {
            listArr.push(List);
            logger.info('创建数据：', List.keyword);
          }
        }),
      );

      const rows = await model.List.create(listArr);
      const count = await model.List.countDocuments();
      await browser.close();
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

module.exports = ListController;
