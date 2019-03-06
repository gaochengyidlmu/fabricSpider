// {app_root}/app/model/user.js
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const CompanySchema = new Schema(
    {
      name: { type: String, default: '' }, // 公司名
      companyUrl: { type: String, default: '' }, // 公司链接
      webId: { type: String, default: '' }, // 网站中的 id
      所在地区: { type: String, default: '' }, // 地区
      详细地址: { type: String, default: '' }, // 详细地址
      公司简介: { type: String, default: '' }, // 描述
      bossName: { type: String, default: '' }, // 老板
      经营模式: { type: String, default: '' },
      '主营产品/服务': { type: String, default: '' },
      采购产品: { type: String, default: '' },
      status: { type: Number, default: 2 }, // 0: 已删除；1: 状态正常；2: 待补充信息；4: 错误信息
    },
    {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
  );

  return mongoose.model('Company', CompanySchema);
};
