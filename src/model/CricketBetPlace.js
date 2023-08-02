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
  lay: {
    type: String,
  },
  back: {
    type: String,
  },
});

module.exports = mongoose.model('CricketBetPlace', cricketbetplaceSchema);
