const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Transcation = require('../model/Transaction');
const User = require('../model/User');
const pick = require('../utils/pick');

async function statement(req, res) {
  const options = pick(req?.query, ['sortBy', 'limit', 'page']);

  try {
    const userData = await User.findOne({ username: req.user }).select('username');
    if (!userData) return res.status(400).json({ message: 'User not found.' });
    const optObj = {
      ...options,
      path: Transcation.POPULATED_FIELDS,
      sortBy: options.sortBy ? options.sortBy : 'createdAt:desc',
    };
    const filter = {};
    filter.toId = userData?._id;
    const data = await Transcation.paginate(filter, optObj);
    res.status(200).json({ data, username: req.username });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error fetching activity logs.' });
  }
}

module.exports = { statement };
