// {app_root}/app/model/user.js
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = mongoose.Types.ObjectId;

  const ProductSchema = new Schema(
    {
      name: { type: String, default: '' }, // 产品名
      productUrl: { type: String, default: '' }, // 产品链接
      webId: { type: String, default: '' }, // 网站中的 id
      prices: {
        type: [
          {
            price: { type: Number, default: 0 }, // 价格
            起批量: { type: String, default: '' }, // 条件
          },
        ],
        default: [],
      }, // 价格
      unit: { type: String, default: '' }, // 价格单位
      Company: { type: ObjectId, ref: 'Company' },
      imgUrls: { type: [String], default: [] }, // 产品图片组
      telphone: { type: String, default: '' }, // 联系电话
      qq: { type: String, default: '' }, // qq
      address: { type: String, default: '' }, // 地址
      isNaYang: { type: Boolean, default: false }, // 是否允许拿样
      织物组织: { type: String, default: '' },
      克重: { type: String, default: '' },
      成分: { type: String, default: '' },
      特殊处理: { type: String, default: '' },
      混纺比例: { type: String, default: '' },
      颜色: { type: String, default: '' },
      用途: { type: String, default: '' },
      其他工艺: { type: String, default: '' },
      次要用途: { type: String, default: '' },
      适用类型: { type: String, default: '' },
      品名: { type: String, default: '' },
      服装用布: { type: String, default: '' },
      其他规格: { type: String, default: '' },
      纱支: { type: String, default: '' },
      门幅: { type: String, default: '' },
      图案: { type: String, default: '' },
      编织方式: { type: String, default: '' },
      主工艺: { type: String, default: '' },
      货号: { type: String, default: '' },
      status: { type: Number, default: 2 }, // 0: 已删除；1: 状态正常；2: 待补充信息
    },
    {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
  );

  return mongoose.model('Product', ProductSchema);
};
