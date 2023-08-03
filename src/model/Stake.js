const mongoose = require('mongoose');

const { Schema } = mongoose;

const stakeSchema = new Schema({
  username: {
    type: String,
  },
  stakes: [{
    type: Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Stake', stakeSchema);
