const mongoose = require('mongoose');

const { Schema } = mongoose;

const cricketPLSchema = new Schema({
  exEventId: {
    type: String,
  },
  exMarketId: {
    type: String,
  },
  username: {
    type: String,
  },
  selectionId: [],
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
}, { timestamps: true });

module.exports = mongoose.model('CricketPL', cricketPLSchema);
