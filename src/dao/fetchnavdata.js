const { MongoClient } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();

async function fetchNavData() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  let results = [];
  try {
    await client.connect();
    const cursor = await client.db(process.env.EXCH_DB).collection(process.env.NAV_COLLECTION).find({});
    results = await cursor.toArray();
  } catch (err) {
    logger.error(err);
  } finally {
    await client.close();
  }
  return results;
}

module.exports = { fetchNavData };
