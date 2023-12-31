const mongoose = require('mongoose');

const { Schema } = mongoose;

const tournamentSchema = new Schema({
  tournamentId: {
    type: String,
    required: true,
  },
  sportId: {
    type: String,
  },
  tournamentName: {
    type: String,
  },
  highlight: {
    type: Boolean,
  },
  quicklink: {
    type: Boolean,
  },
  status: {
    type: Boolean,
  },
  sequence: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
