const axios = require('axios');
const bcrypt = require('bcrypt');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Trader = require('../model/Trader');
const User = require('../model/User');
require('dotenv').config();

async function changepass(req, res) {
  const { oldPwd, pwd } = req.body;
  if (!oldPwd || !pwd) return res.status(400).json({ message: 'Old Password and New Password are required.' });
  const foundUser = await Trader.findOne({ username: req.user }).exec();
  if (!foundUser) return res.status(401).json({ message: 'Old password is incorrect.' });
  const match = await bcrypt.compare(oldPwd, foundUser.password);
  if (match) {
    const hashedPwd = await bcrypt.hash(pwd, 10);
    foundUser.password = hashedPwd;
    await foundUser.save();
    res.status(201).json({ success: 'New password updated successfully!' });
  } else {
    res.status(401).json({ message: 'Old password is incorrect.' });
  }
}

async function changepassword(req, res) {
  const { oldPwd, pwd } = req.body;
  if (!oldPwd || !pwd) return res.status(400).json({ message: 'Old Password and New Password are required.' });
  const foundUser = await User.findOne({ username: req.user }).exec();
  if (!foundUser) return res.status(401).json({ message: 'Old password is incorrect.' });
  const match = await bcrypt.compare(oldPwd, foundUser.password);
  if (match) {
    const hashedPwd = await bcrypt.hash(pwd, 10);
    foundUser.password = hashedPwd;
    await foundUser.save();
    res.status(201).json({ success: 'New password updated successfully!' });
  } else {
    res.status(401).json({ message: 'Old password is incorrect.' });
  }
}

async function forgotpassword(req, res) {
  const { mobile, ip } = req.body;
  if (!mobile) return res.status(400).json({ message: 'Mobile number required.' });
  const data = await User.findOne({ mobile }).exec();
  if (!data) return res.status(404).json({ message: 'Mobile number does not exist.' });
  try {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY}/SMS/${mobile}/AUTOGEN/`,
      headers: {},
      maxRedirects: 0,
    };
    await axios.request(config);
    res.status(200).json({ message: 'OTP generated successfully.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while generating OTP.' });
  }
}

async function verifyforgotpassword(req, res) {
  const {
    pwd, mobile, ip, otp,
  } = req.body;
  if (!pwd || !mobile || !otp) return res.status(400).json({ message: 'Password, Mobile number and OTP is required.' });
  try {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY}/SMS/VERIFY3/${mobile}/${otp}`,
      headers: {},
      maxRedirects: 0,
    };
    const response = await axios.request(config);
    if (response.data.Status === 'Error') {
      res.status(400).json({ message: response.data.Details });
    } else {
      const hashedPwd = await bcrypt.hash(pwd, 10);
      const data = await User.findOne({ mobile }).exec();
      data.password = hashedPwd;
      await data.save();
      res.status(201).json({ success: 'New password updated successfully!' });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while verifying OTP.' });
  }
}

module.exports = {
  changepass, changepassword, forgotpassword, verifyforgotpassword,
};
