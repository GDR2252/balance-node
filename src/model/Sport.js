const mongoose = require('mongoose');

const { Schema } = mongoose;

const sportSchema = new Schema({
  sportId: {
    type: String,
    required: true,
  },
  sportName: {
    type: String,
  },
  highlight: {
    type: Boolean,
  },
  popular: {
    type: Boolean,
  },
  other: {
    type: Boolean,
  },
  status: {
    type: Boolean,
  },
  sequence: {
    type: String,
  },
  iconUrl: {
    type: String,
  },
  url: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Sport', sportSchema);
