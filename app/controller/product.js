const Controller = require('egg').Controller;

class ProductController extends Controller {
  async create() {
    const { ctx, service, logger } = this;
    const { model } = ctx;

    async function run() {
      let go = true;
      let sum = 0;
      while (go) {
        let $list;
        const $runningList = await model.List.findOne({
          status: 2,
        });

        if ($runningList) {
          logger.info('寻找到 $runningList');
          $list = $runningList;
        } else {
          const $toRunList = await model.List.findOne({
            status: 0,
          });

          if ($toRunList) {
            logger.info('寻找到 $toRunList');
            $list = $toRunList;
          } else {
            go = false;
            break;
          }
        }

        for (let i = $list.pageNum; i <= $list.maxPageNum; i++) {
          logger.info(`开始插入 ${$list.keyword} 的第 ${i} 页数据`);
          await ctx.helper.sleep(1500);
          const { rows } = await service.product.insert({ $list, i });

          $list.pageNum = i + 1;
          $list.productNum += rows.length;
          await $list.save();

          logger.info(`插入 ${$list.keyword} 的第 ${i} 页成功`);
          sum += rows.length;
        }

        $list.status = 1;
        await $list.save();
        logger.info(`${$list.keyword} 的数据插入完成\n\n`);
        await ctx.helper.sleep(5000);
      }

      logger.info(`总共插入 ${sum} 条数据`);

      return sum;
    }

    return run()
      .then(data => ctx.helper.success(data))
      .catch(error => ctx.helper.fail(error));
  }

  async update() {
    const { ctx, service, logger } = this;
    const { model } = ctx;

    async function run() {
      let go = true;
      let sum = 0;
      while (go) {
        const $product = await model.Product.findOne({
          status: 2,
        });
        logger.info(`开始更新 ${$product.name}`);

        if (!$product) {
          go = false;
          break;
        }

        await service.product.completeInfo({ $product });
        logger.info(`${$product.name} 的数据更新`);
        sum++;
        await ctx.helper.sleep(500);

        break;
      }

      logger.info(`总共插入 ${sum} 条数据`);

      return sum;
    }

    return run()
      .then(data => ctx.helper.success(data))
      .catch(error => ctx.helper.fail(error));
  }
}

module.exports = ProductController;
