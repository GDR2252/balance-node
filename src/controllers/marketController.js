const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { MongoClient } = require('mongodb');
const Sport = require('../model/Sport');
const Event = require('../model/Event');
const Market = require('../model/Market');
const Selection = require('../model/Selection');
require('dotenv').config();

async function addMarkets(req, res) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const { marketId } = req.body;
  const { body } = req;
  logger.debug(body);
  const duplicate = await Market.findOne({ marketId }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add market. Market already present.' });
  try {
    const data = JSON.stringify({
      marketId,
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.HELPER_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      data,
    };

    const helperres = await axios.request(config);
    const eventypes = helperres.data.eventTypes;
    const sportsId = eventypes[0].eventTypeId;
    const marketnodes = eventypes[0].eventNodes[0].marketNodes[0];
    const { marketTime } = marketnodes.description;
    const { runners } = marketnodes;
    const events = await Event.findOne({ eventId: body.eventId });
    const result = await Market.create({
      marketId,
      exMarketId: crypto.randomBytes(16).toString('hex'),
      sportId: body.sportId,
      tournamentsId: body.tournamentsId,
      eventId: body.eventId,
      exEventId: events.exEventId,
      spreadexId: events.spreadexId,
      marketName: body.marketName,
      betLimit: body.betLimit,
      marketTime,
      marketType: 'match_odds',
      isFancy: body.isFancy || false,
      isBookmakers: body.isBookmakers || false,
      isStreaming: body.isStreaming || false,
      isVirtual: body.isVirtual || false,
      isSportsbook: body.isSportsbook || false,
      isCasinoGame: body.isCasinoGame || false,
      isPreBet: body.isPreBet || false,
    });
    logger.debug(result);

    runners.forEach(async (element) => {
      const { selectionId } = element;
      const selectionName = element.description.runnerName;
      const selfilter = { selectionId };
      const selupdate = {
        selectionId,
        selectionName,
        sportsId,
      };
      await Selection.findOneAndUpdate(selfilter, { $set: selupdate }, { upsert: true });
    });

    const filter = { marketId: marketnodes.marketId };
    const update = {
      sportsId: sportsId.toString(),
      eventId: eventypes[0].eventNodes[0].eventId.toString(),
      state: marketnodes.state,
      runners: marketnodes.runners,
      runnerData: {},
      marketId: marketnodes.marketId,
      isMarketDataVirtual: marketnodes.isMarketDataVirtual,
      isMarketDataDelayed: marketnodes.isMarketDataDelayed,
    };
    const sportsdata = await Sport.findOne({ sportId: update.sportsId }).exec();
    update.sportName = sportsdata?.sportName;
    const eventdata = await Event.findOne({ eventId: update.eventId }).exec();
    update.eventName = eventdata?.eventName;
    update.exEventId = eventdata?.exEventId;
    update.spreadexId = eventdata?.spreadexId;
    const marketdata = await Market.findOne({ marketId: update.marketId }).exec();
    update.marketName = marketdata?.marketName;
    update.exMarketId = marketdata?.exMarketId;
    update.betLimit = marketdata?.betLimit;
    update.marketTime = marketdata?.marketTime;
    for (let j = 0; j < update.runners.length; j += 1) {
      update.runnerData[update.runners[j].selectionId] = update
        .runners[j].description.runnerName;
    }
    await client.db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
      .findOneAndUpdate(filter, { $set: update }, { upsert: true });

    res.status(201).json({ message: `New market ${marketId} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function fetchMarkets(req, res) {
  const { sportId } = req.query;
  const { tournamentsId } = req.query;
  const { eventId } = req.query;
  try {
    const result = await Market.find({ sportId, tournamentsId, eventId });
    logger.debug(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateMarkets(req, res) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const { marketId } = req.body;
  const { body } = req;
  logger.debug(body);
  const data = await Market.findOne({ marketId }).exec();
  if (!data) return res.status(404).json({ message: 'Cannot update market. Market not present.' });
  try {
    const filter = { marketId };
    const update = {
      marketName: body.marketName,
      marketType: body.marketType,
      betLimit: body.betLimit,
      isFancy: body.isFancy,
      isBookmakers: body.isBookmakers,
      isStreaming: body.isStreaming,
      isVirtual: body.isVirtual,
      isSportsbook: body.isSportsbook,
      isCasinoGame: body.isCasinoGame,
      isPreBet: body.isPreBet,
    };
    const result = await Market.findOneAndUpdate(filter, update);
    logger.info(result);
    if (body.betLimit) {
      const marketratesfilter = { marketId };
      const marketratesupdate = {
        betLimit: body.betLimit,
      };
      await client.db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
        .findOneAndUpdate(marketratesfilter, { $set: marketratesupdate }, { upsert: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteMarkets(req, res) {
  const { marketId } = req.query;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const data = await client.db(process.env.EXCH_DB).collection('markets').findOne({ marketId });
    if (!data) return res.status(404).json({ message: 'Cannot delete market. Market not present.' });
    const result = await client.db(process.env.EXCH_DB).collection('markets').deleteOne({
      marketId,
    });
    logger.debug(result);
    const mrresult = await client.db(process.env.EXCH_DB).collection('marketRates').deleteOne({
      marketId,
    });
    logger.debug(mrresult);
    res.status(201).json({ success: `Market ${marketId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      client.close();
    }
  }
}

module.exports = {
  addMarkets, fetchMarkets, updateMarkets, deleteMarkets,
};
