const mongoose = require('mongoose');

const { Schema } = mongoose;

const matchruleSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  id: {
    type: String,
  },
  highlight: {
    type: Boolean,
    default: false,
  },
  parentId: [{
    type: String,
    default: null,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Matchrule', matchruleSchema);
