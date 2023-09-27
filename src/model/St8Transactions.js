const mongoose = require('mongoose');

const { Schema } = mongoose;

const st8TransactionSchema = new Schema({
  username: {
    type: String,
  },
  amount: {
    type: Number,
    default: 0
  },
  pl: {
    type: Number,
    default: 0
  },
  developer_code: {
    type: String,
  },
  game_code: {
    type: String,
  },
  round: {
    type: String,
  },
  player: {
    type: String,
  },
  bonus: {
    type: Number,
    default: 0
  },
  processed_at: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('St8Transaction', st8TransactionSchema);
