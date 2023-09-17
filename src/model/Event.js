const mongoose = require('mongoose');

const { Schema } = mongoose;

const eventSchema = new Schema({
  eventId: {
    type: String,
    required: true,
  },
  exEventId: {
    type: String,
  },
  spreadexId: {
    type: String,
  },
  sportId: {
    type: String,
  },
  tournamentsId: {
    type: String,
  },
  tournamentsName: {
    type: String,
  },
  eventName: {
    type: String,
  },
  highlight: {
    type: Boolean,
  },
  quicklink: {
    type: Boolean,
  },
  popular: {
    type: Boolean,
  },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
