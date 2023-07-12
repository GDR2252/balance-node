const { MongoClient } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();

async function storemarketrates(marketrates) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  marketrates.forEach(async (element) => {
    try {
      await client.connect();
      const filter = { marketId: element.marketId };
      const update = {
        state: element.state,
        runners: element.runners,
        marketId: element.marketId,
        isMarketDataVirtual: element.isMarketDataVirtual,
        isMarketDataDelayed: element.isMarketDataDelayed,
        highWaterMark: element.highWaterMark,
        lastChanged: new Date().toISOString(),
      };
      await client.db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
        .findOneAndUpdate(filter, { $set: update }, { upsert: true });
    } catch (err) {
      logger.error(err);
    } finally {
      await client.close();
    }
  });
}

module.exports = { storemarketrates };
