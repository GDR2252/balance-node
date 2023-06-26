const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Betlimit = require('../model/Betlimit');

async function addBetlimit(req, res) {
  const { betlimit } = req.body;
  const duplicate = await Betlimit.findOne({ betlimit }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add betlimit. Betlimit already present.' });
  try {
    const result = await betlimit.create({
      betlimit,
    });
    logger.debug(result);
    res.status(201).json({ success: `New betlimit ${betlimit} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function fetchBetlimits(req, res) {
  try {
    const result = await Betlimit.find({});
    logger.debug(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteBetlimit(req, res) {
  const { betlimit } = req.query;
  const data = await Betlimit.findOne({ betlimit }).exec();
  if (!data) return res.status(404).json({ message: 'Cannot delete betlimit. Betlimit not present.' });
  try {
    const result = await Betlimit.deleteOne({
      betlimit,
    });
    logger.debug(result);
    res.status(201).json({ success: `Betlimit ${betlimit} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addBetlimit, fetchBetlimits, deleteBetlimit,
};
