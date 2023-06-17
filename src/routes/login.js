const axios = require('axios');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();

async function login() {
  const resdata = {};
  try {
    const response = await axios.post(
      process.env.API_LOGIN_URL,
      `username=${process.env.LOGIN_API_UNAME}&password=${process.env.LOGIN_API_PASS}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Application': process.env.NAV_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    return response.data.token;
  } catch (err) {
    logger.error(err);
  }
  return resdata;
}

module.exports = { login };
