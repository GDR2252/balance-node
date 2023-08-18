const mongoose = require('mongoose');

const { Schema } = mongoose;

const traderSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  roles: [{
    type: String,
    enum: ['Admin', 'Navigation', 'Trader', 'Manager', 'B2CTrader'],
  }],
  password: {
    type: String,
  },
  parentId: {
    type: Number,
  },
  origin: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Trader', traderSchema);
