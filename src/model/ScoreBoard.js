const mongoose = require('mongoose');

const { Schema } = mongoose;

const scoreBoardSchema = new Schema({
  matchId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('ScoreBoard', scoreBoardSchema);
