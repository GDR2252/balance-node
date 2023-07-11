/* eslint-disable no-unused-vars */
const express = require('express');
const axios = require('axios');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Market = require('../model/Market');
const { storemarketrates } = require('../dao/stormarketrates');
require('dotenv').config();

const router = express.Router();

router.get('/', async (req, res, next) => {
  const markets = await Market.aggregate([{
    $project: {
      marketId: 1,
    },
  }]);
  let ids = '';
  for (let i = 0; i < markets.length; i += 1) {
    ids = `${ids + markets[i].marketId},`;
  }
  ids = ids.replace(/,$/, '');
  res.json({ ids });
});

router.post('/', async (req, res, next) => {
  const {
    currency, types, rollupLimit, rollupModel,
  } = req.body;
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://ero.betfair.com/www/sports/exchange/readonly/v1/bymarket?_ak=nzIFcwyWhrlwYMrh&alt=json&currencyCode=${currency}&locale=en_GB&marketIds=${ids}&rollupLimit=${rollupLimit}&rollupModel=${rollupModel}&types=${types}`,
    headers: {
      Cookie: `ssoid=${process.env.SSO_TOKEN}`,
    },
  };
  axios.request(config)
    .then(async (response) => {
      await storemarketrates([response.data]);
      res.json({
        message: 'data saved successfully',
      });
    })
    .catch((error) => {
      logger.error(error);
      const resdata = {
        message: 'error while fetching data. please check logs for full error.',
      };
      res.json(resdata);
    });
});
module.exports = router;
