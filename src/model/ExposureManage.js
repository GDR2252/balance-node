const mongoose = require('mongoose');

const { Schema } = mongoose;

const exposureManageSchema = new Schema({
  exEventId: {
    type: String,
  },
  exMarketId: {
    type: String,
  },
  username: {
    type: String,
  },
  exposure: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('ExposureManage', exposureManageSchema);
