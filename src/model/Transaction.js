const mongoose = require('mongoose');

const { Schema } = mongoose;
const { paginate } = require('./plugins');

const transcationSchema = new Schema({
  fromId: { // login id
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  remark: {
    type: String,
  },
  newBalance: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

transcationSchema.plugin(paginate);

transcationSchema.statics.POPULATED_FIELDS = [
  {
    path: 'fromId',
    select: 'username',
  },
  {
    path: 'toId',
    select: 'username',
  },
];
module.exports = mongoose.model('Transcation', transcationSchema);
