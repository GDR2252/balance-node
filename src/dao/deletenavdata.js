const { MongoClient } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();

async function deleteNavData() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const result = await client.db(process.env.EXCH_DB).collection(process.env.NAV_COLLECTION)
      .deleteMany({});
    logger.info(`Deleted ${result.deletedCount} documents`);
  } catch (err) {
    logger.error(err);
  } finally {
    await client.close();
  }
}

module.exports = { deleteNavData };
