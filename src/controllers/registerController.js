const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const User = require('../model/User');
require('dotenv').config();

const handleNewUser = async (req, res) => {
  const {
    user, pwd, mobile, ip,
  } = req.body;
  if (!user || !pwd || !mobile) return res.status(400).json({ message: 'Username, mobile and password are required.' });
  const duplicate = await User.findOne({ username: user }).exec();
  if (duplicate) return res.status(409).json({ message: 'Username already exists.' });
  try {
    const hashedPwd = await bcrypt.hash(pwd, 10);
    const result = await User.create({
      username: user,
      password: hashedPwd,
      mobile,
      ip,
      origin: req.headers.origin,
    });
    logger.debug(result);
    res.status(201).json({ success: `New user ${user} created!` });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
};

const smsSend = (mobile) => {
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY}/SMS/${mobile}/AUTOGEN/`,
    headers: {},
    maxRedirects: 0,
  };
  return config;
};

const generateotp = async (req, res) => {
  const { user, mobile, ip } = req.body;
  if (!user || !mobile) return res.status(400).json({ message: 'Username and mobile number are required.' });
  const duplicate = await User.aggregate([{
    $match: {
      $or: [{
        username: user,
      }, {
        mobile,
      }],
    },
  }]);
  if (duplicate.length > 0) return res.status(409).json({ message: 'Username or mobile number already exists.' });
  try {
    const config = smsSend(mobile);
    axios.request(config)
      .then((response) => {
        res.status(200).json({ message: response.data });
      })
      .catch((error) => {
        logger.info(error);
        res.status(500).json({ message: 'Error while generating OTP.' });
      });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while generating OTP.' });
  }
};

const verifyotp = async (req, res) => {
  const {
    user, pwd, mobile, ip, otp,
  } = req.body;
  if (!user || !pwd || !mobile || !otp) return res.status(400).json({ message: 'Username, Password, Mobile number and OTP is required.' });
  const duplicate = await User.aggregate([{
    $match: {
      $or: [{
        username: user,
      }, {
        mobile,
      }],
    },
  }]);
  if (duplicate.length > 0) return res.status(409).json({ message: 'Username or mobile number already exists.' });
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
      res.status(400).json({ message: response.data });
    } else {
      const hashedPwd = await bcrypt.hash(pwd, 10);
      const roles = ['User'];

      await User.create({
        username: user,
        password: hashedPwd,
        mobile,
        ip,
        origin: req.headers.origin,
        roles,
      });
      const accessToken = jwt.sign(
        {
          username: user,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1d' },
      );
      res.json({
        roles, username: user, mobile, accessToken,
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while verifying OTP.' });
  }
};

const resendOtp = async (req, res) => {
  const { mobile, ip } = req.body;
  if (!mobile) return res.status(400).json({ message: 'mobile number required.' });
  try {
    const config = smsSend(mobile);
    axios.request(config)
      .then((response) => {
        res.status(200).json({ message: response.data.Details });
      })
      .catch((error) => {
        logger.info(error);
        res.status(500).json({ message: 'Error while generating OTP.' });
      });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while generating OTP.' });
  }
};

module.exports = {
  handleNewUser,
  generateotp,
  verifyotp,
  resendOtp,
};
