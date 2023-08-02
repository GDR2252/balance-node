const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const ActivityLog = require('../model/ActivityLog');
require('dotenv').config();

async function getActivityLogs(req, res) {
  const profile = await ActivityLog.findOne({ username: req.user }).exec();
  if (!profile) return res.status(404).json({ message: 'No Activity logged yet!' });
  try {
    const activitylogs = await ActivityLog.find({ username: req.user }, { sort: { createdAt: 1 } });
    res.status(200).json(activitylogs);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error fetching activity logs.' });
  }
}

module.exports = { getActivityLogs };
