const mongoose = require('mongoose');

const { Schema } = mongoose;

const eventSchema = new Schema({
  eventId: {
    type: String,
    required: true,
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
});

module.exports = mongoose.model('Event', eventSchema);
