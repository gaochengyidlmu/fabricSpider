'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.post('/lists', controller.list.create);

  router.post('/products', controller.product.create);
  router.put('/products', controller.product.update);
};
