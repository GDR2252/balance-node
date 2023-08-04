const mongoose = require('mongoose');

const { Schema } = mongoose;

const stakeSchema = new Schema({
  username: {
    type: String,
  },
  stakes: [{
    type: Number,
    default: [100, 500, 1000, 5000, 10000, 50000, 100000, 200000],
  }],
}, { timestamps: true });

module.exports = mongoose.model('Stake', stakeSchema);
