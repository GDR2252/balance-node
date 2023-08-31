const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { getFirestore } = require('firebase-admin/firestore');
const ScoreBoard = require('../model/ScoreBoard');

async function addScore(req, res) {
  const { spreadexId, eventId } = req.body;
  const duplicate = await ScoreBoard.findOne({ spreadexId }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add Score. match already present.' });
  try {
    const result = await ScoreBoard.create({
        spreadexId,
        eventId
    });
    logger.debug(result);
    res.status(201).json({ success: `New scoreboard ${spreadexId} created!` });
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
  const { spreadexId } = req.query;
  try {
    const data = await ScoreBoard.findOne({ spreadexId }).exec();
    if (!data) return res.status(404).json({ message: 'Cannot delete Score. Score not present.' });
    const db = getFirestore();
    await ScoreBoard.deleteOne({ spreadexId });
    await db.collection('scoreBoard').doc(spreadexId).delete();
    res.status(201).json({ success: `Sport ${spreadexId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addScore, fetchScore, deleteScore,
};
