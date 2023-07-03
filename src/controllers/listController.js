/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Sport = require('../model/Sport');
const Tournament = require('../model/Tournament');
const Event = require('../model/Event');

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
    const sportsresult = await Sport.aggregate([{
      $project: {
        sportId: 1,
        sportName: 1,
      },
    }]);
    const tournamentsList = [];
    for (let key = 0; key < sportsresult.length; key += 1) {
      const copy = JSON.parse(JSON.stringify(sportsresult[key]));
      const tournaments = await Tournament.aggregate([{
        $match: {
          sportId: copy.sportId,
        },
      }, {
        $project: {
          tournamentId: 1,
          tournamentName: 1,
        },
      }]);
      copy.tournaments = tournaments;
      tournamentsList.push(copy);
    }
    for (let key = 0; key < tournamentsList.length; key += 1) {
      const copy = JSON.parse(JSON.stringify(tournamentsList[key]));
      const { tournaments } = copy;
      if (tournaments.length > 0) {
        for (let i = 0; i < tournaments.length; i += 1) {
          logger.info(tournaments[i].tournamentId);
          const events = await Event.aggregate([{
            $match: {
              tournamentsId: tournaments[i].tournamentId,
            },
          }, {
            $project: {
              eventId: 1,
              eventName: 1,
            },
          }]);
          tournamentsList[key].tournaments[i].events = events;
        }
      }
      logger.info(tournamentsList[key]);
    }
    res.status(200).json(tournamentsList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { sportsList, sideMenuList };
