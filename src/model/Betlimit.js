const mongoose = require('mongoose');

const { Schema } = mongoose;

const betlimitSchema = new Schema({
  betlimit: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Betlimit', betlimitSchema);
