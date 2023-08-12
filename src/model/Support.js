const mongoose = require('mongoose');

const { Schema } = mongoose;

const supportSchema = new Schema({
  origin: {
    type: String,
  },
  contact: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Support', supportSchema);
