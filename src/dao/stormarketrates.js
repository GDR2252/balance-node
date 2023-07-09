const { MongoClient } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();

async function storemarketrates(marketrates) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const result = await client.db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
      .insertMany(marketrates);
    logger.info(`${result.insertedCount} new listings created with the following ids:`);
    logger.info(result.insertedIds);
  } catch (err) {
    logger.error(err);
  } finally {
    await client.close();
  }
}

module.exports = { storemarketrates };
