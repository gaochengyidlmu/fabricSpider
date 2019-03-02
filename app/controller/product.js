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
          await model.List.updateOne(
            {
              _id: $list._id,
            },
            {
              pageNum: i + 1,
            },
          );
          logger.info(`插入 ${$list.keyword} 的第 ${i} 页成功`);
          sum += rows.length;
        }
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
