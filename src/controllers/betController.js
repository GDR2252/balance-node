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

  runners.forEach((element) => {
    if (element.selectionId.toString() === selectionId) {
      backdata = element.exchange.availableToBack[0];
      laydata = element.exchange.availableToLay[0];
      if (type === 'back') {
        profit = (backdata.price - 1) * stake;
        selectionIds.push(`${selectionId} : ${profit}`);
      }
      if (type === 'lay') {
        loss = (laydata.price - 1) % stake;
        selectionIds.push(`${selectionId} : ${loss}`);
      }
    } else {
      if (type === 'back') {
        loss = -Math.abs(stake);
        selectionIds.push(`${selectionId} : ${loss}`);
      }
      if (type === 'lay') {
        profit = stake;
        selectionIds.push(`${selectionId} : ${profit}`);
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
  balance = userdata;
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
    logger.info((balance - numberstake));
    userdata.exposureLimit = numberstake;
    userdata.balance = balance - numberstake;
    await userdata.save();
    await CricketPL.create({
      username: req.user,
      exEventId,
      exMarketId,
      selectionId: selectionIds,
    });
    res.json({ message: 'Bet placed successfully.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { placebet };
