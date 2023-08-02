const mongoose = require('mongoose');

const { Schema } = mongoose;

const activitySchema = new Schema({
  username: {
    type: String,
  },
  ip: {
    type: String,
  },
  detail: {
    type: String,
  },
  status: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activitySchema);
