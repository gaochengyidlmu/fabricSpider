const Excel = require('exceljs');
const model = require('./model');

// const arr = ['V|粘|v', '涤|T|t', 'N|锦|n', '氨|SP|sp'];
// const arr = ['V|粘|v|涤|T|t|N|锦|n|氨|SP|sp'];
const arr = ['V|粘|v|涤|T|t|N|锦|n|氨|SP|sp'];

(async () => {
  for (const key of arr) {
    await run(key);
  }
  process.exit();
})();

async function run(key) {
  const options = {
    filename: `./分析数据.xlsx`,
    useStyles: true,
    useSharedStrings: true,
  };
  const streamWorkbook = new Excel.stream.xlsx.WorkbookWriter(options);
  const streamWorksheet1 = streamWorkbook.addWorksheet('sheet1');

  streamWorksheet1.columns = [
    { header: '成分', key: '成分', width: 30 },
    { header: '品名', key: '品名', width: 25 },
    { header: '纱支', key: '纱支', width: 25 },
    { header: '主工艺', key: '主工艺', width: 25 },
    { header: '克重', key: '克重', width: 25 },
    { header: '特殊处理', key: '特殊处理', width: 25 },
    { header: '所在地区', key: '所在地区', width: 25 },
    { header: 'id', key: '_id', width: 25 },
  ];

  // const query = {
  //   面料名称: '化纤面料',
  //   成分: {
  //     $regex: new RegExp(key),
  //   },
  // };
  const query = {
    面料名称: '化纤面料',
    $and: [
      {
        成分: '',
      },
      // {
      //   成分: {
      //     $not: /V|粘|v|涤|T|t|N|锦|n|氨|SP|sp/,
      //   },
      // },
    ],
  };
  const count = await model.Product.countDocuments(query);
  console.log(`${arr[0]}: ${count} 个`);

  let skip = 0;
  const limit = 10000;
  while (skip <= count) {
    const rows = await model.Product.find(query)
      .skip(skip)
      .limit(limit)
      .populate('Company');

    console.log('length: ', rows.length);

    rows.forEach(row => {
      const data = {
        _id: row._id.toString(),
        成分: row.成分,
        品名: row.品名,
        纱支: row.纱支,
        主工艺: row.主工艺,
        克重: row.克重,
        特殊处理: row.特殊处理,
        所在地区: row.Company ? row.Company.所在地区 : '',
      };

      for (const key in data) {
        if (data[key] && typeof data[key] === 'string') data[key] = data[key].trim();
      }

      streamWorksheet1.addRow(data).commit();
    });

    skip += limit;
  }

  await streamWorksheet1.commit();
  console.log('数据写入完成');
  await streamWorkbook.commit();
}
