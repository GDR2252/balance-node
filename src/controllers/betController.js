/* eslint-disable operator-assignment */
const { MongoClient } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { setTimeout } = require('timers/promises');
const moment = require('moment-timezone');
const CricketBetPlace = require('../model/CricketBetPlace');
const CricketPL = require('../model/CricketPL');
const User = require('../model/User');
const pick = require('../utils/pick');
const CricketResult = require('../model/CricketResult');
const AvplaceBet = require('../model/AvplaceBet');
const { getFilterProfitLoss } = require('./userController');

async function placebet(req, res) {
  const transactionOptions = {
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' },
    readPreference: 'primary',
  };
  logger.info('Starting to place a bet.');
  const client = new MongoClient(process.env.MONGO_URI);
  const session = client.startSession();
  try {
    session.startTransaction(transactionOptions);
    const { body } = req;
    const {
      exEventId, exMarketId, stake, selectionId, type,
    } = body;
    let { odds } = body;
    const userOdds = odds;
    let userdata = await client.db(process.env.EXCH_DB).collection('users').findOne({ username: req.user }, { session });
    let { balance } = userdata;
    const numberstake = Number(stake);
    const marketratesdata = await client
      .db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
      .findOne({ exMarketId }, { session });
    const {
      runners, eventName, runnerData, sportsId, sportName, state, isPreBet,
    } = marketratesdata;
    const mrktType = marketratesdata.type;
    const betlockdata = await client.db(process.env.EXCH_DB).collection('betlocks').find({ userId: { $in: userdata.parentId } }, { session }).toArray();
    if (betlockdata.length > 0) {
      for (let i = 0; i < betlockdata.length; i += 1) {
        if ((betlockdata[i].type === 'market' && exMarketId === betlockdata[i].eventId) || (betlockdata[i].type === 'event' && exEventId === betlockdata[i].eventId) || (betlockdata[i].type === 'sport' && sportsId === betlockdata[i].eventId)) {
          return res.status(400).json({ message: 'Cannot place bet. Bet is locked.' });
        }
      }
    }

    let selectionStatus;
    for (let i = 0; i < runners.length; i += 1) {
      if ((runners[i].selectionId).toString() === selectionId) {
        selectionStatus = runners[i].state.status;
      }
    }
    if (mrktType === 'match_odds') {
      if ((!state.inplay && !isPreBet) || state.status !== 'OPEN' || selectionStatus !== 'ACTIVE') {
        return res.status(400).json({ message: 'Cannot place bet.' });
      }
    } else if (mrktType === 'fancy' || mrktType === 'bookmaker' || mrktType === 'line_market') {
      if (state.status !== 'ACTIVE') {
        return res.status(400).json({ message: 'Cannot place bet.' });
      }
    }
    const marketlimit = marketratesdata.betLimit;
    const marketType = marketratesdata.marketName;
    let selectionName;
    Object.keys(runnerData).map((selection) => {
      if (selection === selectionId) { selectionName = runnerData[selection]; }
    });
    const min = marketlimit.split('-')[0].trim();
    const max = marketlimit.split('-')[1].trim();
    if (numberstake < Number(min) || numberstake > Number(max)) return res.status(400).json({ message: 'Cannot place bet. Stake is not within the limits.' });
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
    if (mrktType === 'match_odds' || mrktType === 'bookmaker') {
      if (Number.isNaN(balance) || (balance < Number(stake))) return res.status(400).json({ message: 'Cannot place bet. Balance is insufficient.' });
      runners.forEach((element) => {
        const selId = element.selectionId.toString();
        if (selId === selectionId) {
          if (type === 'back') {
            backdata = element.exchange.availableToBack[0];
            profit = Number(Number((userOdds - 1) * numberstake).toFixed(2));
            pl = profit;
            const key = { [selId]: profit };
            newVal = -Math.abs(numberstake);
            selectionIds.push(key);
            fselectionIds.push({ [selId]: Math.round(profit) });
          }
          if (type === 'lay') {
            laydata = element.exchange.availableToLay[0];
            loss = -Math.abs(Number(Number((userOdds - 1) * numberstake).toFixed(2)));
            pl = loss;
            exposures.push(loss);
            const key = { [selId]: loss };
            selectionIds.push(key);
            newVal = loss;
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
            logger.info(key);
            selectionIds.push(key);
            fselectionIds.push(key);
            logger.info(fselectionIds);
          }
        }
      });
      const created = new Date();
      if (mrktType === 'match_odds') {
        await setTimeout(5000);
        logger.info('Waited for 5 secs.');
      } else if (mrktType === 'bookmaker') {
        await setTimeout(state.betDelay * 1000);
        logger.info(`Waited for ${state.betDelay} secs.`);
      }
      if (type === 'back') {
        const backprice = backdata.price - 1;
        odds -= 1;
        if (odds > backprice) return res.status(400).json({ message: 'Cannot place bet. Odds is not correct.' });
      }
      if (type === 'lay') {
        const layprice = laydata.price - 1;
        odds -= 1;
        if (odds < layprice) return res.status(400).json({ message: 'Cannot place bet. Odds is not correct.' });
      }

      userdata = await client.db(process.env.EXCH_DB).collection('users').findOne({ username: req.user }, { session });
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
        sportId: sportsId,
        sportName,
        IsSettle: 0,
        IsVoid: 0,
        IsUnsettle: 1,
        createdAt: created,
        updatedAt: created,
        matchedTime: new Date(),
      }, { session });
      logger.info(`Placed bet for user: ${req.user}`);
      const balanceexposures = [];
      const oldbalanceexposures = [];
      const plData = await client.db(process.env.EXCH_DB).collection('cricketpls').find({
        exMarketId,
        username: req.user,
      }, { session }).toArray();
      if (!plData.length > 0) {
        await client.db(process.env.EXCH_DB).collection('cricketpls').insertOne({
          username: req.user,
          exEventId,
          exMarketId,
          selectionId: fselectionIds,
          IsSettle: 0,
          IsVoid: 0,
          IsUnsettle: 1,
          type: mrktType,
        }, { session });
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
          { session },
        );
      }
      let exposure = Math.min(...exposures);
      const exposureData = await client.db(process.env.EXCH_DB).collection('exposuremanages').find({
        exMarketId,
        username: req.user,
      }, { session }).toArray();
      const placebetcondition = newVal < exposure;
      logger.info(`exposure: ${exposure}`);
      logger.info(`newVal: ${newVal}`);
      logger.info(placebetcondition);
      balance = userdata.balance;
      if (Number.isNaN(balance) || (balance < Number(stake) && !placebetcondition)) return res.status(400).json({ message: 'Cannot place bet. Balance is insufficient.' });
      if (!exposureData.length > 0) {
        await client.db(process.env.EXCH_DB).collection('exposuremanages').insertOne({
          exEventId,
          exMarketId,
          username: req.user,
          exposure,
        }, { session });
      } else {
        const filter = { _id: exposureData[0]._id };
        const update = { exposure };
        await client.db(process.env.EXCH_DB).collection('exposuremanages').updateOne(
          filter,
          { $set: update },
          { session },
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
      if (exposure > userdata.exposureLimit) return res.status(400).json({ message: 'Cannot place bet. Please check Exposure Limit.' });
      await client.db(process.env.EXCH_DB).collection('users').updateOne(
        { username: req.user },
        { $set: { exposure, balance } },
        { session },
      );
      if (mrktType === 'bookmaker') {
        const totalMatched = state.totalMatched + numberstake;
        await client
          .db(process.env.EXCH_DB).collection(process.env.MR_COLLECTION)
          .updateOne({ exMarketId }, { $set: { 'state.totalMatched': totalMatched } }, { session });
      }
    } else if (mrktType === 'fancy' || mrktType === 'line_market') {
      if (type === 'yes') {
        if (Number.isNaN(balance) || balance < numberstake) return res.status(400).json({ message: 'Cannot place bet. Balance is insufficient.' });
      } else if (type === 'no') {
        if (Number.isNaN(balance) || balance < pl) return res.status(400).json({ message: 'Cannot place bet. Balance is insufficient.' });
      }
      let fancyOdds;
      if (type === 'yes') {
        backdata = runners[0].exchange.availableToBack[0];
        pl = numberstake * (backdata.size / 100);
        fancyOdds = backdata.price;
      }
      if (type === 'no') {
        laydata = runners[0].exchange.availableToLay[0];
        pl = numberstake * (laydata.size / 100);
        fancyOdds = laydata.price;
      }

      await setTimeout(state.betDelay * 1000);
      logger.info(`Waited for ${state.betDelay} secs.`);

      userdata = await client.db(process.env.EXCH_DB).collection('users').findOne({ username: req.user }, { session });
      if (type === 'yes') {
        if (Number.isNaN(balance) || balance < numberstake) return res.status(400).json({ message: 'Cannot place bet. Balance is insufficient.' });
      } else if (type === 'no') {
        if (Number.isNaN(balance) || balance < pl) return res.status(400).json({ message: 'Cannot place bet. Balance is insufficient.' });
      }

      await client.db(process.env.EXCH_DB).collection('cricketbetplaces').insertOne({
        username: req.user,
        exEventId,
        exMarketId,
        stake,
        selectionId,
        type,
        pl,
        odds: fancyOdds,
        eventName,
        selectionName,
        marketType,
        sportId: sportsId,
        sportName,
        IsSettle: 0,
        IsVoid: 0,
        IsUnsettle: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { session });
      logger.info(`Placed bet for user: ${req.user}`);
      const plData = await client.db(process.env.EXCH_DB).collection('cricketpls').find({
        exMarketId,
        username: req.user,
      }, { session }).toArray();

      for (let arr = 0; arr <= 1000; arr += 1) {
        if (type === 'yes') {
          if (arr < fancyOdds) {
            fselectionIds[arr] = -numberstake;
          } else if (arr >= fancyOdds) {
            fselectionIds[arr] = pl;
          }
        } else if (type === 'no') {
          if (arr < fancyOdds) {
            fselectionIds[arr] = numberstake;
          } else if (arr >= fancyOdds) {
            fselectionIds[arr] = -pl;
          }
        }
      }
      let resultPl = [];
      let negativeResultPl = [];
      if (!plData.length > 0) {
        await client.db(process.env.EXCH_DB).collection('cricketpls').insertOne({
          username: req.user,
          exEventId,
          exMarketId,
          selectionId: fselectionIds,
          IsSettle: 0,
          IsVoid: 0,
          IsUnsettle: 1,
          type: mrktType,
        }, { session });
      } else {
        const oldPl = plData[0].selectionId;
        resultPl = oldPl.map((num, idx) => num + fselectionIds[idx]);
        const negNum = (values) => values < 0;
        negativeResultPl = resultPl.filter(negNum);
        logger.info(negativeResultPl);
        const filter = { _id: plData[0]._id };
        const update = { selectionId: resultPl };
        await client.db(process.env.EXCH_DB).collection('cricketpls').updateOne(
          filter,
          { $set: update },
          { session },
        );
      }
      let exposure;

      const exposureData = await client.db(process.env.EXCH_DB).collection('exposuremanages').find({
        exMarketId,
        username: req.user,
      }, { session }).toArray();
      if (!exposureData.length > 0) {
        if (type === 'yes') {
          balance = userdata.balance - numberstake;
          exposure = userdata.exposure + numberstake;
        } else if (type === 'no') {
          balance = userdata.balance - pl;
          exposure = userdata.exposure + pl;
        }
        await client.db(process.env.EXCH_DB).collection('exposuremanages').insertOne({
          exEventId,
          exMarketId,
          username: req.user,
          exposure,
        }, { session });
      } else {
        balance = exposureData[0].exposure + userdata.balance;
        exposure = userdata.exposure - exposureData[0].exposure;
        let newExposure;
        if (negativeResultPl.length > 0) {
          newExposure = Math.max(...negativeResultPl);
          logger.info(newExposure);
        } else {
          newExposure = 0;
          logger.info(newExposure);
        }
        balance = balance + newExposure;
        exposure = exposure - newExposure;
        const filter = { _id: exposureData[0]._id };
        const update = { exposure };
        await client.db(process.env.EXCH_DB).collection('exposuremanages').updateOne(
          filter,
          { $set: update },
          { session },
        );
      }
      if (exposure > userdata.exposureLimit) return res.status(400).json({ message: 'Cannot place bet. Please check Exposure Limit.' });
      await client.db(process.env.EXCH_DB).collection('users').updateOne(
        { username: req.user },
        { $set: { exposure, balance } },
        { session },
      );
    }
    await session.commitTransaction();
    logger.info('Transaction successfully committed.');
    logger.info('Bet place ends.');
    res.json({ message: 'Bet placed successfully.' });
  } catch (err) {
    logger.error(err);
    await session.abortTransaction();
    logger.info('Transaction rolled back.');
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      await session.endSession();
      await client.close();
    }
  }
}

async function fetchCricket(req, res) {
  const { exEventId } = req.query;
  if (exEventId) {
    let match = {};
    if (exEventId === 'ALL') {
      match = {
        username: req.user,
        IsUnsettle: 1,
      };
    } else {
      match = {
        exEventId,
        username: req.user,
        IsUnsettle: 1,
      };
    }
    const betData = await CricketBetPlace.aggregate([{
      $match: match,
    }]);
    if (betData.length > 0) {
      const retdata = betData.map((bets) => {
        delete bets.__v;
        return bets;
      });
      return res.json(retdata);
    }
    return res.status(200).json([]);
  }
  return res.status(200).json([]);
}

async function fetchCricketBetMenu(req, res) {
  const betData = await CricketBetPlace.aggregate([{
    $match: {
      username: req.user,
      IsUnsettle: 1,
    },
  }, {
    $project: {
      exEventId: 1,
      eventName: 1,
    },
  }]);
  if (betData.length > 0) {
    const retdata = betData.map((bets) => {
      delete bets._id;
      return bets;
    });
    const set = new Set(retdata.map((item) => JSON.stringify(item)));
    const uniqdata = [...set].map((item) => JSON.parse(item));
    return res.json(uniqdata);
  }
  return res.status(201).json([]);
}

async function fetchPl(req, res) {
  const { exEventId } = req.query;
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
  return res.status(201).json([]);
}

async function history(req, res) {
  const filter = pick(req?.query, ['marketType', 'sportName', 'status', 'from', 'to']);
  const options = pick(req?.query, ['sortBy', 'limit', 'page']);
  filter.username = req?.user;

  if ((filter?.from && filter?.from !== '') && (filter?.to && filter?.to !== '')) {
    delete filter.createdAt;
    const date1 = new Date(filter?.from);
    const date2 = new Date(filter?.to);
    date2.setHours(23, 59, 59, 999);
    const timeDifferenceMs = date2 - date1;
    const millisecondsIn30Days = 1000 * 60 * 60 * 24 * 30;
    if (timeDifferenceMs >= millisecondsIn30Days) {
      return res.status(500).json({ error: 'Please select only 30 days range only.' });
    }
    filter.createdAt = {
      $gte: new Date(date1),
      $lte: new Date(date2),
    };
    delete filter.to;
    delete filter.from;
  }

  if (filter?.to) {
    filter.createdAt = new Date(filter.to);
    delete filter.to;
  }

  if (filter?.from) {
    filter.createdAt = new Date(filter.from);
    delete filter.from;
  }
  if (filter.status) {
    if (filter.status === 'settle') { filter.IsSettle = 1; } else if (filter.status === 'unsettle') { filter.IsUnsettle = 1; } else { filter.IsVoid = 1; }
    delete filter.status;
  }
  const data = await CricketBetPlace.paginate(filter, options);

  const resData = [];
  data?.results.forEach((item) => {
    const itemData = {
      username: item?.username,
      odds: item.odds > 0 ? parseFloat(item.odds.toString()) : 0,
      pl: item.pl > 0 ? parseFloat(item.pl.toString()) : 0,
      _id: item?._id,
      stake: item?.stake,
      type: item?.type,
      eventName: item?.eventName,
      selectionName: item?.selectionName,
      marketType: item?.marketType,
      createdAt: item?.createdAt,
      updatedAt: item?.updatedAt,
      selectionId: item?.selectionId,
      sportName: item?.sportName || '',
    };

    resData.push(itemData);
  }),

  data.results = resData;
  res.status(200).json({ data });
}

async function putresults(req, res) {
  const { body } = req;
  try {
    await CricketResult.create({
      eventName: body.eventName,
      exEventId: body.exEventId,
      exMarketId: body.exMarketId,
      marketType: body.marketType,
      winner: body.winner,
      sportName: body.sportName,
      sportsId: body.sportsId,
    });
    res.status(200).json({ message: 'Data created successfully!' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function aviatorPl(req, res) {
  try {
    const profile = await User.findOne({ username: req.user }).exec();
    if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });

    const options = pick(req?.query, ['sortBy', 'limit', 'page']);
    const filter = pick(req?.query, ['from', 'to', 'timeZone']);

    if ((filter?.from && filter?.from !== '') && (filter?.to && filter?.to !== '')) {
      const timeZone = filter.timeZone || 'Asia/Calcutta';
      const startDate = moment.tz(filter?.from, timeZone);
      const endDate = moment.tz(filter?.to, timeZone);

      const date1 = startDate.clone().startOf('day');
      const date2 = endDate.clone().endOf('day');
      const timeDifferenceMs = date2.diff(date1, 'days');
      if (timeDifferenceMs > 30) {
        return res.status(400).json({ error: 'Please select only 30 days range only.' });
      }
      filter.createdAt = {
        $gte: date1.toDate(),
        $lt: date2.toDate(),
      };
      delete filter.from;
      delete filter.to;
      delete filter.timeZone;
    }
    filter.user = req.user;
    const data = await AvplaceBet.paginate(filter, options);
    return res.json(data);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function casinoPl(req, res) {
  try {
    const foundUser = await User.findOne({ username: req.user }).exec();
    const client = new MongoClient(process.env.MONGO_URI);
    if (!foundUser) {
      res.status(400).json({ message: 'User not found.' });
    }
    const data = await client.db(process.env.EXCH_DB).collection('auracsplacebets').aggregate([{
      $match: { userId: foundUser._id.toString() },
    },
    {
      $group: {
        _id: '$betInfo.roundId',
        data: { $push: '$$ROOT' },
      },
    },
    {
      $project: {
        _id: 0,
        roundId: '$_id',
        matchName: { $first: '$data.matchName' },
        marketName: { $first: '$data.marketName' },
      },
    },
    ]);

    const result = await data.toArray();
    return res.json(result);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function fetchCasinoByRound(req, res) {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    const { roundId } = req.query;
    const data = await client.db(process.env.EXCH_DB).collection('auracsresults').findOne({ roundId });
    if (!data) {
      res.status(400).json({ message: 'result not available' });
    }
    // const result = await data.toArray();
    const participate = data.result[0].marketRunner || [];

    const bets = await client.db(process.env.EXCH_DB).collection('auracsplacebets').aggregate([
      {
        $match: { 'betInfo.roundId': roundId },
      },
      {
        $unwind: '$runners', // Split the array into separate documents
      },
      {
        $group: {
          _id: '$runners.id', // Group by runner id
          totalPl: {
            $sum: '$runners.pl', // Sum the pl values for each runner
          },
        },
      },
    ]);
    const result = await bets.toArray();

    const resultMap = {};

    // Populate the resultMap with the values from the result array
    result.map((player) => resultMap[player._id] = player.totalPl);

    // Update the participate array with the totalPl values based on id
    const finalParticipate = [];
    participate.map((player) => {
      const item = player;
      const totalPl = resultMap[player.id];
      if (totalPl !== undefined) {
        item.totalPl = totalPl;
      }
      finalParticipate.push(item);
    });
    data.result[0].marketRunner = finalParticipate;
    return res.json(data);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function aviatorSumOfPl(req, res) {
  try {
    const profile = await User.findOne({ username: req.user }).exec();
    if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
    const filters = pick(req?.query, ['from', 'to', 'timeZone']);
    const dateData = getFilterProfitLoss(filters);
    if (dateData.error === 1) {
      return res.status(400).json({ error: 'Please select only 30 days range only.' });
    }
    let filter = {
      user: req.user,
    };

    if (dateData.filteredData) {
      const filterData = dateData.filteredData;
      filter = { ...filter, ...filterData };
    }
    const result = await AvplaceBet.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: req.user,
          total: {
            $sum: { $subtract: ['$pl', '$stack'] },
          },
        },
      },
    ]);
    let data = { total: 0, _id: req.user };
    if (result.length > 0) {
      data = { ...result[0], total: (result[0]?.total || 0).toFixed(2) };
    }
    return res.json(data);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  placebet,
  fetchCricket,
  fetchPl,
  history,
  putresults,
  fetchCricketBetMenu,
  aviatorPl,
  casinoPl,
  fetchCasinoByRound,
  aviatorSumOfPl,
};
