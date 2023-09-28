const path = require('path');
const { MongoClient } = require('mongodb');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const bcrypt = require('bcrypt');
const moment = require('moment-timezone');
const User = require('../model/User');
const Stake = require('../model/Stake');
const { sendSMS, verifySMS } = require('./smsapiController');
const pick = require('../utils/pick');
const Trader = require('../model/Trader');
const CricketBetPlace = require('../model/CricketBetPlace');
const Reporting = require('../model/Reporting');

const getBalance = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
  const data = {
    balance: profile.balance,
    exposure: profile.exposure,
    redeemBalance: profile.redeemBalance,
  };
  res.json({ data });
};

const updateBalance = async (req, res) => {
  try {
    const profile = await User.findOne({ username: req.user }).exec();
    if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
    if (profile.redeemBalance === 0) return res.status(401).json({ message: 'Redeem Balance is 0. Cannot be redeemed.' });
    const balance = profile.balance + profile.redeemBalance;
    profile.balance = balance;
    profile.redeemBalance = 0;
    await profile.save();
    res.status(200).json({ message: 'Balance updated successfully.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while updating balance.' });
  }
};

const getFilterProfitLoss = (filter) => {
  const filteredData = {};
  let error = 0;
  if ((filter?.from && filter?.from !== '') && (filter?.to && filter?.to !== '')) {
    const timeZone = filter.timeZone || 'Asia/Calcutta';
    const startDate = moment.tz(filter?.from, timeZone);
    const endDate = moment.tz(filter?.to, timeZone);

    const date1 = startDate.clone().startOf('day');
    const date2 = endDate.clone().endOf('day');
    const timeDifferenceMs = date2.diff(date1, 'days');
    if (timeDifferenceMs > 30) {
      error = 1;
    }
    filteredData.createdAt = {
      $gte: date1.toDate(),
      $lt: date2.toDate(),
    };
  }
  return { filteredData, error };
};

const userMarketsProfitloss = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
  const { eventId } = req.query;
  //   const uri = process.env.MONGO_URI;
  //   const client = new MongoClient(uri);
  try {
    const options = pick(req?.query, ['sortBy', 'limit', 'page']);
    const filters = pick(req?.query, ['from', 'to', 'timeZone']);
    const dateData = getFilterProfitLoss(filters);
    if (dateData.error === 1) {
      return res.status(400).json({ error: 'Please select only 30 days range only.' });
    }
    let filter = { username: req.user, exEventId: eventId };
    let retdata = [];
    if (dateData.filteredData) {
      const filterData = dateData.filteredData;
      filter = { ...filter, ...filterData };
    }
    const resData = await Reporting.paginate(filter, options);

    // const results = await client.db(process.env.EXCH_DB).collection('reportings')
    //   .find().toArray();
    if (resData.results.length > 0) {
      retdata = resData.results.map((result) => {
        delete result._id;
        delete result.username;
        return result;
      });
    }
    resData.results = retdata;
    res.json(resData);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while fetching Bet List' });
  }
//   finally {
//     if (client) {
//       client.close();
//     }
//   }
};

const userEventsProfitloss = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
  const { sportId } = req.query;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const retresult = [];
  try {
    const options = pick(req?.query, ['sortBy', 'limit', 'page']);
    const filters = pick(req?.query, ['from', 'to', 'timeZone']);
    const dateData = getFilterProfitLoss(filters);
    if (dateData.error === 1) {
      return res.status(400).json({ error: 'Please select only 30 days range only.' });
    }
    let filter = { username: req.user, sportId };
    const retdata = [];
    if (dateData.filteredData) {
      const filterData = dateData.filteredData;
      filter = { ...filter, ...filterData };
    }
    const { limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;

    let results = await client.db(process.env.EXCH_DB).collection('reportings')
      .aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: {
              eventName: '$eventName',
              sportName: '$sportName',
              eventId: '$exEventId',
            },
            pl: {
              $sum: '$pl',
            },
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: parseInt(limit),
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);
    results = await results.toArray();
    let totalResults = await client.db(process.env.EXCH_DB).collection('reportings')
      .aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: {
              eventName: '$eventName',
              sportName: '$sportName',
              eventId: '$exEventId',
            },
            pl: {
              $sum: '$pl',
            },
          },
        },
      ]);
    totalResults = await totalResults.toArray();

    results.map((result) => {
      const data = {};
      data.pl = result.pl;
      data.eventId = result._id.eventId;
      data.eventName = result._id.eventName;
      data.sportName = result._id.sportName;
      retresult.push(data);
    });
    const resData = {
      page,
      limit,
      totalPages: Math.ceil(totalResults.length / limit),
      totalResults: totalResults.length,
      results: retresult,
    };
    res.json(resData);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while fetching Bet List' });
  } finally {
    if (client) {
      client.close();
    }
  }
};

const userSportsProfitloss = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const retresult = [];
  try {
    const options = pick(req?.query, ['sortBy', 'limit', 'page']);
    const filters = pick(req?.query, ['from', 'to', 'timeZone']);
    const dateData = getFilterProfitLoss(filters);
    if (dateData.error === 1) {
      return res.status(400).json({ error: 'Please select only 30 days range only.' });
    }
    let filter = { username: req.user };

    if (dateData.filteredData) {
      const filterData = dateData.filteredData;
      filter = { ...filter, ...filterData };
    }
    const { limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;

    let results = await client.db(process.env.EXCH_DB).collection('reportings')
      .aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: {
              sportId: '$sportId',
              sportName: '$sportName',
            },
            pl: {
              $sum: '$pl',
            },
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: parseInt(limit),
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);
    results = await results.toArray();
    let totalResults = await client.db(process.env.EXCH_DB).collection('reportings')
      .aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: {
              sportId: '$sportId',
              sportName: '$sportName',
            },
            pl: {
              $sum: '$pl',
            },
          },
        },

      ]);
    totalResults = await totalResults.toArray();
    results.map((result) => {
      const data = {};
      data.pl = result.pl;
      data.sportId = result._id.sportId;
      data.sportName = result._id.sportName;
      retresult.push(data);
    });
    const resData = {
      page,
      limit,
      totalPages: Math.ceil(totalResults.length / limit),
      totalResults: totalResults.length,
      results: retresult,
    };
    res.json(resData);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while fetching Bet List' });
  } finally {
    if (client) {
      client.close();
    }
  }
};

const getUserBetList = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
  const resultArr = [];
  const { marketId, sportId } = req.query;
  try {
    const options = pick(req?.query, ['sortBy', 'limit', 'page']);
    const filters = pick(req?.query, ['from', 'to', 'timeZone']);
    const dateData = getFilterProfitLoss(filters);
    if (dateData.error === 1) {
      return res.status(400).json({ error: 'Please select only 30 days range only.' });
    }
    let filter = {
      username: profile.username, sportId, exMarketId: marketId,
    };

    if (dateData.filteredData) {
      const filterData = dateData.filteredData;
      filter = { ...filter, ...filterData };
    }
    console.log('filter', filter);
    const resultData = await CricketBetPlace.paginate(filter, options);

    if (resultData.results.length > 0) {
      resultData.results.map((data) => {
        const result = {
          pl1: Number(data.pl),
          pl2: Number(-data.stake),
          type: data.type,
          sportName: data.sportName,
          eventName: data.eventName,
          marketName: data.marketType,
          oddsPrice: data.odds,
          selectionName: data.selectionName,
          stake: data.stake,
          matchedTime: data.matchedTime,
          createdAt: data.createdAt,
        };
        resultArr.push(result);
      });
    }
    resultData.results = resultArr;
    res.json(resultData);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while fetching Bet List' });
  }
};

const savestakes = async (req, res) => {
  const { stakes } = req.body;
  try {
    const profile = await User.findOne({ username: req.user }).exec();
    if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
    const filter = { username: req.user };
    const update = {
      username: req.user,
      stakes,
    };
    await Stake.findOneAndUpdate(filter, { $set: update }, { upsert: true });
    res.status(200).json({ message: 'Stakes updated successfully.' });
  } catch (err) {
    logger.error(err);
  }
};

const fetchstakes = async (req, res) => {
  try {
    const stakesdata = await Stake.findOne({ username: req.user }).exec();
    if (!stakesdata) return res.status(401).json({ message: 'Stakes data not present.' });
    res.status(200).json(stakesdata.stakes);
  } catch (err) {
    logger.error(err);
  }
};

const generateotp = async (req, res) => {
  const { mobile, ip, countryCode } = req.body;
  if (!mobile) return res.status(400).json({ message: 'Mobile number is required.' });
  const data = await User.findOne({ mobile, countryCode }).exec();
  if (!data) return res.status(404).json({ message: 'Mobile number does not exists.' });
  try {
    let response = {
      return: true,
      message: 'sucess',
    };
    if (countryCode !== '+91') {
      return res.status(200).json({ message: data.username });
    }
    if (countryCode === '+91') {
      response = await sendSMS(mobile);
    }
    if (response.return) {
      res.status(200).json({ message: response.message });
    } else {
      res.status(500).json({ message: response.message });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while generating OTP.' });
  }
};

const verifyotp = async (req, res) => {
  const {
    mobile, ip, otp, countryCode,
  } = req.body;
  if (!mobile || !otp) return res.status(400).json({ message: 'Mobile number and OTP is required.' });
  try {
    let response = {
      return: true,
      message: 'sucess',
    };
    if (countryCode === '+91') {
      response = await verifySMS(mobile, otp);
    }
    if (!response.return) {
      res.status(400).json({ message: response.message });
    } else {
      const data = await User.findOne({ mobile }).exec();
      logger.info(data);
      res.status(200).json({ message: data.username });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while verifying OTP.' });
  }
};

const createUser = async (req, res) => {
  const {
    username, roles, password,
  } = req.body;
  if (!username || !password || !roles) return res.status(400).json({ message: 'Username, mobile, role and password are required.' });
  const duplicate = await Trader.findOne({ username }).exec();
  if (duplicate) return res.status(409).json({ message: 'Username already exists.' });
  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    await Trader.create({
      username,
      password: hashedPwd,
      roles,
    });
    // logger.debug(result);
    res.status(201).json({ success: `New user ${username} created!` });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  const {
    password, roles, userId,
  } = req.body;
  try {
    if (!userId) return res.status(400).json({ message: 'userId required.' });
    const data = await Trader.findOne({ _id: userId }).exec();
    if (!data) return res.status(404).json({ message: 'User not found.' });
    const upd = {
      roles,
    };

    if (password !== '') {
      const hashedPwd = await bcrypt.hash(password, 10);
      upd.password = hashedPwd;
    }
    await Trader.findOneAndUpdate({ _id: userId }, upd);
    res.status(201).json({ success: `User ${userId} updated!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.query;
  try {
    const data = await Trader.findOne({ _id: userId }).exec();
    if (!data) return res.status(404).json({ message: 'Cannot delete user. Trader not present.' });

    const result = await Trader.deleteOne({
      _id: userId,
    });
    logger.debug(result);
    res.status(201).json({ success: `User ${userId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listUser = async (req, res) => {
  const options = pick(req?.query, ['sortBy', 'limit', 'page']);
  //   const filter = pick(req?.query, ['from', 'to']);
  const filter = { roles: { $in: ['FTeader', 'FManager', 'Navigation', 'STeader'] } };
  const optObj = {
    ...options,
    sortBy: options.sortBy ? options.sortBy : 'createdAt:desc',
  };
  const data = await Trader.paginate(filter, optObj);
  //   const finalData = [];
  //   if (data.results.length > 0) {
  //     data.results.map((item) => {
  //       const res = {};
  //       res.username = item.username;
  //       res.roles = item.roles;
  //       res._id = item._id;
  //       res.status = item.status;
  //       res.createdAt = item.createdAt;
  //       finalData.push(res);
  //     });
  //     data.results = finalData;
  //   }
  res.status(200).json({ data });
};

module.exports = {
  getBalance,
  generateotp,
  verifyotp,
  updateBalance,
  savestakes,
  fetchstakes,
  createUser,
  updateUser,
  deleteUser,
  listUser,
  getUserBetList,
  userMarketsProfitloss,
  userEventsProfitloss,
  userSportsProfitloss,
};
