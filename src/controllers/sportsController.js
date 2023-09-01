const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Sport = require('../model/Sport');
const Tournament = require('../model/Tournament');

async function addSports(req, res) {
  const { sportId } = req.body;
  const { body } = req;
  logger.debug(body);
  const duplicate = await Sport.findOne({ sportId }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add sports. Sports already present.' });
  try {
    const result = await Sport.create({
      sportId: body.sportId,
      sportName: body.sportName,
      highlight: body.highlight || false,
      popular: body.popular || false,
      other: body.other || false,
      status: body.status || false,
      sequence: body.sequence,
      iconUrl: '',
      url: '',
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
  if (!data) return res.status(404).json({ message: 'Cannot update sports. Sports not present.' });
  try {
    const filter = { sportId: body.sportId };
    const update = {
      sportName: body.sportName,
      highlight: body.highlight,
      popular: body.popular,
      other: body.other,
      status: body.status,
      sequence: body.sequence,
      iconUrl: body.url,
    };
    const result = await Sport.findOneAndUpdate(filter, update);
    logger.info(result);
    res.status(201).json({ success: `Sport ${body.sportId} updated!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteSports(req, res) {
  const { sportId } = req.query;
  const data = await Sport.findOne({ sportId }).exec();
  if (!data) return res.status(404).json({ message: 'Cannot delete sports. Sports not present.' });
  const tournamentdata = await Tournament.findOne({ sportId }).exec();
  if (tournamentdata) return res.status(409).json({ message: 'Cannot delete sports. Associated tournaments data present.' });
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

async function fetchSportsDropdown(req, res) {
  try {
    const result = await Sport.find({
      sportId: {
        $not: {
          $in: ['home', 'in-play'],
        },
      },
    }).select('sportName').sort({ sequence: 1 })
      .collation({ locale: 'en_US', numericOrdering: true });
    logger.debug(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addSports, updateSports, fetchSports, deleteSports, fetchSportsDropdown,
};
