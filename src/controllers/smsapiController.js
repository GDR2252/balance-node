const unirest = require('unirest');
const path = require('path');
const bcrypt = require('bcrypt');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const OTPManage = require('../model/OTPManage');

const sendSMS = async (mobile) => {
  let response = {
    return: true,
    message: 'Message sent successfully',
  };
  try {
    const OTP = Math.floor(1000 + Math.random() * 9000);
    const hashedOTP = await bcrypt.hash(OTP.toString(), 10);
    const url = unirest('POST', process.env.SMS_POST_URL);
    url.headers({
      authorization: process.env.SMS_API_KEY,
    });
    url.form({
      message: 'OTP from Bhavani EXCH.',
      language: 'english',
      route: 'otp',
      variables_values: OTP,
      numbers: mobile,
    });
    url.end(async (result) => {
      if (result.error) {
        logger.error(result.error);
        response.return = false;
        response.message = 'Error occurred while sending OTP. Please try again!';
      }
      await OTPManage.create({
        mobile,
        otp: hashedOTP,
      });
      response = result.body;
    });
  } catch (err) {
    logger.error(err);
    response.return = false;
    response.message = 'Error occurred while sending OTP. Please try again!';
  }
  return response;
};

const verifySMS = async (mobile, otp) => {
  const response = {
    return: true,
    message: 'OTP matched successfully!',
  };
  try {
    const latestRecord = await OTPManage.find().sort({ createdAt: -1 }).limit(1);
    logger.info(latestRecord);
    const match = await bcrypt.compare(otp, latestRecord[0].otp);
    if (!match) {
      response.return = false;
      response.message = 'OTP Mismatch!';
    }
  } catch (err) {
    logger.error(err);
    response.return = false;
    response.message = 'Error occurred while verifying OTP.';
  }
  return response;
};

module.exports = { sendSMS, verifySMS };
