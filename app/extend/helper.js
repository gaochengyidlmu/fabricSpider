const crypto = require('crypto');

module.exports = {
  validate(rule) {
    const { logger } = this;
    const toValidate = {
      ...this.ctx.request.body,
      ...this.ctx.query,
      ...this.ctx.params,
    };

    this.ctx.validate(rule, toValidate);

    const args = {};
    for (const key in rule) {
      if (typeof toValidate[key] === 'string') args[key] = toValidate[key].trim();
      else if (toValidate[key] !== undefined) args[key] = toValidate[key];
    }
    logger.info('请求条件: ', JSON.stringify(args));
    return args;
  },

  success(data = {}, flatten = false) {
    let res = {
      statusCode: 10000,
      serverTime: new Date(),
    };
    if (flatten && this.isExist(data)) {
      // 处理 getList 时，对 rows 进行置换
      if (data.rows) {
        data.data = data.rows;
        delete data.rows;
      }
      res = { ...data, ...res };
    } else res.data = data;

    this.ctx.body = res;
  },
  fail(error) {
    const { logger, ctx, config } = this;

    let message = error.message;
    let statusCode = 10001;

    // 处理直接传递 errorCode 的报错信息，从 config 的 error 配置中，获取 message
    if (config.errorCode[parseInt(message)]) {
      statusCode = parseInt(message);
      message = config.errorCode[message];
    }

    // 对于报错信息需要自定义的，需传递 json，其中 message 必传，且值为 zh+en 的对象
    /**
     * message 传递规范
     * message = JSON.stringify({
     *  errorMsg: {
     *    zh: '中文报错',
     *    en: 'English Error',
     *  },
     *  statusCode: 11001
     * })
     */
    try {
      const parsedMsg = JSON.parse(message);
      message = parsedMsg.errorMsg;
      statusCode = parsedMsg.statusCode;
    } catch (error) {
      // nothing to do
    }

    // 处理 validate 报的错
    if ('errors' in error) {
      message = {
        zh: `字段 ${error.errors[0].field} ${error.errors[0].message}`,
        en: `Field ${error.errors[0].field} ${error.errors[0].message}`,
      };
    }

    // 报错国际化
    if (message && message[ctx.lang]) message = message[ctx.lang];

    error.message = statusCode + ': ' + message;
    logger.error(error);

    ctx.body = {
      statusCode,
      errorMsg: message,
      serverTime: new Date(),
    };
  },

  wrapError(statusCode, addMsg) {
    const { config } = this;
    const errorMsg = { ...config.errorCode[statusCode] };

    errorMsg.zh += ' - ' + addMsg;
    errorMsg.en += ' - ' + addMsg;

    return JSON.stringify({
      errorMsg,
      statusCode,
    });
  },

  async sleep(ms) {
    const { logger } = this;
    logger.info('暂停时间: ', ms);
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  fuzzy(data) {
    return data.split(' ').join('|');
  },

  hash(key) {
    return crypto
      .createHash('sha256')
      .update(key)
      .digest('hex');
  },

  copy(obj) {
    const newObj = obj.constructor === Array ? [] : {};
    if (typeof obj !== 'object') {
      return;
    }
    for (const i in obj) {
      newObj[i] = typeof obj[i] === 'object' ? this.copy(obj[i]) : obj[i];
    }
    return newObj;
  },

  isExist(value) {
    return ![null, undefined].includes(value);
  },

  formatMoney(s, type) {
    let pre = '';

    if (s < 0) {
      pre = '-';
      s = 0 - s;
    }

    if (/[^0-9\.]/.test(s)) return '0';
    if (s === null || s === '') return '0';
    s = s.toString().replace(/^(\d*)$/, '$1.');
    s = `${s}00`.replace(/(\d*\.\d\d)\d*/, '$1');
    s = s.replace('.', ',');
    const re = /(\d)(\d{3},)/;

    while (re.test(s)) {
      s = s.replace(re, '$1,$2');
    }
    s = s.replace(/,(\d\d)$/, '.$1');
    if (type === 0) {
      // 不带小数位(默认是有小数位)
      const a = s.split('.');

      if (a[1] === '00') {
        s = a[0];
      }
    }
    return pre + s;
  },
};
