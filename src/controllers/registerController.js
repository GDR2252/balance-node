const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const referralCodes = require('referral-codes');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const User = require('../model/User');
const B2cUser = require('../model/B2cUser');
const Stake = require('../model/Stake');
const ActivityLog = require('../model/ActivityLog');
const { sendSMS, verifySMS } = require('./smsapiController');
require('dotenv').config();

const addActivity = async (foundUser, activity, status) => {
  try {
    const activityPayload = {
      username: foundUser.username,
      ip: activity?.query,
      detail: JSON.stringify(activity),
      status,
    };

    const findActivity = await ActivityLog
      .find({ username: foundUser.username }).countDocuments().lean();

    if (findActivity > 25) {
      const firstRecord = await ActivityLog
        .findOne({ username: foundUser.username }, { sort: { createdAt: 1 } });
      await ActivityLog.findByIdAndDelete({ _id: firstRecord._id });
      await ActivityLog.create(activityPayload);
    } else {
      await ActivityLog.create(activityPayload);
    }
  } catch (err) {
    logger.error(err);
    return false;
  }
};

const handleNewUser = async (req, res) => {
  const {
    user, pwd, mobile, ip, countryCode,
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
      countryCode,
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
  const {
    user, mobile, ip, referral_code, countryCode, pwd,
  } = req.body;
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
  if (referral_code) {
    const validreferralCode = await User.findOne({ selfReferral: referral_code });
    if (!validreferralCode) return res.status(404).json({ message: 'Referral Code is not valid.' });
  }
  let response = {
    return: true,
    message: 'sucess',
  };
  if (countryCode === '+91') {
    response = await sendSMS(mobile);
  }
  if (countryCode !== '+91') {
    if (!pwd) return res.status(400).json({ message: 'Password is required.' });
    const hashedPwd = await bcrypt.hash(pwd, 10);
    const { origin } = req.headers;
    const selfcode = referralCodes.generate({
      length: 8,
      charset: referralCodes.charset('alphanumeric'),
    });
    let branch = '';
    if (referral_code) {
      branch = await User.findOne({ selfReferral: referral_code });
      branch = branch?.branch;
    } else {
      branch = await B2cUser.findOne({ roles: ['Manager'], isActive: true, origin });
      branch = branch?._id;
    }
    await User.create({
      username: user,
      password: hashedPwd,
      mobile,
      origin,
      roles: ['User'],
      countryCode,
      selfReferral: selfcode[0].toUpperCase(),
      registeredReferral: referral_code,
      branch,
    });

    const stake = await Stake.create({
      username: user,
      stakes: [100, 500, 1000, 5000, 10000, 50000, 100000, 200000],
    });
    const accessToken = jwt.sign(
      {
        username: user,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1d' },
    );
    await addActivity(user, ip, 'success');
    return res.json({
      roles: ['User'], username: user, mobile, accessToken, referralCode: selfcode, stakes: stake.stakes,
    });
       
  }
  if (response.return) {
    res.status(200).json({ message: response.message });
  } else {
    res.status(500).json({ message: response.message });
  }
};

const verifyotp = async (req, res) => {
  const {
    user, pwd, mobile, ip, otp, referral_code, countryCode,
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
      const hashedPwd = await bcrypt.hash(pwd, 10);
      const roles = ['User'];
      const { origin } = req.headers;
      let branch = '';
      if (referral_code) {
        branch = await User.findOne({ selfReferral: referral_code });
        branch = branch?.branch;
      } else {
        branch = await B2cUser.findOne({ roles: ['Manager'], isActive: true, origin });
        branch = branch?._id;
      }

      const selfcode = referralCodes.generate({
        length: 8,
        charset: referralCodes.charset('alphanumeric'),
      });
      await User.create({
        username: user,
        password: hashedPwd,
        mobile,
        origin,
        roles,
        selfReferral: selfcode[0].toUpperCase(),
        registeredReferral: referral_code,
        branch,
      });
      const stake = await Stake.create({
        username: user,
        stakes: [100, 500, 1000, 5000, 10000, 50000, 100000, 200000],
      });
      const accessToken = jwt.sign(
        {
          username: user,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1d' },
      );
      await addActivity(user, ip, 'success');
      res.json({
        roles, username: user, mobile, accessToken, referralCode: selfcode, stakes: stake.stakes,
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while verifying OTP.' });
  }
};

const resendOtp = async (req, res) => {
  const { mobile, ip, countryCode } = req.body;
  if (!mobile) return res.status(400).json({ message: 'mobile number required.' });
  try {
    let response = {
      return: true,
      message: 'sucess',
    };
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

async function forgotpassword(req, res) {
  const { mobile, ip, countryCode } = req.body;
  if (!mobile) return res.status(400).json({ message: 'Mobile number required.' });
  const data = await User.findOne({ mobile }).exec();
  if (!data) return res.status(404).json({ message: 'Mobile number does not exist.' });
  try {
    let response = {
      return: true,
      message: 'sucess',
    };
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
}

async function verifyforgotpassword(req, res) {
  const {
    mobile, ip, otp, countryCode,
  } = req.body;
  if (!mobile || !otp) return res.status(400).json({ message: 'Password, Mobile number and OTP is required.' });
  try {
    let response = {
      return: true,
      message: 'sucess',
    };
    if (countryCode === '+91') {
      response = await verifySMS(mobile, otp);
    }
    if (response.return) {
      res.status(200).json({ message: response.message });
    } else {
      res.status(400).json({ message: response.message });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while verifying OTP.' });
  }
}

async function changeforgotpassword(req, res) {
  const {
    pwd, mobile, ip,
  } = req.body;
  if (!pwd || !mobile) return res.status(400).json({ message: 'Password, Mobile number is required.' });
  const data = await User.findOne({ mobile }).exec();
  if (!data) {
    res.status(404).json({ message: 'Mobile Number does not exists!' });
  }
  try {
    const hashedPwd = await bcrypt.hash(pwd, 10);
    data.password = hashedPwd;
    await data.save();
    res.status(201).json({ success: 'New password updated successfully!' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error while changing new password.' });
  }
}

module.exports = {
  handleNewUser,
  generateotp,
  verifyotp,
  resendOtp,
  forgotpassword,
  verifyforgotpassword,
  changeforgotpassword,
};
