const path = require('path');
const crypto = require('crypto');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Event = require('../model/Event');
const Market = require('../model/Market');

async function addEvents(req, res) {
  const { eventId } = req.body;
  const { body } = req;
  logger.debug(body);
  const duplicate = await Event.findOne({ eventId }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add event. Event already present.' });
  try {
    const result = await Event.create({
      eventId,
      exEventId: crypto.randomBytes(16).toString('hex'),
      sportId: body.sportId,
      tournamentsId: body.tournamentsId,
      tournamentsName: body.tournamentsName,
      eventName: body.eventName,
      highlight: body.highlight || false,
      quicklink: body.quicklink || false,
      popular: body.popular || false,
    });
    logger.debug(result);
    res.status(201).json({ success: `New event ${eventId} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function fetchEvents(req, res) {
  const { sportId } = req.query;
  const { tournamentsId } = req.query;
  try {
    const result = await Event.find({ sportId, tournamentsId });
    logger.debug(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateEvents(req, res) {
  const { eventId } = req.body;
  const { body } = req;
  logger.debug(body);
  const data = await Event.findOne({ eventId }).exec();
  if (!data) return res.status(404).json({ message: 'Cannot update event. Event not present.' });
  try {
    const filter = { eventId };
    const update = {
      eventName: body.eventName,
      highlight: body.highlight,
      quicklink: body.quicklink,
      popular: body.popular,
    };
    const result = await Event.findOneAndUpdate(filter, update);
    logger.info(result);
    res.status(201).json({ success: `Event ${eventId} updated!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteEvents(req, res) {
  const { eventId } = req.query;
  const data = await Event.findOne({ eventId }).exec();
  if (!data) return res.status(404).json({ message: 'Cannot delete event. Event not present.' });
  const marketdata = await Market.findOne({ eventId }).exec();
  if (marketdata) return res.status(409).json({ message: 'Cannot delete event. Associated market data present.' });
  try {
    const result = await Event.deleteOne({
      eventId,
    });
    logger.debug(result);
    res.status(201).json({ success: `Tournament ${eventId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addEvents, fetchEvents, updateEvents, deleteEvents,
};
