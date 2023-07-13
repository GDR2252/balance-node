const mongoose = require('mongoose');

const { Schema } = mongoose;

function getBalance(value) {
  if (typeof value !== 'undefined') {
     return parseFloat(value.toString());
  }
  return value;
}

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
    type: String,
  },
  roles: [{
    type: String,
    enum: ['Admin', 'WhiteLabel', 'Super', 'Master', 'Agent', 'User'],
  }],
  balance: {
    type: Schema.Types.Decimal128,
    default: 0,
    get: getBalance,
  },
  exposureLimit: {
    type: Number,
    default: 0,
  },
  password: {
    type: String,
  },
  parentId: [{
    type: Number,
  }],
  level: {
    type: Number,
  },
  commision: {
    type: Number,
  },
  origin: {
    type: String,
  },
  ip: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
});

module.exports = mongoose.model('User', userSchema);
