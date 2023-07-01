/* eslint-disable no-underscore-dangle */
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Sport = require('../model/Sport');

async function sportsList(req, res) {
  const retresult = { data: [] };
  try {
    const result = await Sport.find({ status: true })
      .sort({ sequence: 1 })
      .collation({ locale: 'en_US', numericOrdering: true });
    Object.keys(result).forEach((key) => {
      const copy = JSON.parse(JSON.stringify(result[key]));
      delete copy._id;
      delete copy.__v;
      retresult.data.push(copy);
    });
    logger.debug(retresult);
    res.status(200).json(retresult);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function allEventsList(req, res) {
}

module.exports = { sportsList, allEventsList };
