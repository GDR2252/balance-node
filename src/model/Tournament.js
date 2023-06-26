const mongoose = require('mongoose');

const { Schema } = mongoose;

const tournamentSchema = new Schema({
  tournamentId: {
    type: String,
    required: true,
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
});

module.exports = mongoose.model('Tournament', tournamentSchema);
