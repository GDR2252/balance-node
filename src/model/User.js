const mongoose = require('mongoose');

const { Schema } = mongoose;

function getdecimal(value) {
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
    get: getdecimal,
  },
  redeemBalance: {
    type: Schema.Types.Decimal128,
    default: 0,
    get: getdecimal,
  },
  creditReference: {
    type: Schema.Types.Decimal128,
    default: 0,
    get: getdecimal,
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
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'B2cUser',
  },
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
  selfReferral: {
    type: String,
  },
  registeredReferral: {
    type: String,
  },
});

module.exports = mongoose.model('User', userSchema);
