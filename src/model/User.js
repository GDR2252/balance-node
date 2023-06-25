const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  username: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
  },
  roles: [{
    type: String,
    enum: ['Admin', 'WhiteLabel', 'Super', 'Master', 'Agent', 'User'],
  }],
  balance: {
    type: mongoose.Types.Decimal128,
  },
  exposureLimit: {
    type: Number,
  },
  password: {
    type: String,
  },
  parentId: {
    type: Number,
  },
  commision: {
    type: Number,
  },
  origin: {
    type: String,
  },
});

module.exports = mongoose.model('User', userSchema);
