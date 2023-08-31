const mongoose = require('mongoose');

const { Schema } = mongoose;

const scoreBoardSchema = new Schema({
  spreadexId: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('ScoreBoard', scoreBoardSchema);
