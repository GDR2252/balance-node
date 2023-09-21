const mongoose = require('mongoose');

const { Schema } = mongoose;
const { paginate } = require('./plugins');

const b2cBankSchema = new Schema({
  sender_id: { // login id
    type: String,
    ref: 'User',
    required: true,
  },
  receiver_id: {
    type: String,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
  },
  message: {
    type: String,
  },
  method: {
    type: String,
  },
  username: {
    type: String,
  },
  balance: {
    type: Number,
  },
  remark: {
    type: String,
  },
}, { timestamps: true });

b2cBankSchema.plugin(paginate);

b2cBankSchema.statics.POPULATED_FIELDS = [
  {
    path: 'sender_id',
    select: 'username',
  },
  {
    path: 'receiver_id',
    select: 'username',
  },
];

module.exports = mongoose.model('B2cBankingLog', b2cBankSchema);
