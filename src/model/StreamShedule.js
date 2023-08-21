const mongoose = require('mongoose');

const { Schema } = mongoose;

const streamSheduleSchema = new Schema({
  MatchID: {
    type: Number,
  },
  Channel: {
    type: String,
  },
  Name: {
    type: String,
  },
  Home: {
    type: String,
  },
  Away: {
    type: String,
  },
  Type: {
    type: String,
  },
  League: {
    type: String,
  },
  bid: {
    type: String,
  },
  TimeStart: {
    type: String,
  },
  NowPlaying: {
    type: Number,
  },
  IsLive: {
    type: Number,
  },
  State: {
    type: String,
  },
  UTCTimeStart: {
    type: Number,
  },
});

module.exports = mongoose.model('StreamShedule', streamSheduleSchema);
