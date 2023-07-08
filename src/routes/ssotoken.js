const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const {
  parse,
  stringify,
} = require('envfile');
const { login } = require('./login');
require('dotenv').config();

const pathToenvFile = '.env';
const router = express.Router();

function getEnv(key) {
  logger.info(`Getting value of ${key}`);
  logger.info(process.env[key]);
}

function setEnv(key, value) {
  fs.readFile(pathToenvFile, 'utf8', (err, data) => {
    if (err) {
      return logger.info(err);
    }
    const result = parse(data);
    result[key] = value;
    logger.info(result);
    fs.writeFile(pathToenvFile, stringify(result), (error) => {
      if (error) {
        return logger.error(error);
      }
      logger.info('File Saved');
    });
  });
}

// eslint-disable-next-line no-unused-vars
router.get('/', async (req, res, next) => {
  const ssotoken = await login();
  getEnv('SSO_TOKEN');
  setEnv('SSO_TOKEN', ssotoken);
  res.send('success');
});

module.exports = router;
