const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
    },
    username: {
      type: String,
      required: true,
    },
    roles: [
      {
        type: String,
        enum: ['Admin', 'Manager', 'Trader'],
      },
    ],
    refreshToken: {
      type: String,
    },
    password: {
      type: String,
    },
    mobile: {
      type: String,
    },
    balance: {
      type: Number,
    },
    origin: {
      type: String,
    },
    accessToken: {
      type: String,
    },
    activity: {
      type: String,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'B2cuser',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    deposit_image: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('B2cuser', userSchema);
