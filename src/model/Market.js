const mongoose = require('mongoose');

const { Schema } = mongoose;

const marketSchema = new Schema({
  marketId: {
    type: String,
    required: true,
  },
  marketName: {
    type: String,
  },
  betLimit: {
    type: String,
  },
});

module.exports = mongoose.model('Market', marketSchema);
