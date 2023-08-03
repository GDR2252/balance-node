const { MongoClient } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { setTimeout } = require('timers/promises');
const User = require('../model/User');
const Market = require('../model/Market');
const CricketBetPlace = require('../model/CricketBetPlace');
const CricketPL = require('../model/CricketPL');

async function placebet(req, res) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const { body } = req;
  logger.info(body);
  const {
    exEventId, exMarketId, stake, selectionId, type,
  } = body;
  let { odds } = body;
  let userdata = await User.findOne({ username: req.user });
  let { balance } = userdata;
  const numberstake = Number(stake);
  if (balance < numberstake) return res.status(401).json({ message: 'Cannot place bet. Balance is insufficient.' });
  const marketdata = await Market.findOne({ exMarketId });
  const marketlimit = marketdata.betLimit;
  const min = marketlimit.split('-')[0].trim();
  const max = marketlimit.split('-')[1].trim();
  logger.info(min);
  logger.info(max);
  logger.info(stake);
  logger.info(typeof stake);
  logger.info(typeof numberstake);
  logger.info(typeof balance);
  logger.info(Number(stake) < Number(min));
  logger.info(Number(stake) > Number(max));
  if (Number(stake) < Number(min) || Number(stake) > Number(max)) return res.status(401).json({ message: 'Cannot place bet. Stake is not within the limits.' });
  const marketratesdata = await client.db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
    .findOne({ exMarketId });
  const { runners } = marketratesdata;
  logger.info(JSON.stringify(runners));
  let laydata;
  let backdata;
  let profit;
  let loss;
  const selectionIds = [];
  const fselectionIds = [];
  runners.forEach((element) => {
    const selId = element.selectionId.toString();
    if (selId === selectionId) {
      backdata = element.exchange.availableToBack[0];
      laydata = element.exchange.availableToLay[0];
      if (type === 'back') {
        profit = (backdata.price - 1) * stake;
        const key = { [selId]: profit };
        logger.info(key);
        selectionIds.push(key);
        fselectionIds.push({ [selId]: Math.round(profit) });
      }
      if (type === 'lay') {
        loss = (laydata.price - 1) / stake;
        const key = { [selId]: loss };
        logger.info(key);
        selectionIds.push(key);
        fselectionIds.push({ [selId]: Math.round(loss) });
      }
    } else {
      if (type === 'back') {
        loss = -Math.abs(stake);
        const key = { [selId]: loss };
        selectionIds.push(key);
        fselectionIds.push(key);
      }
      if (type === 'lay') {
        profit = stake;
        const key = { [selId]: profit };
        selectionIds.push(key);
        fselectionIds.push(key);
      }
    }
  });
  logger.info(backdata);
  logger.info(laydata);
  if (type === 'back') {
    const backprice = backdata.price - 1;
    odds -= 1;
    if (odds > backprice) return res.status(401).json({ message: 'Cannot place bet. Odds is not correct.' });
  }
  if (type === 'lay') {
    const layprice = laydata.price - 1;
    odds -= 1;
    if (odds < layprice) return res.status(401).json({ message: 'Cannot place bet. Odds is not correct.' });
  }
  await setTimeout(5000);
  logger.info('Waited for 5 secs.');
  userdata = await User.findOne({ username: req.user });
  balance = userdata.balance;
  if (balance < Number(stake)) return res.status(401).json({ message: 'Cannot place bet. Balance is insufficient.' });
  try {
    await CricketBetPlace.create({
      username: req.user,
      exEventId,
      exMarketId,
      stake,
      selectionId,
      type,
    });
    logger.info(`Placed bet for user: ${req.user}`);
    logger.info(numberstake);
    logger.info(balance);
    logger.info(typeof balance);
    logger.info(balance - numberstake);
    logger.info(balance - stake);
    userdata.exposureLimit = numberstake;
    userdata.balance = balance - numberstake;
    await userdata.save();

    const plData = await CricketPL.aggregate([{
      $match: {
        exMarketId,
        username: req.user,
      },
    }]);
    if (!plData.length > 0) {
      await CricketPL.create({
        username: req.user,
        exEventId,
        exMarketId,
        selectionId: fselectionIds,
      });
    } else {
      const selectionData = plData[0].selectionId;
      const result = selectionData.map((key, value) => Object.keys(key).reduce((o, k) => {
        o[k] = key[k] + selectionIds[value][k];
        return o;
      }, {}));
      logger.info(result);
      const filter = { _id: plData[0]._id };
      const update = { selectionId: result };
      await CricketPL.findOneAndUpdate(filter, update).exec();
    }
    res.json({ message: 'Bet placed successfully.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { placebet };
