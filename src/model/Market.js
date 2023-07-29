const mongoose = require('mongoose');

const { Schema } = mongoose;

const marketSchema = new Schema({
  marketId: {
    type: String,
    required: true,
  },
  sportId: {
    type: String,
  },
  tournamentsId: {
    type: String,
  },
  eventId: {
    type: String,
  },
  exMarketId: {
    type: String,
  },
  marketName: {
    type: String,
  },
  marketTime: {
    type: Date,
  },
  betLimit: {
    type: String,
  },
  isFancy: {
    type: Boolean,
  },
  isBookmakers: {
    type: Boolean,
  },
  isStreaming: {
    type: Boolean,
  },
  isVirtual: {
    type: Boolean,
  },
  isSportsbook: {
    type: Boolean,
  },
  isCasinoGame: {
    type: Boolean,
  },
  isPreBet: {
    type: Boolean,
  },
});

module.exports = mongoose.model('Market', marketSchema);
