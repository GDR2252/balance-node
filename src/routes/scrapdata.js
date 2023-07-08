const express = require('express');
const axios = require('axios');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Market = require('../model/Market');
require('dotenv').config();

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/', async (req, res, next) => {
  const {
    currency, types, rollupLimit, rollupModel,
  } = req.body;
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
      res.json(response.data);
    })
    .catch((error) => {
      logger.error(error);
      const resdata = {
        message: 'error while fetching1 data. please check logs for full error.',
      };
      res.json(resdata);
    });
});

module.exports = router;
