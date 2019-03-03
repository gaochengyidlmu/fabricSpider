const mongoose = require('mongoose');
const CompanyModel = require('../app/model/Company')
const ListModel = require('../app/model/List')
const ProductModel = require('../app/model/Product')

const dbURL = 'mongodb://127.0.0.1:27017/fabricSpider';

const dbConfig = {
      useNewUrlParser: true,
      dbName: 'fabricSpider',
      poolSize: 10,
    };

mongoose.connect(
  dbURL,
  dbConfig,
);
const db = mongoose.connection;

const Company = CompanyModel({mongoose})
const List = ListModel({mongoose})
const Product = ProductModel({mongoose})

module.exports = {
    Company,
    List,
    Product
}

