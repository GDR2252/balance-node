const mongoose = require('mongoose');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/${process.env.EXCH_DB}`, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
  } catch (err) {
    logger.error(err);
  }
};

module.exports = connectDB;
