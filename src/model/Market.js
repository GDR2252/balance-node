const mongoose = require('mongoose');

const { Schema } = mongoose;

const marketSchema = new Schema({
  marketId: {
    type: String,
    required: true,
  },
  marketName: {
    type: String,
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
