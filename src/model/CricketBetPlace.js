const mongoose = require('mongoose');

const { Schema } = mongoose;

const cricketbetplaceSchema = new Schema({
  username: {
    type: String,
  },
  exEventId: {
    type: String,
  },
  exMarketId: {
    type: String,
  },
  stake: {
    type: String,
  },
  selectionId: {
    type: String,
  },
  type: {
    type: String,
  },
  IsSettle: {
    type: Number,
    default: 0,
  },
  IsVoid: {
    type: Number,
    default: 0,
  },
  IsUnsettle: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('CricketBetPlace', cricketbetplaceSchema);
