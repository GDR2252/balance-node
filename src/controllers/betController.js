const { MongoClient } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { setTimeout } = require('timers/promises');
const User = require('../model/User');
const CricketBetPlace = require('../model/CricketBetPlace');
const CricketPL = require('../model/CricketPL');
const ExposureManage = require('../model/ExposureManage');

const diff = ((a, b) => (a > b ? a - b : b - a));

async function placebet(req, res) {
  logger.info('Starting to place a bet.');
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const { body } = req;
  const {
    exEventId, exMarketId, stake, selectionId, type,
  } = body;
  let { odds } = body;
  let userdata = await User.findOne({ username: req.user });
  let { balance } = userdata;
  const numberstake = Number(stake);
  if (balance < numberstake) return res.status(401).json({ message: 'Cannot place bet. Balance is insufficient.' });
  const marketratesdata = await client.db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
    .findOne({ exMarketId });
  const { runners, eventName, runnerData } = marketratesdata;
  const marketlimit = marketratesdata.betLimit;
  const marketType = marketratesdata.marketName;
  let selectionName;
  Object.keys(runnerData).map((selection) => {
    if (selection === selectionId) { selectionName = runnerData[selection]; }
  });
  const min = marketlimit.split('-')[0].trim();
  const max = marketlimit.split('-')[1].trim();
  if (numberstake < Number(min) || numberstake > Number(max)) return res.status(401).json({ message: 'Cannot place bet. Stake is not within the limits.' });
  let laydata;
  let backdata;
  let profit;
  let loss;
  const selectionIds = [];
  const fselectionIds = [];
  const exposures = [];
  runners.forEach((element) => {
    const selId = element.selectionId.toString();
    if (selId === selectionId) {
      [backdata] = element.exchange.availableToBack;
      [laydata] = element.exchange.availableToLay;
      logger.info(backdata);
      if (type === 'back') {
        profit = (backdata.price - 1) * numberstake;
        const key = { [selId]: profit };
        selectionIds.push(key);
        fselectionIds.push({ [selId]: Math.round(profit) });
      }
      if (type === 'lay') {
        loss = -Math.abs((laydata.price - 1) * numberstake);
        const key = { [selId]: loss };
        selectionIds.push(key);
        exposures.push(loss);
        fselectionIds.push({ [selId]: Math.round(loss) });
      }
    } else {
      if (type === 'back') {
        loss = -Math.abs(numberstake);
        const key = { [selId]: loss };
        selectionIds.push(key);
        exposures.push(loss);
        fselectionIds.push(key);
      }
      if (type === 'lay') {
        profit = numberstake;
        const key = { [selId]: profit };
        selectionIds.push(key);
        fselectionIds.push(key);
      }
    }
  });
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
  // await setTimeout(5000);
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
      odds: parseFloat(odds),
      eventName,
      selectionName,
      marketType,
    });
    logger.info(`Placed bet for user: ${req.user}`);
    userdata.exposureLimit = numberstake;
    userdata.balance = balance - numberstake;
    await userdata.save();

    const balanceexposures = [];
    let prevVal;
    let newVal;
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
        o[k] = Math.round(key[k] + selectionIds[value][k]);
        balanceexposures.push(selectionIds[value][k]);
        if (k === selectionId) {
          prevVal = key[k];
          newVal = o[k];
        }
        return o;
      }, {}));
      const filter = { _id: plData[0]._id };
      const update = { selectionId: result };
      await CricketPL.findOneAndUpdate(filter, update).exec();
    }

    let exposure = Math.min(...exposures);
    const exposureval = diff(newVal, prevVal);
    logger.info(`Exposure: ${exposureval}`);
    const exposureData = await ExposureManage.aggregate([{
      $match: {
        exMarketId,
        username: req.user,
      },
    }]);
    if (!exposureData.length > 0) {
      await ExposureManage.create({
        exEventId,
        exMarketId,
        username: req.user,
        exposure,
      });
    } else {
      if (exposureval > 0) {
        exposure = Number(exposureData[0].exposure) + exposureval;
      } else {
        exposure = Number(exposureData[0].exposure) - exposureval;
      }
      const filter = { _id: exposureData[0]._id };
      const update = { exposure };
      await ExposureManage.findOneAndUpdate(filter, update).exec();
    }
    if (exposureval > 0) {
      userdata.exposure += exposureval;
      userdata.balance -= exposureval;
    } else {
      userdata.exposure -= exposureval;
      userdata.balance += exposureval;
    }
    await userdata.save();
    logger.info('Bet place ends.');
    res.json({ message: 'Bet placed successfully.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function fetchCricket(req, res) {
  const { body } = req;
  const { exEventId } = body;
  const betData = await CricketBetPlace.aggregate([{
    $match: {
      exEventId,
      username: req.user,
    },
  }]);
  if (!betData.length > 0) return res.status(404).json({ message: 'Bet Data not present.' });
  const retdata = betData.map((bets) => {
    delete bets._id;
    delete bets.__v;
    return bets;
  });
  return res.json(retdata);
}

module.exports = { placebet, fetchCricket };
