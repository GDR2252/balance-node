const mongoose = require('mongoose');

const { Schema } = mongoose;

const selectionSchema = new Schema({
  selectionId: {
    type: String,
  },
  selectionName: {
    type: String,
  },
  sportsId: {
    type: String,
  },
  marketTime: {
    type: String,
  },
});

module.exports = mongoose.model('Selection', selectionSchema);
