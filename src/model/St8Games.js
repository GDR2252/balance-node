const mongoose = require('mongoose');

const { Schema } = mongoose;

const st8GamesSchema = new Schema({
  games: {
    type: Object,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('St8Game', st8GamesSchema);
