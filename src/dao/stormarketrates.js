const { MongoClient } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();
const Sport = require('../model/Sport');
const Event = require('../model/Event');
const Market = require('../model/Market');
const Selection = require('../model/Selection');

async function storemarketrates(marketrates) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  marketrates.forEach(async (element) => {
    try {
      await client.connect();
      const filter = { marketId: element.marketId };
      const update = {
        sportsId: (element.sportsId).toString(),
        eventId: (element.eventId).toString(),
        state: element.state,
        runners: element.runners,
        runnerData: {},
        marketId: element.marketId,
        isMarketDataVirtual: element.isMarketDataVirtual,
        isMarketDataDelayed: element.isMarketDataDelayed,
        highWaterMark: element.highWaterMark,
      };
      const sportsdata = await Sport.findOne({ sportId: update.sportsId }).exec();
      update.sportName = sportsdata?.sportName;
      const eventdata = await Event.findOne({ eventId: update.eventId }).exec();
      update.eventName = eventdata?.eventName;
      update.exEventId = eventdata?.exEventId;
      const marketdata = await Market.findOne({ marketId: update.marketId }).exec();
      update.marketName = marketdata?.marketName;
      update.exMarketId = marketdata?.exMarketId;
      update.betLimit = marketdata?.betLimit;
      const selectiondata = await Selection.find({ marketId: update.marketId }).exec();
      if (selectiondata.length > 0) {
        selectiondata.forEach((ele) => {
          update.runnerData[ele.selectionId] = ele.selectionName;
          update.marketTime = ele.marketTime;
        });
      }
      await client.db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
        .findOneAndUpdate(filter, { $set: update }, { upsert: true });
    } catch (err) {
      logger.error(err);
    }
  });
}

module.exports = { storemarketrates };
