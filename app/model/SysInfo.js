// {app_root}/app/model/user.js
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const SysInfoSchema = new Schema(
    {
      website: { type: String, default: '' }, // 网址
      keyword: { type: String, default: '' }, // 当前正在查找的 keyword
      href: { type: String, default: '' }, // 链接地址
      pageNum: { type: Number, default: 1 }, // 当前查找对应的 page 页
      maxPageNum: { type: Number, default: 15 }, // 最大查找页数
      status: { type: Number, default: 0 }, // 0：未开始查找；1: 查询结束；2: 正在查找
    },
    {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
  );

  return mongoose.model('SysInfo', SysInfoSchema);
};
