const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Sport = require('../model/Sport');

async function addSports(req, res) {
  const { sportId } = req.body;
  const { body } = req;
  logger.debug(body);
  const duplicate = await Sport.findOne({ sportId }).exec();
  if (duplicate) return res.sendStatus(409);
  try {
    const result = await Sport.create({
      sportId: body.sportId,
      sportName: body.sportName,
      highlight: body.highlight || false,
      popular: body.popular || false,
      other: body.other || false,
      status: body.status || false,
      sequence: body.sequence,
    });
    logger.debug(result);
    res.status(201).json({ success: `New sport ${sportId} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function fetchSports(req, res) {
  try {
    const result = await Sport.find({});
    logger.debug(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateSports(req, res) {
  const { sportId } = req.body;
  const { body } = req;
  logger.debug(body);
  const data = await Sport.findOne({ sportId }).exec();
  if (!data) return res.sendStatus(404);
  try {
    const result = await Sport.updateOne({
      sportName: body.sportName,
      highlight: body.highlight,
      popular: body.popular,
      other: body.other,
      status: body.status,
      sequence: body.sequence,
    });
    logger.info(result);
    res.status(201).json({ success: `Sport ${body.sportId} updated!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteSports(req, res) {
  const { sportId } = req.query;
  const data = await Sport.findOne({ sportId }).exec();
  if (!data) return res.sendStatus(404);
  try {
    const result = await Sport.deleteOne({
      sportId,
    });
    logger.debug(result);
    res.status(201).json({ success: `Sport ${sportId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addSports, updateSports, fetchSports, deleteSports,
};
