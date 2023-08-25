const mongoose = require('mongoose');
const { paginate } = require('./plugins');

const { Schema } = mongoose;

function getdecimal(value) {
  if (typeof value !== 'undefined') {
    return parseFloat(value.toString());
  }
  return value;
}

const cricketbetplaceSchema = new Schema({
  username: {
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
  marketType: {
    type: String,
  },
  stake: {
    type: String,
  },
  odds: {
    type: Schema.Types.Decimal128,
    get: getdecimal,
  },
  pl: {
    type: Schema.Types.Decimal128,
    get: getdecimal,
  },
  selectionId: {
    type: String,
  },
  selectionName: {
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
    default: 1,
  },
  sportId: {
    type: String,
    ref: 'Sport',
  },
  sportName: {
    type: String,
    ref: 'Sport',
  },
}, { timestamps: true });

cricketbetplaceSchema.plugin(paginate);
module.exports = mongoose.model('CricketBetPlace', cricketbetplaceSchema);
