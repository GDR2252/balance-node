const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Transcation = require('../model/Transaction');
const User = require('../model/User');
const pick = require('../utils/pick');

async function statement(req, res) {
  const options = pick(req?.query, ['sortBy', 'limit', 'page']);
  const filter = pick(req?.query, ['from', 'to']);

  try {
    const userData = await User.findOne({ username: req.user }).select('username');
    if (!userData) return res.status(400).json({ message: 'User not found.' });
    const optObj = {
      ...options,
      path: Transcation.POPULATED_FIELDS,
      sortBy: options.sortBy ? options.sortBy : 'createdAt:desc',
    };

    if ((filter?.from && filter?.from !== '') && (filter?.to && filter?.to !== '')) {
      delete filter.createdAt;
      const date1 = new Date(filter?.from);
      const date2 = new Date(filter?.to);
      date2.setHours(23, 59, 59, 999);
    //   const timeDifferenceMs = date2 - date1;
    //   const millisecondsIn30Days = 1000 * 60 * 60 * 24 * 30;
    //   if (timeDifferenceMs >= millisecondsIn30Days) {
    //     return res.status(500).json({ error: 'Please select only 30 days range only.' });
    //   }
      filter.createdAt = {
        $gte: new Date(date1),
        $lte: new Date(date2),
      };
      delete filter.to;
      delete filter.from;
    }

    if (filter?.to) {
      filter.createdAt = new Date(filter.to);
      delete filter.to;
    }

    if (filter?.from) {
      filter.createdAt = new Date(filter.from);
      delete filter.from;
    }
    filter.toId = userData?._id;
    const data = await Transcation.paginate(filter, optObj);
    res.status(200).json({ data, username: req.username });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error fetching activity logs.' });
  }
}

module.exports = { statement };
