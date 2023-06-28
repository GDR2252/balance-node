const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Market = require('../model/Market');

async function addMarkets(req, res) {
  const { marketId } = req.body;
  const { body } = req;
  logger.debug(body);
  const duplicate = await Market.findOne({ marketId }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add market. Market already present.' });
  try {
    const result = await Market.create({
      marketId,
      sportId: body.sportId,
      tournamentsId: body.tournamentsId,
      eventId: body.eventId,
      marketName: body.marketName,
      betLimit: body.betLimit,
      isFancy: body.isFancy || false,
      isBookmakers: body.isBookmakers || false,
      isStreaming: body.isStreaming || false,
      isVirtual: body.isVirtual || false,
      isSportsbook: body.isSportsbook || false,
      isCasinoGame: body.isCasinoGame || false,
      isPreBet: body.isPreBet || false,
    });
    logger.debug(result);
    res.status(201).json({ success: `New market ${marketId} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function fetchMarkets(req, res) {
  const { sportId } = req.query;
  const { tournamentsId } = req.query;
  const { eventId } = req.query;
  try {
    const result = await Market.find({ sportId, tournamentsId, eventId });
    logger.info(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateMarkets(req, res) {
  const { marketId } = req.body;
  const { body } = req;
  logger.debug(body);
  const data = await Market.findOne({ marketId }).exec();
  if (!data) return res.status(404).json({ message: 'Cannot update market. Market not present.' });
  try {
    const filter = { marketId };
    const update = {
      marketName: body.marketName,
      betLimit: body.betLimit,
      isFancy: body.isFancy,
      isBookmakers: body.isBookmakers,
      isStreaming: body.isStreaming,
      isVirtual: body.isVirtual,
      isSportsbook: body.isSportsbook,
      isCasinoGame: body.isCasinoGame,
      isPreBet: body.isPreBet,
    };
    const result = await Market.findOneAndUpdate(filter, update);
    logger.info(result);
    res.status(201).json({ success: `Market ${marketId} updated!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteMarkets(req, res) {
  const { marketId } = req.query;
  const data = await Market.findOne({ marketId }).exec();
  if (!data) return res.status(404).json({ message: 'Cannot delete market. Market not present.' });
  try {
    const result = await Market.deleteOne({
      marketId,
    });
    logger.debug(result);
    res.status(201).json({ success: `Market ${marketId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addMarkets, fetchMarkets, updateMarkets, deleteMarkets,
};
