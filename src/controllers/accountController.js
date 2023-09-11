const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { MongoClient } = require('mongodb');
const Transcation = require('../model/Transaction');
const User = require('../model/User');
const pick = require('../utils/pick');
const AvplaceBet = require('../model/AvplaceBet');
const Sports = require('../model/Sport');

const client = new MongoClient(process.env.MONGO_URI);

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
    res.status(200).json({ data, username: req.user });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error fetching activity logs.' });
  }
}

async function aviatorPl(user) {
  const aviator = await AvplaceBet.aggregate([
    {
      $match: {
        user,
        issettled: 1,
      },
    },
    {
      $group: {
        _id: null,
        totalDifference: {
          $sum: {
            $subtract: ['$pl', '$stack'],
          },
        },
      },
    },
  ]);
  return aviator;
}

async function casinoPl(username) {
  const foundUser = await User.findOne({ username }).exec();
  if (!foundUser) {
    return 'user not found';
  }
  let casino = await client.db(process.env.EXCH_DB).collection('auracsplacebets').aggregate([{
    $match: { userId: foundUser._id.toString() },
  },
  {
    $group: {
      _id: '$betInfo.roundId',
      data: { $push: '$$ROOT' },
    },
  },
  {
    $project: {
      _id: 0,
      roundId: '$_id',
    },
  },
  ]);
  casino = await casino.toArray();

  const roundIds = [];
  casino.map((item) => {
    roundIds.push(item.roundId);
  });
  casino = await client.db(process.env.EXCH_DB).collection('auracsresults').find({ roundId: { $in: roundIds } });
  casino = await casino.toArray();
  const resultRoundIds = [];
  casino.map((item) => {
    resultRoundIds.push(item.result[0].roundId);
  });
  casino = await client.db(process.env.EXCH_DB).collection('auracsplacebets').aggregate([
    {
      $match: { 'betInfo.roundId': { $in: resultRoundIds } },
    },
    {
      $unwind: '$runners',
    },
    {
      $group: {
        _id: null,
        totalPL: { $sum: '$runners.pl' },
      },
    },
  ]);
  casino = await casino.toArray();
  return casino;
}

async function sportsPl(req, res) {
  try {
    const aviator = await aviatorPl(req.user);
    const casino = await casinoPl(req.user);
    let sports = await client.db(process.env.EXCH_DB).collection('sports').find({ sportName: { $in: ['Aviator', 'Casino'] } }).sort({ sequence: 1 });
    sports = await sports.toArray();

    const sportsData = [];
    sports.map((item) => {
      const data = { ...item };
      data.pl = 0;
      if (item.sportName === 'Aviator' && aviator.length > 0) {
        data.pl = aviator[0].totalDifference.toFixed(2);
      }
      if (item.sportName === 'Casino' && casino.length > 0) {
        data.pl = casino[0].totalPL.toFixed(2);
      }
      sportsData.push(data);
    });

    res.status(200).json({ data: sportsData });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error fetching sports pl.' });
  }
}
module.exports = { statement, sportsPl };
