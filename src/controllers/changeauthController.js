const bcrypt = require('bcrypt');
const Trader = require('../model/Trader');
require('dotenv').config();

async function changepass(req, res) {
  const { oldPwd, pwd } = req.body;
  if (!oldPwd || !pwd) return res.status(400).json({ message: 'Old Password and New Password are required.' });
  const foundUser = await Trader.findOne({ username: req.user }).exec();
  if (!foundUser) return res.status(401).json({ message: 'Old password is incorrect.' });
  const match = await bcrypt.compare(oldPwd, foundUser.password);
  if (match) {
    const hashedPwd = await bcrypt.hash(pwd, 10);
    foundUser.password = hashedPwd;
    await foundUser.save();
    res.status(201).json({ success: 'New password updated successfully!' });
  } else {
    res.status(401).json({ message: 'Old password is incorrect.' });
  }
}

module.exports = { changepass };
