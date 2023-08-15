const { MongoClient, Double } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { setTimeout } = require('timers/promises');
const CricketBetPlace = require('../model/CricketBetPlace');
const CricketPL = require('../model/CricketPL');

const diff = ((a, b) => (a > b ? a - b : b - a));

async function placebet(req, res) {
  const transactionOptions = {
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' },
    readPreference: 'primary',
  };
  logger.info('Starting to place a bet.');
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  // const session = client.startSession();
  try {
    // session.startTransaction(transactionOptions);
    const { body } = req;
    const {
      exEventId, exMarketId, stake, selectionId, type,
    } = body;
    let { odds } = body;
    const userOdds = odds;
    let userdata = await client
      .db(process.env.EXCH_DB).collection('users').findOne({ username: req.user });
      // , { session }
    let { balance } = userdata;
    logger.info(balance);
    const numberstake = Number(stake);
    if (balance < numberstake) return res.status(401).json({ message: 'Cannot place bet. Balance is insufficient.' });
    const marketratesdata = await client
      .db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
      .findOne({ exMarketId });
      // , { session }
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
    let pl;
    let prevVal = 0;
    let newVal = 0;
    const selectionIds = [];
    const fselectionIds = [];
    const exposures = [];
    runners.forEach((element) => {
      const selId = element.selectionId.toString();
      if (selId === selectionId) {
        backdata = element.exchange.availableToBack[0];
        laydata = element.exchange.availableToLay[0];
        if (type === 'back') {
          profit = Number(Number((userOdds - 1) * numberstake).toFixed(2));
          pl = profit;
          const key = { [selId]: profit };
          newVal = -Math.abs(numberstake);
          selectionIds.push(key);
          fselectionIds.push({ [selId]: Math.round(profit) });
        }
        if (type === 'lay') {
          loss = -Math.abs(numberstake);
          pl = loss;
          exposures.push(loss);
          const key = { [selId]: loss };
          selectionIds.push(key);
          newVal = numberstake;
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
          profit = Number(Number((userOdds - 1) * numberstake).toFixed(2));
          const key = { [selId]: profit };
          logger.info(key);
          selectionIds.push(key);
          fselectionIds.push(key);
          logger.info(fselectionIds);
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
    await setTimeout(5000);
    logger.info('Waited for 5 secs.');
    userdata = await client.db(process.env.EXCH_DB).collection('users').findOne({ username: req.user });
    // , { session }
    balance = userdata.balance;
    logger.info(balance);
    if (balance < Number(stake)) return res.status(401).json({ message: 'Cannot place bet. Balance is insufficient.' });
    await client.db(process.env.EXCH_DB).collection('cricketbetplaces').insertOne({
      username: req.user,
      exEventId,
      exMarketId,
      stake,
      selectionId,
      type,
      pl,
      odds: parseFloat(userOdds),
      eventName,
      selectionName,
      marketType,
      createdAt: new Date(),
      upddatedAt: new Date(),
    });
    // , { session }
    logger.info(`Placed bet for user: ${req.user}`);
    const balanceexposures = [];
    const oldbalanceexposures = [];
    const plData = await client.db(process.env.EXCH_DB).collection('cricketpls').find({
      exMarketId,
      username: req.user,
    }).toArray();
    // , { session }
    if (!plData.length > 0) {
      logger.info(fselectionIds);
      await client.db(process.env.EXCH_DB).collection('cricketpls').insertOne({
        username: req.user,
        exEventId,
        exMarketId,
        selectionId: fselectionIds,
      });
      // , { session }
    } else {
      const selectionData = plData[0].selectionId;
      const result = selectionData.map((key, value) => Object.keys(key).reduce((o, k) => {
        o[k] = Math.round(key[k] + selectionIds[value][k]);
        if (key[k] < 0) {
          oldbalanceexposures.push(key[k]);
        } else {
          oldbalanceexposures.push(0);
        }
        if (o[k] < 0) {
          balanceexposures.push(o[k]);
        } else {
          balanceexposures.push(0);
        }
        return o;
      }, {}));
      prevVal = Math.min(...oldbalanceexposures);
      newVal = Math.min(...balanceexposures);
      const filter = { _id: plData[0]._id };
      const update = { selectionId: result };
      await client.db(process.env.EXCH_DB).collection('cricketpls').updateOne(
        filter,
        { $set: update },
        // { session },
      );
    }
    let exposure = Math.min(...exposures);
    const exposureData = await client.db(process.env.EXCH_DB).collection('exposuremanages').find({
      exMarketId,
      username: req.user,
    }).toArray();
    // , { session }
    if (!exposureData.length > 0) {
      await client.db(process.env.EXCH_DB).collection('exposuremanages').insertOne({
        exEventId,
        exMarketId,
        username: req.user,
        exposure,
      });
      // , { session }
    } else {
      const filter = { _id: exposureData[0]._id };
      const update = { exposure };
      await client.db(process.env.EXCH_DB).collection('exposuremanages').updateOne(
        filter,
        { $set: update },
        // { session },
      );
    }
    if (prevVal) {
      exposure = userdata.exposure - Math.abs(prevVal);
      balance = userdata.balance + Math.abs(prevVal);
      exposure += Math.abs(newVal);
      balance -= Math.abs(newVal);
    } else {
      exposure = userdata.exposure + Math.abs(newVal);
      balance = userdata.balance - Math.abs(newVal);
    }
    await client.db(process.env.EXCH_DB).collection('users').updateOne(
      { username: req.user },
      { $set: { exposure, balance } },
      // { session },
    );
    // await session.commitTransaction();
    logger.info('Transaction successfully committed.');
    logger.info('Bet place ends.');
    res.json({ message: 'Bet placed successfully.' });
  } catch (err) {
    logger.error(err);
    // await session.abortTransaction();
    logger.info('Transaction rolled back.');
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      // await session.endSession();
      await client.close();
    }
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
  if (betData.length > 0) {
    const retdata = betData.map((bets) => {
      delete bets.__v;
      return bets;
    });
    return res.json(retdata);
  }
}

async function fetchPl(req, res) {
  const { body } = req;
  const { exEventId } = body;
  const betData = await CricketPL.aggregate([{
    $match: {
      exEventId,
      username: req.user,
    },
  }]);
  if (betData.length > 0) {
    const retdata = betData.map((bets) => {
      delete bets.__v;
      return bets;
    });
    return res.json(retdata);
  }
}

module.exports = { placebet, fetchCricket, fetchPl };
