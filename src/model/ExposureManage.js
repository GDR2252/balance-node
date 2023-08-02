const mongoose = require('mongoose');

const { Schema } = mongoose;

const betlimitSchema = new Schema({
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
});

module.exports = mongoose.model('ExposureManage', betlimitSchema);
