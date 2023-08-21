const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const StreamShedule = require('../model/StreamShedule');
require('dotenv').config();

async function getStream(req, res) {
    const { eventId } = req.query;
    
  const profile = await StreamShedule.findOne({ MatchID: eventId }).select('Channel').exec();
  if (!profile) return res.status(200).json({ Channel: null });
  try {
    res.status(200).json(profile);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error fetching Events.' });
  }
}

module.exports = { getStream };
