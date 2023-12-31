/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
const path = require('path');
const { MongoClient } = require('mongodb');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Sport = require('../model/Sport');
const Tournament = require('../model/Tournament');
const Event = require('../model/Event');
const Market = require('../model/Market');

async function sportsList(req, res) {
  const retresult = { data: [] };
  try {
    const result = await Sport.find({ status: true })
      .sort({ sequence: 1 })
      .collation({ locale: 'en_US', numericOrdering: true });
    Object.keys(result).forEach((key) => {
      const copy = JSON.parse(JSON.stringify(result[key]));
      delete copy._id;
      delete copy.__v;
      retresult.data.push(copy);
    });
    logger.debug(retresult);
    res.status(200).json(retresult);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function sideMenuList(req, res) {
  try {
    const sportsresult = await Sport.aggregate([
      {
        $match: {
          sportId: {
            $not: {
              $in: ['home', 'in-play'],
            },
          },
        },
      },
      {
        $project: {
          sportId: 1,
          sportName: 1,
          iconUrl: 1,
          sequence: 1,
        },
      },
      {
        $addFields: {
          numericSequence: { $toInt: '$sequence' },
        },
      },
      {
        $sort: { numericSequence: 1 },
      },
    ]);
    let sportscopy = JSON.parse(JSON.stringify(sportsresult));
    for (let key = 0; key < sportsresult.length; key += 1) {
      const tournaments = await Tournament.aggregate([{
        $match: {
          sportId: sportsresult[key].sportId,
        },
      }, {
        $project: {
          tournamentId: 1,
          tournamentName: 1,
        },
      }]);
      if (tournaments?.length > 0) {
        sportscopy[key].tournaments = tournaments;
      }
    }
    sportscopy = sportscopy.filter((value) => Object.keys(value).length !== 0);
    for (let key = 0; key < sportscopy.length; key += 1) {
      const { tournaments } = sportscopy[key];
      if (tournaments?.length > 0) {
        for (let i = 0; i < tournaments.length; i += 1) {
          const events = await Event.aggregate([
            {
              $lookup: {
                from: 'marketRates',
                localField: 'exEventId',
                foreignField: 'exEventId',
                as: 'marketRatesInfo',
              },
            },
            {
              $match: {
                tournamentsId: tournaments[i].tournamentId,
                IsSettle: 0,
                'marketRatesInfo.state.status': { $in: ['OPEN', 'ACTIVE'] },
              },
            },
            {
              $addFields: {
                // Add a static field with a value
                type: 'event',
              },
            },
            {
              $project: {
                exEventId: 1,
                eventName: 1,
                type: 1,
              },
            }]);

          if (events?.length === 0) {
            sportscopy[key].tournaments.splice(i, 1);
          }
          if (events?.length > 0) {
            sportscopy[key].tournaments[i].events = events;
          }
        }
      }
    }
    let json = JSON.parse(JSON.stringify(sportscopy).split('"sportId":').join('"id":'));
    json = JSON.parse(JSON.stringify(json).split('"sportName":').join('"name":'));
    json = JSON.parse(JSON.stringify(json).split('"tournaments":').join('"children":'));
    json = JSON.parse(JSON.stringify(json).split('"tournamentId":').join('"id":'));
    json = JSON.parse(JSON.stringify(json).split('"tournamentName":').join('"name":'));
    json = JSON.parse(JSON.stringify(json).split('"events":').join('"children":'));
    json = JSON.parse(JSON.stringify(json).split('"exEventId":').join('"id":'));
    json = JSON.parse(JSON.stringify(json).split('"eventName":').join('"name":'));
    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function hasdata(data, value) {
  return data.some((el) => el.exEventId === value);
}

async function getEventList(req, res) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const results = [];
  const retresult = [];
  const data = {};
  const { type } = req.query;
  const currentDate = new Date();
  try {
    let filter = {};
    if (type === 'in-play') {
      filter = { ...filter, 'state.inplay': true };
    }
    if (type === 'home') {
      filter = {
        ...filter,
        marketTime: {
          $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0),
          $lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 0, 0, 0),
        },
      };
    }
    await client.connect();
    const cursor = await client.db(process.env.EXCH_DB).collection('marketRates').aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: '$eventId',
          uniqueDocument: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'sports',
          localField: 'uniqueDocument.sportsId',
          foreignField: 'sportId',
          as: 'sportInfo',
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'uniqueDocument.eventId',
          foreignField: 'eventId',
          as: 'eventInfo',
        },
      },
      {
        $match: {
          'eventInfo.IsSettle': 0,
        },
      },
      {
        $lookup: {
          from: 'markets',
          localField: 'uniqueDocument.exMarketId',
          foreignField: 'exMarketId',
          as: 'marketInfo',
        },
      },
      {
        $project: {
          _id: '$uniqueDocument._id',
          betLimit: '$uniqueDocument.betLimit',
          eventId: '$uniqueDocument.eventId',
          eventName: '$uniqueDocument.eventName',
          marketTime: '$uniqueDocument.marketTime',
          iconUrl: { $first: '$sportInfo.iconUrl' },
          exEventId: '$uniqueDocument.exEventId',
          sportsId: '$uniqueDocument.sportsId',
          sportName: '$uniqueDocument.sportName',
          runners: '$uniqueDocument.runners',
          inplay: '$uniqueDocument.state.inplay',
          tournamentName: { $first: '$eventInfo.tournamentsName' },
          isVirtual: { $first: '$marketInfo.isVirtual' },
          isStreaming: { $first: '$marketInfo.isStreaming' },
          isSportsbook: { $first: '$marketInfo.isSportsbook' },
          isPreBet: { $first: '$marketInfo.isPreBet' },
          isFancy: { $first: '$marketInfo.isFancy' },
          isCasinoGame: { $first: '$marketInfo.isCasinoGame' },
          isBookmakers: { $first: '$marketInfo.isBookmakers' },
        },
      },
      {
        $sort: {
          marketTime: 1,
        },
      },
    ]);
    const result = await cursor.toArray();
    res.send(result);

    // const cursor = await client.db(process.env.EXCH_DB).collection('marketRates')
    //   .find(filter)
    //   .sort({ marketTime: 1 });
    // results = await cursor.toArray();
    // if (results.length > 0) {
    //   for (let i = 0; i < results.length; i += 1) {
    //     data.sportsId = results[i].sportsId;
    //     const sportsdata = await Sport.findOne({ sportId: data.sportsId }).exec();
    //     data.sportName = sportsdata?.sportName;
    //     data.iconUrl = sportsdata?.iconUrl;
    //     data.inplay = results[i].state.inplay;
    //     data.eventId = results[i].eventId;
    //     data.exEventId = results[i].exEventId;
    //     const { runners } = results[i];
    //     const runnerdata = [];
    //     runners.forEach((element) => {
    //       runnerdata.push(element.exchange);
    //     });
    //     data.runners = runnerdata;
    //     const eventdata = await Event.findOne({ eventId: results[i].eventId }).exec();
    //     data.eventName = eventdata?.eventName;
    //     const tournamentdata = await Tournament
    //       .findOne({ tournamentId: eventdata?.tournamentsId }).exec();
    //     data.tournamentName = tournamentdata?.tournamentName;
    //     const marketdata = await Market.findOne({ marketId: results[i].marketId }).exec();
    //     data.isVirtual = marketdata?.isVirtual || false;
    //     data.isStreaming = marketdata?.isStreaming || false;
    //     data.isSportsbook = marketdata?.isSportsbook || false;
    //     data.isPreBet = marketdata?.isPreBet || false;
    //     data.isFancy = marketdata?.isFancy || false;
    //     data.isCasinoGame = marketdata?.isCasinoGame || false;
    //     data.isBookmakers = marketdata?.isBookmakers || false;
    //     data.marketTime = marketdata?.marketTime;
    //     const listdata = JSON.parse(JSON.stringify(data));
    //     if (!hasdata(retresult, listdata.exEventId)) {
    //       retresult.push(listdata);
    //     }
    //   }
    // }
  } catch (err) {
    logger.error(err);
  }
// finally {
//     await client.close();
//   }
//   res.send(retresult);
}

async function getEventSportsList(req, res) {
  const { sportsId } = req.query;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const cursor = await client.db(process.env.EXCH_DB).collection('marketRates').aggregate([
    {
      $match: {
        sportsId,
      },
    },
    {
      $group: {
        _id: '$eventId',
        uniqueDocument: { $first: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from: 'sports',
        localField: 'uniqueDocument.sportsId',
        foreignField: 'sportId',
        as: 'sportInfo',
      },
    },
    {
      $lookup: {
        from: 'events',
        localField: 'uniqueDocument.eventId',
        foreignField: 'eventId',
        as: 'eventInfo',
      },
    },
    {
      $match: {
        'eventInfo.IsSettle': 0,
      },
    },
    {
      $lookup: {
        from: 'markets',
        localField: 'uniqueDocument.exMarketId',
        foreignField: 'exMarketId',
        as: 'marketInfo',
      },
    },
    {
      $project: {
        _id: '$uniqueDocument._id',
        betLimit: '$uniqueDocument.betLimit',
        eventId: '$uniqueDocument.eventId',
        eventName: '$uniqueDocument.eventName',
        marketTime: '$uniqueDocument.marketTime',
        iconUrl: { $first: '$sportInfo.iconUrl' },
        exEventId: '$uniqueDocument.exEventId',
        sportsId: '$uniqueDocument.sportsId',
        sportName: '$uniqueDocument.sportName',
        runners: '$uniqueDocument.runners',
        inplay: '$uniqueDocument.state.inplay',
        tournamentName: { $first: '$eventInfo.tournamentsName' },
        isVirtual: { $first: '$marketInfo.isVirtual' },
        isStreaming: { $first: '$marketInfo.isStreaming' },
        isSportsbook: { $first: '$marketInfo.isSportsbook' },
        isPreBet: { $first: '$marketInfo.isPreBet' },
        isFancy: { $first: '$marketInfo.isFancy' },
        isCasinoGame: { $first: '$marketInfo.isCasinoGame' },
        isBookmakers: { $first: '$marketInfo.isBookmakers' },
      },
    },

    // {
    //   $project: {
    //     _id: 1,
    //     exEventId: 1,
    //     eventId: 1,
    //     sportsId: 1,
    //     sportName: 1,
    //     iconUrl: { $first: '$sportInfo.iconUrl' },
    //     runners: 1,
    //     inplay: '$state.inplay',
    //     eventName: 1,
    //     tournamentName: { $first: '$eventInfo.tournamentsName' },
    //     marketTime: { $first: '$marketInfo.marketTime' },
    //     isVirtual: { $first: '$marketInfo.isVirtual' },
    //     isStreaming: { $first: '$marketInfo.isStreaming' },
    //     isSportsbook: { $first: '$marketInfo.isSportsbook' },
    //     isPreBet: { $first: '$marketInfo.isPreBet' },
    //     isFancy: { $first: '$marketInfo.isFancy' },
    //     isCasinoGame: { $first: '$marketInfo.isCasinoGame' },
    //     isBookmakers: { $first: '$marketInfo.isBookmakers' },
    //   },
    // },
    // {
    //   $group: {
    //     _id: '$eventId',
    //     exEventId: { $first: '$exEventId' },
    //     eventName: { $first: '$eventName' },
    //     sportsId: { $first: '$sportsId' },
    //     sportName: { $first: '$sportName' },
    //     iconUrl: { $first: '$iconUrl' },
    //     runners: { $first: '$runners' },
    //     inplay: { $first: '$inplay' },
    //     tournamentName: { $first: '$tournamentName' },
    //     marketTime: { $first: '$marketTime' },
    //     isVirtual: { $first: '$isVirtual' },
    //     isStreaming: { $first: '$isStreaming' },
    //     isSportsbook: { $first: '$isSportsbook' },
    //     isPreBet: { $first: '$isPreBet' },
    //     isFancy: { $first: '$isFancy' },
    //     isCasinoGame: { $first: '$isCasinoGame' },
    //     isBookmakers: { $first: '$isBookmakers' },
    //   }
    // },
    {
      $sort: {
        marketTime: 1,
      },
    },
  ]);
  const result = await cursor.toArray();
  res.send(result);
}

// async function getEventSportsList(req, res) {
//   const { sportsId } = req.query;

//   logger.info(`query param: ${sportsId}`);
//   const uri = process.env.MONGO_URI;
//   const client = new MongoClient(uri);
//   let results = [];
//   const retresult = [];
//   const data = { };
//   try {
// await client.connect();
// const cursor = await client.db(process.env.EXCH_DB).collection('marketRates')
//       .find({ sportsId })
//       .sort({ marketTime: 1 });
//     results = await cursor.toArray();
//     if (results.length > 0) {
//       for (let i = 0; i < results.length; i += 1) {
//         data.sportsId = results[i].sportsId;
//         const sportsdata = await Sport.findOne({ sportId: data.sportsId }).exec();
//         data.sportName = sportsdata.sportName;
//         data.iconUrl = sportsdata.iconUrl;
//         data.inplay = results[i].state.inplay;
//         data.eventId = results[i].eventId;
//         data.exEventId = results[i].exEventId;
//         const { runners } = results[i];
//         const runnerdata = [];
//         runners.forEach((element) => {
//           runnerdata.push(element.exchange);
//         });
//         data.runners = runnerdata;
//         const eventdata = await Event.findOne({ eventId: results[i].eventId }).exec();
//         data.eventName = eventdata?.eventName;
//         const tournamentdata = await Tournament
//           .findOne({ tournamentId: eventdata?.tournamentsId }).exec();
//         data.tournamentName = tournamentdata?.tournamentName;
//         const marketdata = await Market.findOne({ marketId: results[i].marketId }).exec();
//         data.isVirtual = marketdata?.isVirtual || false;
//         data.isStreaming = marketdata?.isStreaming || false;
//         data.isSportsbook = marketdata?.isSportsbook || false;
//         data.isPreBet = marketdata?.isPreBet || false;
//         data.isFancy = marketdata?.isFancy || false;
//         data.isCasinoGame = marketdata?.isCasinoGame || false;
//         data.isBookmakers = marketdata?.isBookmakers || false;
//         data.marketTime = marketdata?.marketTime;
//         const listdata = JSON.parse(JSON.stringify(data));
//         if (!hasdata(retresult, listdata.exEventId)) {
//           retresult.push(listdata);
//         }
//       }
//     }
//   } catch (err) {
//     logger.error(err);
//   } finally {
//     await client.close();
//   }
//   res.send(retresult);
// }

async function getMarketList(req, res) {
  const { eventId } = req.query;
  try {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const cursor = await client.db(process.env.EXCH_DB).collection('marketRates')
      .find({ exEventId: eventId, 'state.status': { $ne: 'CLOSED' } });
    const result = await cursor.toArray();
    res.status(200).json(result);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function getSearchEventList(req, res) {
  const { search } = req.query;

  //   if (!search) return res.status(404).json({ message: 'Search Parameter required.' });
  try {
    if (!search) {
      const data = await Event.find({})
        .sort({ createdAt: -1 })
        .limit(6);

      return res.status(200).json(data);
    }

    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();

    const pipeline = [
      {
        $lookup: {
          from: 'marketRates',
          localField: 'exEventId',
          foreignField: 'exEventId',
          as: 'marketRatesInfo',
        },
      },
      {
        $match: {
          eventName: { $regex: `^${search}`, $options: 'i' },
          IsSettle: 0,
          $or: [
            { 'marketRatesInfo.state.status': 'OPEN' },
            { 'marketRatesInfo.state.status': 'ACTIVE' },
          ],
        },
      },
      {
        $project: {
          eventId: 1,
          exEventId: 1,
          sportId: 1,
          tournamentsId: 1,
          tournamentsName: 1,
          eventName: 1,
          highlight: 1,
          quicklink: 1,
          popular: 1,
          IsSettle: 1,
          IsVoid: 1,
          IsUnsettle: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
      { $limit: 6 },
    ];

    const data = await Event.aggregate(pipeline);

    if (data.length < 6) {
      const ids = data.map((item) => item._id);
      const remainingLimit = 6 - data.length;

      const remainingPipeline = [
        ...pipeline.slice(0, 1), // Reuse the first two stages
        {
          $match: {
            eventName: { $regex: search, $options: 'i' },
            IsSettle: 0,
            _id: { $nin: ids },
            $or: [
              { 'marketRatesInfo.state.status': 'OPEN' },
              { 'marketRatesInfo.state.status': 'ACTIVE' },
            ],
          },
        },
        ...pipeline.slice(2, 4),
        { $limit: remainingLimit },
      ];
      const result = await Event.aggregate(remainingPipeline);
      data.push(...result);
    }

    res.status(200).json(data);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}
module.exports = {
  sportsList, sideMenuList, getEventList, getMarketList, getEventSportsList, getSearchEventList,
};
