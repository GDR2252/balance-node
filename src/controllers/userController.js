const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const bcrypt = require('bcrypt');
const User = require('../model/User');
const Stake = require('../model/Stake');
const { sendSMS, verifySMS } = require('./smsapiController');

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
  const { mobile, ip } = req.body;
  if (!mobile) return res.status(400).json({ message: 'Mobile number is required.' });
  const data = await User.findOne({ mobile }).exec();
  if (!data) return res.status(404).json({ message: 'Mobile number does not exists.' });
  try {
    const response = await sendSMS(mobile);
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
  const { mobile, ip, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ message: 'Mobile number and OTP is required.' });
  try {
    const response = await verifySMS(mobile, otp);
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
    username, roles, password, mobile, ip,
  } = req.body;
  const duplicate = await User.findOne({ username }).exec();
  if (duplicate) return res.status(409).json({ message: 'Username already exists.' });
  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    await User.create({
      username,
      password: hashedPwd,
      mobile,
      roles,
      ip,
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
    password, roles, mobile, ip, userId,
  } = req.body;
  try {
    const data = await User.findOne({ _id: userId }).exec();
    if (!data) return res.status(404).json({ message: 'User not found.' });
    const upd = {
      roles,
      mobile,
      ip,
    };

    if (password !== '') {
      const hashedPwd = await bcrypt.hash(password, 10);
      upd.password = hashedPwd;
    }
    await User.findOneAndUpdate({ _id: userId }, upd);
    res.status(201).json({ success: `User ${userId} updated!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.query;
  try {
    const data = await User.findOne({ _id: userId }).exec();
    if (!data) return res.status(404).json({ message: 'Cannot delete user. User not present.' });

    const result = await User.deleteOne({
      _id: userId,
    });
    logger.debug(result);
    res.status(201).json({ success: `User ${userId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
};
