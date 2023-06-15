const express = require('express');
const axios = require('axios');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { storenavdata } = require('../dao/storenavdata');
const { deleteNavData } = require('../dao/deletenavdata');
require('dotenv').config();

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/', async (req, res, next) => {
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: process.env.NAV_DATA_API,
    headers: {
      'X-Application': process.env.NAV_API_KEY,
      'X-Authentication': process.env.NAV_API_SSO,
    },
  };
  axios.request(config)
    .then(async (response) => {
      const responseData = [];
      const resArray = response.data.children;
      for (let i = 0; i < resArray.length; i += 1) {
        const obj = resArray[i];
        if (obj.id === '1' || obj.id === '2' || obj.id === '4') {
          responseData.push(obj);
        }
      }
      await deleteNavData();
      await storenavdata(responseData);
      const resdata = {
        message: 'data saved successfully',
      };
      res.json(resdata);
    })
    .catch((error) => {
      logger.log(error);
      const resdata = {
        message: 'error while saving data. please check logs for full error.',
      };
      res.json(resdata);
    });
});

module.exports = router;
