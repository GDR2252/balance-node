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
        iconUrl: 1,
      },
    }]);
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
      } else {
        delete sportscopy[key];
      }
    }
    sportscopy = sportscopy.filter((value) => Object.keys(value).length !== 0);
    for (let key = 0; key < sportscopy.length; key += 1) {
      const { tournaments } = sportscopy[key];
      if (tournaments?.length > 0) {
        for (let i = 0; i < tournaments.length; i += 1) {
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
          if (events?.length > 0) {
            sportscopy[key].tournaments[i].events = events;
          } else {
            delete sportscopy[key].tournaments[i];
          }
        }
      }
    }
    const retresult = [];
    for (let result = 0; result < sportscopy.length; result += 1) {
      sportscopy[result].tournaments = sportscopy[result].tournaments
        .filter((value) => Object.keys(value).length !== 0);
      if (sportscopy[result].tournaments.length > 0) {
        retresult.push(sportscopy[result]);
      }
    }
    let json = JSON.parse(JSON.stringify(retresult).split('"sportId":').join('"id":'));
    json = JSON.parse(JSON.stringify(json).split('"sportName":').join('"name":'));
    json = JSON.parse(JSON.stringify(json).split('"tournaments":').join('"children":'));
    json = JSON.parse(JSON.stringify(json).split('"tournamentId":').join('"id":'));
    json = JSON.parse(JSON.stringify(json).split('"tournamentName":').join('"name":'));
    json = JSON.parse(JSON.stringify(json).split('"events":').join('"children":'));
    json = JSON.parse(JSON.stringify(json).split('"eventId":').join('"id":'));
    json = JSON.parse(JSON.stringify(json).split('"eventName":').join('"name":'));
    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { sportsList, sideMenuList };
