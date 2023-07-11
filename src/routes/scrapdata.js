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
  const { data } = req.body;
  logger.info(data);
  try {
    await storemarketrates(data);
    res.json({
      message: 'data saved successfully',
    });
  } catch (error) {
    logger.error(error);
    res.json({
      message: 'error while fetching data. please check logs for full error.',
    });
  }
});
module.exports = router;
