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
});

module.exports = mongoose.model('Sport', sportSchema);
