const express = require('express');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { storenavdata } = require('../dao/storenavdata');
const { deleteNavData } = require('../dao/deletenavdata');
const { auth } = require('../middleware/authentication');

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.post('/', auth, async (req, res, next) => {
  const { data } = req.body;
  try {
    await deleteNavData();
    await storenavdata(data);
    const resdata = {
      message: 'data saved successfully',
    };
    res.json(resdata);
  } catch (error) {
    logger.log(error);
    const resdata = {
      message: 'error while saving data. please check logs for full error.',
    };
    res.json(resdata);
  }
});

module.exports = router;
