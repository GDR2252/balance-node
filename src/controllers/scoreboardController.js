const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { getFirestore } = require('firebase-admin/firestore');
const ScoreBoard = require('../model/ScoreBoard');

async function addScore(req, res) {
  const { matchId } = req.body;
  const duplicate = await ScoreBoard.findOne({ matchId }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add Score. match already present.' });
  try {
    const result = await ScoreBoard.create({
      matchId,
    });
    logger.debug(result);
    res.status(201).json({ success: `New scoreboard ${matchId} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function fetchScore(req, res) {
  try {
    const result = await ScoreBoard.find({});
    logger.debug(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteScore(req, res) {
  const { matchId } = req.query;
  try {
    const data = await ScoreBoard.findOne({ matchId }).exec();
    if (!data) return res.status(404).json({ message: 'Cannot delete Score. Score not present.' });
    const db = getFirestore();
    await ScoreBoard.deleteOne({ matchId });
    await db.collection('sportsData').doc(matchId).delete();
    res.status(201).json({ success: `Sport ${matchId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addScore, fetchScore, deleteScore,
};
