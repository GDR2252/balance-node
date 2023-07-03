const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Tournament = require('../model/Tournament');
const Event = require('../model/Event');

async function addTournaments(req, res) {
  const { tournamentId } = req.body;
  const { body } = req;
  logger.debug(body);
  const duplicate = await Tournament.findOne({ tournamentId }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add tournament. Tournament already present.' });
  try {
    const result = await Tournament.create({
      tournamentId,
      sportId: body.sportId,
      tournamentName: body.tournamentName,
      highlight: body.highlight || false,
      quicklink: body.quicklink || false,
      status: body.status || false,
      sequence: body.sequence,
    });
    logger.debug(result);
    res.status(201).json({ success: `New tournament ${tournamentId} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function fetchTournaments(req, res) {
  const { sportId } = req.query;
  try {
    const result = await Tournament.find({ sportId });
    logger.debug(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateTournaments(req, res) {
  const { tournamentId } = req.body;
  const { body } = req;
  logger.debug(body);
  const data = await Tournament.findOne({ tournamentId }).exec();
  if (!data) return res.status(404).json({ message: 'Cannot update tournament. Tournament not present.' });
  try {
    const filter = { tournamentId };
    const update = {
      tournamentName: body.tournamentName,
      highlight: body.highlight,
      quicklink: body.quicklink,
      status: body.status,
      sequence: body.sequence,
    };
    const result = await Tournament.findOneAndUpdate(filter, update);
    logger.info(result);
    res.status(201).json({ success: `Tournament ${tournamentId} updated!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteTournaments(req, res) {
  const { tournamentId } = req.query;
  const data = await Tournament.findOne({ tournamentId }).exec();
  if (!data) return res.status(404).json({ message: 'Cannot delete tournament. Tournament not present.' });
  const tournamentdata = await Event.findOne({ tournamentsId: tournamentId }).exec();
  if (tournamentdata) return res.status(409).json({ message: 'Cannot delete tournament. Associated events data present.' });
  try {
    const result = await Tournament.deleteOne({
      tournamentId,
    });
    logger.debug(result);
    res.status(201).json({ success: `Tournament ${tournamentId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addTournaments, fetchTournaments, updateTournaments, deleteTournaments,
};
