const axios = require('axios');
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

const generateotp = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ message: 'Mobile number is required.' });
  const duplicate = await User.findOne({ mobile }).exec();
  if (duplicate) return res.status(409).json({ message: 'Mobile number already exists.' });
  try {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY}/SMS/${mobile}/AUTOGEN/`,
      headers: { },
      maxRedirects: 0,
    };
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

const verifyotp = (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ message: 'Mobile number and OTP is required.' });
  try {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY}/SMS/VERIFY3/${mobile}/${otp}`,
      headers: { },
      maxRedirects: 0,
    };
    axios.request(config)
      .then((response) => {
        res.status(200).json({ message: response.data });
      })
      .catch((error) => {
        logger.info(error);
        res.status(500).json({ message: 'Error while verifying OTP.' });
      });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while verifying OTP.' });
  }
};

module.exports = { handleNewUser, generateotp, verifyotp };
