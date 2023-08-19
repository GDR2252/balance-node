const mongoose = require('mongoose');

const { Schema } = mongoose;

const cricketresultsSchema = new Schema({
  eventName: {
    type: String,
  },
  exEventId: {
    type: String,
  },
  exMarketId: {
    type: String,
  },
  marketType: {
    type: String,
  },
  winner: {
    type: String,
  },
  sportName: {
    type: String,
  },
  sportsId: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('CricketResult', cricketresultsSchema);
