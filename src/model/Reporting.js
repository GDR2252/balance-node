const mongoose = require('mongoose');

const { Schema } = mongoose;
const { paginate } = require('./plugins');

const reportingBetSchema = new Schema({
  sportId: {
    type: String,
  },
  sportName: {
    type: String,
  },
  exEventId: {
    type: String,
  },
  eventName: {
    type: String,
  },
  exMarketId: {
    type: String,
  },
  result: {
    type: String,
  },
  username: {
    type: String,
  },
  pl: {
    type: Number,
  },
  marketName: {
    type: String,
  },
}, { timestamps: true });

reportingBetSchema.plugin(paginate);
module.exports = mongoose.model('Reportings', reportingBetSchema);
