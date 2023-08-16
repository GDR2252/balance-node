const mongoose = require('mongoose');

const { Schema } = mongoose;

const otpSchema = new Schema({
  mobile: {
    type: String,
  },
  otp: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('OTPManage', otpSchema);
