/* eslint valid-jsdoc: "off" */

'use strict';
const errorCode = require('./errorCode');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1551496689699_9787';

  // add your middleware config here
  config.middleware = [];

  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1:27017/fabricSpider',
      options: {
        useNewUrlParser: true,
        poolSize: 10,
        useCreateIndex: true,
      },
    },
  };

  config.url = 'https://ml.tnc.com.cn/index.html';

  config.errorCode = errorCode;

  config.security = {
    csrf: {
      enable: false,
    },
  };
  config.logger = {
    level: 'DEBUG',
    allowDebugAtProd: true,
    consoleLevel: 'DEBUG',
    disableConsoleAfterReady: false,
  };
  config.cluster = {
    listen: {
      port: 20520,
    },
  };

  return config;
};
