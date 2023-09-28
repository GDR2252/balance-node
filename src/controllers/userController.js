const path = require('path');
const { MongoClient } = require('mongodb');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const bcrypt = require('bcrypt');
const User = require('../model/User');
const Stake = require('../model/Stake');
const { sendSMS, verifySMS } = require('./smsapiController');
const pick = require('../utils/pick');
const Trader = require('../model/Trader');

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

const userMarketsProfitloss = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
  const { eventId } = req.body;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    let retdata = [];
    const results = await client.db(process.env.EXCH_DB).collection('reportings')
      .find({ username: req.user, exEventId: eventId }).toArray();
    if (results.length > 0) {
      retdata = results.map((result) => {
        delete result._id;
        delete result.username;
        return result;
      });
    }
    res.json(retdata);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while fetching Bet List' });
  } finally {
    if (client) {
      client.close();
    }
  }
};

const userEventsProfitloss = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
  const { sportId } = req.body;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const retresult = [];
  try {
    const results = await client.db(process.env.EXCH_DB).collection('reportings')
      .aggregate([
        {
          $match: {
            username: req.user,
            sportId,
          },
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
      ]).toArray();
    results.map((result) => {
      const data = {};
      data.pl = result.pl;
      data.eventId = result._id.eventId;
      data.eventName = result._id.eventName;
      data.sportName = result._id.sportName;
      retresult.push(data);
    });
    res.json(retresult);
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
    const results = await client.db(process.env.EXCH_DB).collection('reportings')
      .aggregate([
        {
          $match: {
            username: req.user,
          },
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
      ]).toArray();
    results.map((result) => {
      const data = {};
      data.pl = result.pl;
      data.sportId = result._id.sportId;
      data.sportName = result._id.sportName;
      retresult.push(data);
    });
    res.json(retresult);
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
  const { marketId, sportId } = req.body;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    const results = await client.db(process.env.EXCH_DB).collection('cricketbetplaces')
      .find({ username: profile.username, sportId, exMarketId: marketId }).toArray();
    if (results.length > 0) {
      results.map((data) => {
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
    res.json(resultArr);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while fetching Bet List' });
  } finally {
    if (client) {
      client.close();
    }
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
